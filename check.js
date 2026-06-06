const { PrismaClient } = require('./src/generated/prisma');  
const prisma = new PrismaClient();  
async function main() { console.dir(await prisma.tahunAjaran.findMany()); } main();  
