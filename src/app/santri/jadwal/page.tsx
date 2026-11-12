import { getLoggedInSantri } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getSelectedSemester, getSelectedTahunAjaran } from "@/lib/ta-context"
import { JadwalView, JadwalItem } from "@/components/jadwal/jadwal-view"
import { AlertCircle } from "lucide-react"

export const dynamic = 'force-dynamic'

export const metadata = {
  title: "Jadwal Pelajaran - Portal Santri",
  description: "Daftar jadwal pelajaran kelas santri",
}

export default async function SantriJadwalPage() {
  const santri = await getLoggedInSantri()
  const activeSemester = await getSelectedSemester()
  const activeTa = await getSelectedTahunAjaran()

  // Ambil data riwayat kelas santri
  const riwayatList = await prisma.riwayatKelas.findMany({
    where: { santriId: santri.id },
    include: {
      kelasFormal: {
        include: {
          jenjang: true,
          waliKelas: true,
          tahunAjaran: true
        }
      }
    },
    orderBy: { id: 'desc' }
  })

  // Prioritaskan kelas pada tahun ajaran aktif jika ada
  const activeRiwayat = (activeTa 
    ? riwayatList.find(r => r.kelasFormal.tahunAjaranId === activeTa.id) 
    : null) || riwayatList[0] || null

  const activeKelas = activeRiwayat?.kelasFormal || null

  if (!activeKelas) {
    return (
      <div className="bg-card rounded-xl p-8 border border-border text-center shadow-2xs">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-base text-foreground">Kelas Belum Terdaftar</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          Akun Anda saat ini belum ditempatkan ke dalam kelas formal aktif. Silakan hubungi operator akademik jenjang Anda.
        </p>
      </div>
    )
  }

  // Ambil jadwal pelajaran untuk kelas santri ini
  let rawJadwal = await prisma.jadwalPelajaran.findMany({
    where: {
      pengampu: {
        kelasFormalId: activeKelas.id,
        ...(activeSemester ? { tahunAjaranId: activeSemester.tahunAjaranId } : {})
      },
      ...(activeSemester ? { semesterId: activeSemester.id } : {})
    },
    include: {
      pengampu: {
        include: {
          mataPelajaran: true,
          guru: true,
          kelasFormal: {
            include: { jenjang: true }
          }
        }
      },
      semester: {
        include: { tahunAjaran: true }
      }
    },
    orderBy: [
      { jamMulai: 'asc' }
    ]
  })

  const jadwalList: JadwalItem[] = rawJadwal.map((j) => ({
    id: j.id,
    hari: j.hari as any,
    jamMulai: j.jamMulai,
    jamSelesai: j.jamSelesai,
    semester: j.semester ? {
      nama: j.semester.nama,
      tahunAjaran: j.semester.tahunAjaran ? { nama: j.semester.tahunAjaran.nama } : undefined
    } : null,
    pengampu: {
      mataPelajaran: {
        id: j.pengampu.mataPelajaran.id,
        nama: j.pengampu.mataPelajaran.nama,
        kode: j.pengampu.mataPelajaran.kode
      },
      guru: j.pengampu.guru ? {
        id: j.pengampu.guru.id,
        nama: j.pengampu.guru.nama,
        nip: j.pengampu.guru.nip
      } : null,
      kelasFormal: {
        id: activeKelas.id,
        namaKelas: activeKelas.namaKelas,
        jenjang: activeKelas.jenjang ? {
          singkatan: activeKelas.jenjang.singkatan,
          nama: activeKelas.jenjang.nama
        } : null
      }
    }
  }))

  return (
    <div className="space-y-6">
      <JadwalView 
        jadwalList={jadwalList} 
        mode="SANTRI"
        title={`Jadwal Pelajaran Kelas ${activeKelas.namaKelas}`}
        subtitle={`Jadwal pelajaran harian untuk kelas ${activeKelas.namaKelas} (${activeKelas.jenjang.nama}).`}
      />
    </div>
  )
}
