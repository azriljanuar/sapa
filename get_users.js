require('dotenv').config();
const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log(users.map(u => ({ email: u.email, role: u.role })));
  await prisma.$disconnect();
}

main();
