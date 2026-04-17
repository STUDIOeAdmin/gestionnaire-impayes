import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

const MENSUALISE_KEYWORDS = ['vir permanent', 'mensualit', 'vir perm'];
function isMensualise(commentaire: string | null): boolean {
  if (!commentaire) return false;
  const lower = commentaire.toLowerCase();
  return MENSUALISE_KEYWORDS.some(kw => lower.includes(kw));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const statut = searchParams.get('statut') ?? 'tous';
  const format = searchParams.get('format') ?? 'complet'; // 'complet' | 'simple'
  const exclureMensualises = searchParams.get('exclureMensualises') === '1';
  const seulementDemarches = searchParams.get('seulementDemarches') === '1';
  const exclureDemarches = searchParams.get('exclureDemarches') === '1';

  const typesDemarche = ['MAIL', 'SMS', 'TEL'];
  const where: Record<string, unknown> = statut !== 'tous' ? { statut } : {};

  if (seulementDemarches) {
    where.contacts = { some: { type: { in: typesDemarche } } };
  } else if (exclureDemarches) {
    where.contacts = { none: { type: { in: typesDemarche } } };
  }

  let adherents = await prisma.adherent.findMany({
    where,
    include: {
      impayes: { orderBy: { createdAt: 'desc' }, take: 1 },
      contacts: { orderBy: { date: 'desc' }, take: 1 },
    },
    orderBy: { nom: 'asc' },
  });

  if (exclureMensualises) {
    adherents = adherents.filter(a => !isMensualise(a.impayes[0]?.commentaireInit ?? null));
  }

  let ws: XLSX.WorkSheet;
  let sheetName: string;

  if (format === 'simple') {
    const rows = adherents.map(a => ({
      'N° dossier': a.numeroDossier,
      'Nom': `${a.nom}, ${a.prenom}`,
      'Reste à payer (€)': a.impayes[0]?.resteAPayer ?? '',
    }));
    ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 18 }];
    sheetName = 'Relances';
  } else {
    const rows = adherents.map(a => {
      const imp = a.impayes[0];
      const derniereAction = a.contacts[0];
      return {
        'N° dossier': a.numeroDossier,
        'Nom': a.nom,
        'Prénom': a.prenom,
        'Famille': a.famille ?? '',
        'Cours': imp?.cours ?? '',
        'Total dû (€)': imp?.totalDu ?? '',
        'Total payé (€)': imp?.totalPaye ?? '',
        'Dont avoir (€)': imp?.dontAvoir ?? '',
        'Reste à payer (€)': imp?.resteAPayer ?? '',
        'Statut': a.statut,
        'Nb relances': a.contacts.length,
        'Dernière action': derniereAction
          ? `${new Date(derniereAction.date).toLocaleDateString('fr-FR')} — ${derniereAction.type}${derniereAction.note ? ` : ${derniereAction.note}` : ''}`
          : '',
        'Commentaire initial (GIPSE)': imp?.commentaireInit ?? '',
      };
    });
    ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 12 }, { wch: 20 }, { wch: 16 }, { wch: 20 }, { wch: 30 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 14 },
      { wch: 12 }, { wch: 40 }, { wch: 50 },
    ];
    sheetName = 'Impayés';
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const date = new Date().toISOString().split('T')[0];
  const filename = `impayes-${format === 'simple' ? 'relances' : statut}-${date}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
