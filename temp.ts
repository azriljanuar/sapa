import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  const tas = await prisma.tahunAjaran.findMany({ include: { semester: true } })
  console.log(JSON.stringify(tas, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
