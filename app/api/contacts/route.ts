import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const { adherentId, type, note } = await req.json();
  if (!adherentId || !type) {
    return NextResponse.json({ error: 'adherentId et type requis' }, { status: 400 });
  }

  const contact = await prisma.contact.create({
    data: { adherentId, type, note: note || null },
  });

  // Si on marque comme régularisé, mettre à jour le statut de l'adhérent
  if (type === 'REGULARISE') {
    await prisma.adherent.update({
      where: { id: adherentId },
      data: { statut: 'REGULARISE' },
    });
  }

  return NextResponse.json(contact);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  await prisma.contact.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
