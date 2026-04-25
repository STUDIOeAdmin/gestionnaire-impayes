import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Mots-clés identifiant un paiement mensualisé dans le commentaire GIPSE
const MENSUALISE_KEYWORDS = ['vir permanent', 'mensualit', 'vir perm'];

function isMensualise(commentaire: string | null): boolean {
  if (!commentaire) return false;
  const lower = commentaire.toLowerCase();
  return MENSUALISE_KEYWORDS.some(kw => lower.includes(kw));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.trim() ?? '';
  const statut = searchParams.get('statut') ?? '';
  const exclureMensualises = searchParams.get('exclureMensualises') === '1';
  const seulementDemarches = searchParams.get('seulementDemarches') === '1';
  const exclureDemarches = searchParams.get('exclureDemarches') === '1';

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

  const typesDemarche = ['MAIL', 'SMS', 'TEL'];

  if (seulementDemarches) {
    where.contacts = { some: { type: { in: typesDemarche } } };
  } else if (exclureDemarches) {
    where.contacts = { none: { type: { in: typesDemarche } } };
  }

  const adherents = await prisma.adherent.findMany({
    where,
    include: {
      impayes: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { resteAPayer: true, totalDu: true, totalPaye: true, dontAvoir: true, cours: true, commentaireInit: true },
      },
      _count: { select: { contacts: true } },
    },
    orderBy: { nom: 'asc' },
  });

  // Index famille → membres pour les sous-titres
  const familleIndex = new Map<string, { prenom: string; numeroDossier: number; id: string }[]>();
  for (const a of adherents) {
    if (!a.famille) continue;
    if (!familleIndex.has(a.famille)) familleIndex.set(a.famille, []);
    familleIndex.get(a.famille)!.push({ prenom: a.prenom, numeroDossier: a.numeroDossier, id: a.id });
  }

  let result = adherents.map(a => ({
    id: a.id,
    numeroDossier: a.numeroDossier,
    nom: a.nom,
    prenom: a.prenom,
    dateNaissance: a.dateNaissance,
    famille: a.famille,
    familleMembers: a.famille
      ? (familleIndex.get(a.famille) ?? []).filter(m => m.id !== a.id)
      : [],
    statut: a.statut,
    updatedAt: a.updatedAt,
    dernierImpaye: a.impayes[0] ?? null,
    nbContacts: a._count.contacts,
    mensualise: isMensualise(a.impayes[0]?.commentaireInit ?? null),
  }));

  // Filtre : exclure les paiements mensualisés (post-traitement car basé sur le commentaire)
  if (exclureMensualises) {
    result = result.filter(a => !a.mensualise);
  }

  return NextResponse.json(result);
}
