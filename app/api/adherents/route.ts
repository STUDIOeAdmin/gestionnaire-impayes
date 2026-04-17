import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.trim() ?? '';
  const statut = searchParams.get('statut') ?? '';

  const where: Record<string, unknown> = {};

  if (statut) where.statut = statut;

  if (search) {
    const num = parseInt(search);
    where.OR = [
      { nom: { contains: search, mode: 'insensitive' } },
      { prenom: { contains: search, mode: 'insensitive' } },
      ...(isNaN(num) ? [] : [{ numeroDossier: num }]),
    ];
  }

  const adherents = await prisma.adherent.findMany({
    where,
    include: {
      impayes: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { resteAPayer: true, totalDu: true, totalPaye: true, dontAvoir: true, cours: true },
      },
      _count: { select: { contacts: true } },
    },
    orderBy: { nom: 'asc' },
  });

  const result = adherents.map(a => ({
    id: a.id,
    numeroDossier: a.numeroDossier,
    nom: a.nom,
    prenom: a.prenom,
    famille: a.famille,
    statut: a.statut,
    updatedAt: a.updatedAt,
    dernierImpaye: a.impayes[0] ?? null,
    nbContacts: a._count.contacts,
  }));

  return NextResponse.json(result);
}
