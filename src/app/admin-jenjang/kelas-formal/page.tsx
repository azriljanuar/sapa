import { getLoggedInAdminJenjang } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getSelectedTahunAjaran } from "@/lib/tahun-ajaran"
import { KelasClient } from "./kelas-client"

export default async function KelasFormalPage() {
  const admin = await getLoggedInAdminJenjang()

  if (!admin.jenjangId) {
    return (
      <div className="p-6 text-center text-destructive">
        Admin Jenjang ini belum memiliki jenjang yang dikelola.
      </div>
    )
  }

  // Fetch aktif TahunAjaran
  const activeTahunAjaran = await getSelectedTahunAjaran()

  // Fetch semua kelas beserta jumlah anggota dan info wali kelas
  const kelasFormal = activeTahunAjaran ? await prisma.kelasFormal.findMany({
    where: { 
      jenjangId: admin.jenjangId,
      tahunAjaranId: activeTahunAjaran.id 
    },
    include: {
      waliKelas: {
        select: { id: true, nama: true }
      },
      _count: {
        select: { anggota: true }
      }
    },
    orderBy: { namaKelas: "asc" }
  }) : []

  // Fetch daftar guru untuk dropdown wali kelas
  const guruList = await prisma.guru.findMany({
    where: { jenjangs: { some: { id: admin.jenjangId } } },
    select: { id: true, nama: true },
    orderBy: { nama: "asc" }
  })

  return <KelasClient initialData={kelasFormal} guruList={guruList} />
}
