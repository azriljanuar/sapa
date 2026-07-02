import { prisma } from "./src/lib/prisma";

async function main() {
  const users = await prisma.user.findMany();
  console.log(users.map(u => ({ email: u.email, role: u.role, password: u.password })));
  await prisma.$disconnect();
}

main();
