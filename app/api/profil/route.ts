import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { ancienMotDePasse, nouveauMotDePasse } = await req.json();

  if (!ancienMotDePasse || !nouveauMotDePasse) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
  }

  if (nouveauMotDePasse.length < 8) {
    return NextResponse.json({ error: 'Le nouveau mot de passe doit faire au moins 8 caractères' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });

  const valid = await bcrypt.compare(ancienMotDePasse, user.password);
  if (!valid) {
    return NextResponse.json({ error: 'Ancien mot de passe incorrect' }, { status: 400 });
  }

  const hash = await bcrypt.hash(nouveauMotDePasse, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hash } });

  return NextResponse.json({ success: true });
}
