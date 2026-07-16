import { getLoggedInSuperAdmin } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { SantriClient } from "./santri-client"

export default async function DataSantriPage() {
  await getLoggedInSuperAdmin()

  const { getSelectedTahunAjaran } = await import("@/lib/ta-context")
  const activeTa = await getSelectedTahunAjaran()

  const santris = await prisma.santri.findMany({
    include: {
      jenjangs: {
        include: { jenjang: true }
      },
      riwayatKelas: {
        where: {
          kelasFormal: {
            tahunAjaranId: activeTa?.id || -1
          }
        },
        include: {
          kelasFormal: true
        }
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
    
    // Class name in the active year
    const kelasFormalName = s.riwayatKelas.length > 0 ? s.riwayatKelas[0].kelasFormal.namaKelas : null
    const kelasFormalId = s.riwayatKelas.length > 0 ? s.riwayatKelas[0].kelasFormalId : null
    
    return {
      ...s,
      jenjangNames,
      jenjangIds,
      statusMukim,
      kelasFormalName,
      kelasFormalId
    }
  })

  const jenjangList = await prisma.jenjangPendidikan.findMany({
    orderBy: { id: "asc" }
  })

  // Ambil semua kelas di TA yang aktif untuk filter dropdown
  let kelasList: any[] = []
  if (activeTa) {
    kelasList = await prisma.kelasFormal.findMany({
      where: { tahunAjaranId: activeTa.id },
      orderBy: { namaKelas: 'asc' }
    })
  }

  return <SantriClient initialData={mappedSantris as any} jenjangList={jenjangList} kelasList={kelasList} />
}
