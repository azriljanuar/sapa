import { getLoggedInGuru } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getSelectedSemester } from "@/lib/ta-context"
import { JadwalView, JadwalItem } from "@/components/jadwal/jadwal-view"

export const dynamic = 'force-dynamic'

export const metadata = {
  title: "Jadwal Mengajar - Portal Guru",
  description: "Daftar jadwal pelajaran yang diampu oleh guru",
}

export default async function GuruJadwalPage() {
  const guru = await getLoggedInGuru()
  const activeSemester = await getSelectedSemester()

  // Ambil jadwal pelajaran berdasarkan pengampu untuk guru ini pada semester aktif
  const rawJadwal = await prisma.jadwalPelajaran.findMany({
    where: {
      pengampu: {
        guruId: guru.id,
        ...(activeSemester ? { tahunAjaranId: activeSemester.tahunAjaranId } : {})
      },
      ...(activeSemester ? { semesterId: activeSemester.id } : {})
    },
    include: {
      pengampu: {
        include: {
          mataPelajaran: true,
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
      kelasFormal: j.pengampu.kelasFormal ? {
        id: j.pengampu.kelasFormal.id,
        namaKelas: j.pengampu.kelasFormal.namaKelas,
        jenjang: j.pengampu.kelasFormal.jenjang ? {
          singkatan: j.pengampu.kelasFormal.jenjang.singkatan,
          nama: j.pengampu.kelasFormal.jenjang.nama
        } : null
      } : null
    }
  }))

  return (
    <div className="space-y-6">
      <JadwalView 
        jadwalList={jadwalList} 
        mode="GURU"
        title="Jadwal Pelajaran yang Diampu"
        subtitle={`Jadwal mengajar resmi untuk ${guru.nama}. Pilih hari atau lihat seluruh jadwal mingguan.`}
      />
    </div>
  )
}
