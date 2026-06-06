const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();
async function deleteAllGurus() {
  try {
    const gurus = await prisma.guru.findMany({ select: { id: true } });
    await prisma.$transaction(gurus.map(g => prisma.guru.delete({ where: { id: g.id } })));
    console.log('Successfully deleted ' + gurus.length + ' gurus.');
  } catch(e) {
    console.error('Error deleting gurus:', e);
  } finally {
    await prisma.$disconnect();
  }
}
deleteAllGurus();
