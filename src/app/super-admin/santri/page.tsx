import { getLoggedInSuperAdmin } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { SantriClient } from "./santri-client"

export default async function DataSantriPage() {
  await getLoggedInSuperAdmin()

  const santris = await prisma.santri.findMany({
    include: {
      jenjangs: {
        include: { jenjang: true }
      }
    },
    orderBy: {
      namaLengkap: "asc",
    },
  })

  // Format data untuk client
  const mappedSantris = santris.map(s => {
    const jenjangNames = s.jenjangs.map(j => j.jenjang.nama).join(", ")
    const jenjangIds = s.jenjangs.map(j => j.jenjangId)
    const statusMukim = s.jenjangs.length > 0 ? s.jenjangs[0].statusMukim : false
    
    return {
      ...s,
      jenjangNames,
      jenjangIds,
      statusMukim
    }
  })

  const jenjangList = await prisma.jenjangPendidikan.findMany({
    orderBy: { id: "asc" }
  })

  return <SantriClient initialData={mappedSantris} jenjangList={jenjangList} />
}
