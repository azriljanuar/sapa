import prisma from './src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const hash = bcrypt.hashSync('password123', 10);
  await prisma.santri.updateMany({data: {password: hash}});
  await prisma.guru.updateMany({data: {password: hash}});
  console.log('Done updating DB with true password123 hash');
}

main().catch(console.error);
