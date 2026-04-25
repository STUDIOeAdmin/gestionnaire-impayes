import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

interface RowNom {
  nom: string;
  prenom: string;
  numeroDossier: number;
  famille: string | null;
  totalDu: number;
  dontRbst: number;
  totalPaye: number;
  dontAvoir: number;
  resteAPayer: number;
  commentaire: string | null;
}

interface RowCours {
  numeroDossier: number;
  cours: string;
}

function parseNom(raw: string): { nom: string; prenom: string } {
  const parts = raw.split(',').map(s => s.trim());
  return { nom: parts[0] ?? '', prenom: parts[1] ?? '' };
}

function toFloat(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = parseFloat(String(v));
  return isNaN(n) ? 0 : n;
}

function parseSheet(wb: XLSX.WorkBook): { rows: RowNom[]; coursByDossier: Map<number, string> } {
  // Feuille "Tri par nom"
  // xlsx supprime la colonne A (vide) — indices décalés de -1 vs openpyxl
  // En-tête index 7, données à partir de index 8
  // r[0]=Nom,Prénom  r[1]=N°dossier  r[2]=Famille  r[3]=TotalDû  r[4]=dontRbst
  // r[5]=TotalPayé   r[6]=dontAvoir  r[7]=ResteàPayer  r[10]=Commentaires
  const wsNom = wb.Sheets['Tri par nom'];
  const rawNom: unknown[][] = XLSX.utils.sheet_to_json(wsNom, { header: 1, defval: null });

  const rows: RowNom[] = [];
  for (let i = 8; i < rawNom.length; i++) {
    const r = rawNom[i] as unknown[];
    const nomRaw = r[0];
    const dossierRaw = r[1];
    if (!nomRaw || typeof nomRaw !== 'string') continue;
    const dossier = Math.round(toFloat(dossierRaw));
    if (!dossier) continue;

    const { nom, prenom } = parseNom(nomRaw);
    const famille = r[2] ? String(r[2]).trim() : null;
    const totalDu = toFloat(r[3]);
    const dontRbst = toFloat(r[4]);
    const totalPaye = toFloat(r[5]);
    const dontAvoir = toFloat(r[6]);
    const resteAPayer = toFloat(r[7]);
    const commentaire = r[10] ? String(r[10]).trim() : null;

    rows.push({ nom, prenom, numeroDossier: dossier, famille, totalDu, dontRbst, totalPaye, dontAvoir, resteAPayer, commentaire });
  }

  // Feuille "Tri par cours"
  // r[0]=Cours  r[1]=N°dossier  r[2]=Nom,Prénom  r[3]=Famille ...
  // En-tête index 3, données à partir de index 4
  const wsCours = wb.Sheets['Tri par cours'];
  const coursByDossier = new Map<number, string>();
  if (wsCours) {
    const rawCours: unknown[][] = XLSX.utils.sheet_to_json(wsCours, { header: 1, defval: null });
    for (let i = 4; i < rawCours.length; i++) {
      const r = rawCours[i] as unknown[];
      const cours = r[0];
      const dossierRaw = r[1];
      if (!cours || typeof cours !== 'string') continue;
      const dossier = Math.round(toFloat(dossierRaw));
      if (!dossier || coursByDossier.has(dossier)) continue;
      coursByDossier.set(dossier, cours.trim());
    }
  }

  return { rows, coursByDossier };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: 'buffer' });

    const { rows, coursByDossier } = parseSheet(wb);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Aucune donnée trouvée dans le fichier' }, { status: 422 });
    }

    // Totaux pour le résumé d'import
    const totalAPayer = rows.filter(r => r.resteAPayer > 0).reduce((s, r) => s + r.resteAPayer, 0);
    const totalTropPercu = Math.abs(rows.filter(r => r.resteAPayer < 0).reduce((s, r) => s + r.resteAPayer, 0));

    const importRecord = await prisma.import.create({
      data: {
        nomFichier: file.name,
        nbAdherents: rows.length,
        totalAPayer,
        totalTropPercu,
      },
    });

    let created = 0;
    let updated = 0;

    for (const row of rows) {
      // Statut automatique basé sur le solde
      let statut: string;
      if (row.resteAPayer < 0) statut = 'TROP_PERCU';
      else if (row.resteAPayer === 0) statut = 'REGULARISE';
      else statut = 'IMPAYES';

      const existing = await prisma.adherent.findUnique({ where: { numeroDossier: row.numeroDossier } });

      let adherentId: string;
      if (existing) {
        // Ne pas écraser un statut EN_COURS ou REGULARISE géré manuellement
        const keepStatut = existing.statut === 'REGULARISE' && statut !== 'REGULARISE'
          ? existing.statut
          : statut;
        await prisma.adherent.update({
          where: { id: existing.id },
          data: { nom: row.nom, prenom: row.prenom, famille: row.famille, statut: keepStatut },
        });
        adherentId = existing.id;
        updated++;
      } else {
        const created_ = await prisma.adherent.create({
          data: { numeroDossier: row.numeroDossier, nom: row.nom, prenom: row.prenom, famille: row.famille, statut },
        });
        adherentId = created_.id;
        created++;
      }

      // Supprimer les anciens impayés pour cet adhérent (le nouvel import écrase)
      await prisma.impaye.deleteMany({ where: { adherentId } });

      await prisma.impaye.create({
        data: {
          adherentId,
          importId: importRecord.id,
          cours: coursByDossier.get(row.numeroDossier) ?? null,
          totalDu: row.totalDu,
          dontRbst: row.dontRbst,
          totalPaye: row.totalPaye,
          dontAvoir: row.dontAvoir,
          resteAPayer: row.resteAPayer,
          commentaireInit: row.commentaire,
        },
      });
    }

    return NextResponse.json({
      success: true,
      importId: importRecord.id,
      nbAdherents: rows.length,
      created,
      updated,
      totalAPayer,
      totalTropPercu,
    });
  } catch (err) {
    console.error('[IMPORT]', err);
    return NextResponse.json({ error: 'Erreur lors du traitement du fichier' }, { status: 500 });
  }
}
