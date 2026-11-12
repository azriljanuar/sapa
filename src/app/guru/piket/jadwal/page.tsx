import { getLoggedInGuruPiket } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getSelectedSemester } from "@/lib/ta-context"
import { GuruPiketJadwalClient } from "./guru-piket-jadwal-client"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Jadwal Pelajaran - Guru Piket | SAPA",
  description: "Pantau seluruh jadwal kegiatan belajar mengajar aktif di madrasah",
}

export default async function GuruPiketJadwalPage() {
  const guruPiket = await getLoggedInGuruPiket()
  const activeSemester = await getSelectedSemester()

  if (!activeSemester) {
    return (
      <div className="p-6">
        <div className="p-6 bg-red-50 text-red-600 rounded-lg">
          Semester aktif belum ditentukan. Silakan hubungi admin sekolah.
        </div>
      </div>
    )
  }

  // Ambil daftar seluruh kelas untuk jenjang ini
  const kelasList = await prisma.kelasFormal.findMany({
    where: {
      jenjangId: guruPiket.jenjangId,
      tahunAjaranId: activeSemester.tahunAjaranId,
    },
    select: {
      id: true,
      namaKelas: true,
    },
    orderBy: {
      namaKelas: "asc",
    },
  })

  // Ambil seluruh jadwal pelajaran untuk semester aktif
  const rawJadwal = await prisma.jadwalPelajaran.findMany({
    where: {
      semesterId: activeSemester.id,
      pengampu: {
        mataPelajaran: {
          jenjangId: guruPiket.jenjangId,
        },
      },
    },
    include: {
      pengampu: {
        select: {
          kelasFormal: { select: { id: true, namaKelas: true } },
          guru: { select: { id: true, nama: true, nip: true } },
          mataPelajaran: { select: { id: true, nama: true, kode: true } },
        },
      },
      semester: {
        include: {
          tahunAjaran: true,
        },
      },
    },
    orderBy: [{ jamMulai: "asc" }],
  })

  const serializedJadwal = rawJadwal.map((j) => ({
    id: j.id,
    hari: j.hari,
    jamMulai: j.jamMulai,
    jamSelesai: j.jamSelesai,
    pengampu: {
      guru: j.pengampu.guru,
      mataPelajaran: j.pengampu.mataPelajaran,
      kelasFormal: j.pengampu.kelasFormal,
    },
  }))

  return (
    <GuruPiketJadwalClient
      initialJadwal={serializedJadwal}
      kelasList={kelasList}
      hariPiketGuru={guruPiket.hariPiket}
      activeTaName={activeSemester.tahunAjaran.nama}
      activeSemesterName={`Semester ${activeSemester.nama}`}
    />
  )
}
