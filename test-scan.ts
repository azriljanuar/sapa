import prisma from "./src/lib/prisma"
async function main() {
  const activeTA = await prisma.tahunAjaran.findFirst({
    where: { isActive: true }
  })
  console.log("activeTA:", activeTA)
  const jenjangs = await prisma.jenjangPendidikan.findMany({
    include: {
      kelas: {
        where: activeTA ? { tahunAjaranId: activeTA.id } : undefined,
      }
    }
  })
  console.log("jenjangs:", JSON.stringify(jenjangs, null, 2))
}
main()
