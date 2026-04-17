import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const statut = searchParams.get('statut') ?? 'tous';

  const where = statut !== 'tous' ? { statut } : {};

  const adherents = await prisma.adherent.findMany({
    where,
    include: {
      impayes: { orderBy: { createdAt: 'desc' }, take: 1 },
      contacts: { orderBy: { date: 'desc' }, take: 1 },
    },
    orderBy: { nom: 'asc' },
  });

  const rows = adherents.map(a => {
    const imp = a.impayes[0];
    const derniereAction = a.contacts[0];
    return {
      'Nom': a.nom,
      'Prénom': a.prenom,
      'N° dossier': a.numeroDossier,
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

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Impayés');

  // Largeurs de colonnes
  ws['!cols'] = [
    { wch: 20 }, { wch: 16 }, { wch: 12 }, { wch: 20 }, { wch: 30 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 14 },
    { wch: 12 }, { wch: 40 }, { wch: 50 },
  ];

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const date = new Date().toISOString().split('T')[0];
  const filename = `impayes-${statut}-${date}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
