import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const imports = await prisma.import.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(imports);
}
