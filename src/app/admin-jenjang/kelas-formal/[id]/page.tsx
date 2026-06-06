import { notFound } from "next/navigation"
import { getLoggedInAdminJenjang } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { KelasDetailClient } from "./kelas-detail-client"

export default async function KelasFormalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getLoggedInAdminJenjang()
  
  if (!admin.jenjangId) {
    return (
      <div className="p-6 text-center text-destructive">
        Admin Jenjang ini belum memiliki jenjang yang dikelola.
      </div>
    )
  }

  const { id } = await params
  const kelasId = parseInt(id)

  if (isNaN(kelasId)) {
    notFound()
  }

  // Fetch Kelas dan Wali Kelas
  const kelas = await prisma.kelasFormal.findUnique({
    where: { 
      id: kelasId,
      jenjangId: admin.jenjangId 
    },
    include: {
      waliKelas: {
        select: { id: true, nama: true }
      }
    }
  })

  if (!kelas) {
    notFound()
  }

  // Fetch Santri yang saat ini ada di kelas ini via RiwayatKelas
  const riwayatAnggota = await prisma.riwayatKelas.findMany({
    where: {
      kelasFormalId: kelasId,
    },
    include: {
      santri: {
        select: {
          id: true,
          nisn: true,
          namaLengkap: true,
          jenjangs: {
            where: { jenjangId: admin.jenjangId },
            select: { statusMukim: true }
          }
        }
      }
    }
  })
  
  const anggota = riwayatAnggota.map(r => ({
    id: r.santri.id,
    nisn: r.santri.nisn,
    namaLengkap: r.santri.namaLengkap,
    statusMukim: r.santri.jenjangs[0]?.statusMukim || false
  })).sort((a, b) => a.namaLengkap.localeCompare(b.namaLengkap))

  // Fetch Santri di jenjang ini yang BELUM memiliki RiwayatKelas untuk TahunAjaran ini (untuk dialog Add)
  const availableSantriRaw = await prisma.santri.findMany({
    where: {
      jenjangs: {
        some: { jenjangId: admin.jenjangId, isAlumni: false }
      },
      riwayatKelas: {
        none: {
          kelasFormal: {
            tahunAjaranId: kelas.tahunAjaranId
          }
        }
      }
    },
    select: {
      id: true,
      nisn: true,
      namaLengkap: true,
      jenjangs: {
        where: { jenjangId: admin.jenjangId },
        select: { statusMukim: true }
      }
    },
    orderBy: {
      namaLengkap: "asc"
    }
  })

  const availableSantri = availableSantriRaw.map(s => ({
    id: s.id,
    nisn: s.nisn,
    namaLengkap: s.namaLengkap,
    statusMukim: s.jenjangs[0]?.statusMukim || false
  }))

  // Fetch data Tahun Ajaran Aktif untuk logika Kenaikan Kelas
  const activeTa = await prisma.tahunAjaran.findFirst({
    where: { isActive: true },
    include: { semester: true }
  })
  
  let canPromote = false
  let canGraduate = false
  let nextTaId: number | null = null
  let nextTaClasses: { id: number; namaKelas: string }[] = []
  
  // Jika kelas ini berada di TA aktif, dan TA aktif sedang di semester GENAP
  if (activeTa && kelas.tahunAjaranId === activeTa.id) {
    const isGenap = activeTa.semester.some(s => s.isActive && s.nama === "GENAP")
    
    if (isGenap) {
      canGraduate = true // Di semester genap, kelas manapun bisa diluluskan jika admin menghendaki
      
      // Coba cari TA berikutnya berdasarkan nama (asumsi format YYYY/YYYY)
      const parts = activeTa.nama.split("/")
      if (parts.length === 2) {
        const nextYear1 = parseInt(parts[0]) + 1
        const nextYear2 = parseInt(parts[1]) + 1
        const nextTaName = `${nextYear1}/${nextYear2}`
        
        const nextTa = await prisma.tahunAjaran.findUnique({
          where: { nama: nextTaName }
        })
        
        if (nextTa) {
          canPromote = true
          nextTaId = nextTa.id
          
          // Ambil daftar kelas di TA berikutnya untuk jenjang ini
          nextTaClasses = await prisma.kelasFormal.findMany({
            where: { 
              jenjangId: admin.jenjangId,
              tahunAjaranId: nextTa.id 
            },
            select: { id: true, namaKelas: true },
            orderBy: { namaKelas: "asc" }
          })
        }
      }
    }
  }

  return (
    <KelasDetailClient 
      kelas={kelas} 
      anggota={anggota} 
      availableSantri={availableSantri} 
      canPromote={canPromote}
      canGraduate={canGraduate}
      nextTaId={nextTaId}
      nextTaClasses={nextTaClasses}
    />
  )
}
