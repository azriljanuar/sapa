import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
async function main() {
  const ta = await prisma.tahunAjaran.findMany()
  const k = await prisma.kelasFormal.findMany()
  console.log("TA:", ta)
  console.log("Kelas:", k)
}
main()
