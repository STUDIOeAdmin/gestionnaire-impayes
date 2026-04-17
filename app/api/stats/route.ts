import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const [statuts, dernierImport, totaux] = await Promise.all([
    prisma.adherent.groupBy({ by: ['statut'], _count: { _all: true } }),
    prisma.import.findFirst({ orderBy: { createdAt: 'desc' }, select: { nomFichier: true, createdAt: true } }),
    prisma.impaye.aggregate({
      _sum: { resteAPayer: true },
      where: { resteAPayer: { gt: 0 } },
    }),
  ]);

  const tropPercuSum = await prisma.impaye.aggregate({
    _sum: { resteAPayer: true },
    where: {
      resteAPayer: { lt: 0 },
      adherent: { statut: 'TROP_PERCU' },
    },
  });

  const counts: Record<string, number> = {};
  for (const s of statuts) counts[s.statut] = s._count._all;

  return NextResponse.json({
    totalAdherents: Object.values(counts).reduce((a, b) => a + b, 0),
    impayes: counts['IMPAYES'] ?? 0,
    enCours: counts['EN_COURS'] ?? 0,
    tropPercus: counts['TROP_PERCU'] ?? 0,
    regularises: counts['REGULARISE'] ?? 0,
    totalAPayer: totaux._sum.resteAPayer ?? 0,
    totalTropPercu: Math.abs(tropPercuSum._sum.resteAPayer ?? 0),
    dernierImport,
  });
}
