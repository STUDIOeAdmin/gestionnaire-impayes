import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const adherent = await prisma.adherent.findUnique({
    where: { id },
    include: {
      contacts: { orderBy: { date: 'desc' } },
      impayes: {
        orderBy: { createdAt: 'desc' },
        include: { import: { select: { nomFichier: true, dateExtract: true } } },
      },
    },
  });

  if (!adherent) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });
  return NextResponse.json(adherent);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const allowed = ['statut', 'nom', 'prenom', 'famille'];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  const adherent = await prisma.adherent.update({ where: { id }, data });
  return NextResponse.json(adherent);
}
