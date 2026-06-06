import prisma from './src/lib/prisma';
async function main() {
  console.log('Santri:');
  console.log(await prisma.santri.findMany({take: 2}));
  console.log('Guru:');
  console.log(await prisma.guru.findMany({take: 2}));
}
main();
