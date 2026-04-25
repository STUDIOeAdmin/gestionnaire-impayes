import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

/**
 * Parse une date au format français DD/MM/YYYY vers un objet Date (midi UTC
 * pour éviter les décalages de fuseau). Retourne null si la date est invalide.
 */
function parseDateFR(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  const s = String(value).trim();
  // Format DD/MM/YYYY ou DD-MM-YYYY
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (m) {
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    const year = parseInt(m[3], 10);
    const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    if (!isNaN(d.getTime()) && d.getUTCDate() === day && d.getUTCMonth() === month - 1) {
      return d;
    }
  }
  // Format ISO YYYY-MM-DD
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const d = new Date(Date.UTC(parseInt(iso[1]), parseInt(iso[2]) - 1, parseInt(iso[3]), 12, 0, 0));
    if (!isNaN(d.getTime())) return d;
  }
  // Excel serial number
  const num = Number(s);
  if (!isNaN(num) && num > 20000 && num < 80000) {
    const d = new Date(Date.UTC(1899, 11, 30) + num * 86400000);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: 'buffer' });

    // On cherche la feuille "BdD Membres" en priorité, sinon la première
    const sheetName =
      wb.SheetNames.find(n => n.toLowerCase().includes('membres')) ?? wb.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json({ error: 'Aucune feuille trouvée' }, { status: 400 });
    }
    const ws = wb.Sheets[sheetName];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      defval: null,
      raw: false,
    });

    // Localiser dynamiquement les en-têtes (tolérant aux variations)
    let headerIdx = -1;
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      const cells = (rows[i] ?? []).map(c => String(c ?? '').toLowerCase());
      if (cells.some(c => c.includes('dossier')) && cells.some(c => c.includes('naissance'))) {
        headerIdx = i;
        break;
      }
    }
    if (headerIdx === -1) {
      return NextResponse.json(
        { error: 'En-têtes introuvables (colonnes "N° de dossier" et "Date de naissance" requises)' },
        { status: 400 }
      );
    }

    const headers = (rows[headerIdx] ?? []).map(c => String(c ?? '').toLowerCase().replace(/\s+/g, ' ').trim());
    const idxDossier = headers.findIndex(h => h.includes('dossier'));
    const idxNaissance = headers.findIndex(h => h.includes('naissance'));
    if (idxDossier === -1 || idxNaissance === -1) {
      return NextResponse.json({ error: 'Colonnes requises manquantes' }, { status: 400 });
    }

    // Pré-charger tous les adhérents (1 requête) → map par numeroDossier
    const adherents = await prisma.adherent.findMany({
      select: { id: true, numeroDossier: true },
    });
    const mapByDossier = new Map<number, string>(
      adherents.map((a) => [a.numeroDossier, a.id])
    );

    let skipped = 0;
    const notFoundList: number[] = [];
    const toUpdate: Array<{ id: string; date: Date }> = [];

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;
      const rawDossier = row[idxDossier];
      if (rawDossier === null || rawDossier === undefined || rawDossier === '') {
        skipped++;
        continue;
      }
      const numeroDossier = parseInt(String(rawDossier).trim(), 10);
      if (isNaN(numeroDossier)) {
        skipped++;
        continue;
      }
      const date = parseDateFR(row[idxNaissance]);
      if (!date) {
        skipped++;
        continue;
      }

      const adherentId = mapByDossier.get(numeroDossier);
      if (!adherentId) {
        notFoundList.push(numeroDossier);
        continue;
      }
      toUpdate.push({ id: adherentId, date });
    }

    // Exécuter les updates par lots de 50 en parallèle
    const BATCH_SIZE = 50;
    for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
      const batch = toUpdate.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(({ id, date }) =>
          prisma.adherent.update({ where: { id }, data: { dateNaissance: date } })
        )
      );
    }
    const updated = toUpdate.length;
    const notFound = notFoundList.length;

    return NextResponse.json({
      success: true,
      updated,
      notFound,
      skipped,
      notFoundList: notFoundList.slice(0, 50),
    });
  } catch (error: any) {
    console.error('[import-dates-naissance]', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'import', details: error.message },
      { status: 500 }
    );
  }
}
