import { getLoggedInAdminJenjang } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { AlumniClient } from "./alumni-client"

export default async function AlumniPage() {
  const admin = await getLoggedInAdminJenjang()

  if (!admin.jenjangId) {
    return <div className="p-6 text-center text-red-500">Akses ditolak</div>
  }

  const alumniListRaw = await prisma.santri.findMany({
    where: {
      jenjangs: {
        some: {
          jenjangId: admin.jenjangId,
          isAlumni: true,
        }
      }
    },
    include: {
      jenjangs: {
        where: { jenjangId: admin.jenjangId }
      }
    },
    orderBy: {
      namaLengkap: "asc",
    },
  })

  const alumniList = alumniListRaw.map(a => ({
    ...a,
    statusMukim: a.jenjangs[0]?.statusMukim || false,
    keteranganLulus: a.jenjangs[0]?.keteranganLulus || null,
    tahunLulusId: a.jenjangs[0]?.tahunLulusId || null,
  }))

  // Fetch daftar jenjang untuk pilihan "Lanjutkan ke Jenjang"
  const semuaJenjang = await prisma.jenjangPendidikan.findMany({
    where: {
      id: { not: admin.jenjangId }
    },
    orderBy: {
      nama: "asc"
    }
  })

  // Cek apakah jenjang ini adalah MA (Madrasah Aliyah) / jenjang akhir
  const currentJenjang = await prisma.jenjangPendidikan.findUnique({
    where: { id: admin.jenjangId }
  })
  
  const isMA = currentJenjang?.nama.toUpperCase().includes("MA") || false

  return (
    <AlumniClient 
      initialData={alumniList} 
      jenjangList={semuaJenjang} 
      isMA={isMA} 
    />
  )
}
