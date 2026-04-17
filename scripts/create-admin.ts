import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = process.argv[2] || 'admin';
  const password = process.argv[3] || 'admin123';

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { username },
    update: { password: hashedPassword },
    create: {
      username,
      password: hashedPassword,
      name: 'Administrateur',
      role: 'ADMIN',
    },
  });

  console.log('✅ Utilisateur admin créé :');
  console.log(`   Identifiant : ${user.username}`);
  console.log(`   Mot de passe : ${password}`);
  console.log('\n⚠️  Changez ce mot de passe dès que possible !');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
