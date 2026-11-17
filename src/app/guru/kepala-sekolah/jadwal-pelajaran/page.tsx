import { Metadata } from "next"
import { getLoggedInKepalaSekolah } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { JadwalClient } from "@/app/admin/jadwal-pelajaran/jadwal-client"
import { getSelectedTahunAjaran, getSelectedSemester } from "@/lib/ta-context"

export const metadata: Metadata = {
  title: "Supervisi Jadwal KBM - Kepala Sekolah | SAPA",
  description: "Supervisi dan monitoring jadwal kegiatan belajar mengajar",
}

export const dynamic = "force-dynamic"

export default async function KepalaSekolahJadwalPage() {
  const kepalaSekolah = await getLoggedInKepalaSekolah()

  const activeTa = await getSelectedTahunAjaran()

  if (!activeTa) {
    return (
      <div className="p-6">
        <div className="p-6 bg-red-50 text-red-600 rounded-lg">
          Belum ada Tahun Ajaran aktif. Silakan hubungi Admin Sekolah.
        </div>
      </div>
    )
  }

  const activeSemester = await getSelectedSemester()

  const kelasFormalList = await prisma.kelasFormal.findMany({
    where: {
      jenjangId: kepalaSekolah.jenjangId,
      tahunAjaranId: activeTa.id,
    },
    orderBy: {
      namaKelas: "asc",
    },
  })

  const pengampuList = await prisma.pengampuMataPelajaran.findMany({
    where: {
      tahunAjaranId: activeTa.id,
      mataPelajaran: {
        jenjangId: kepalaSekolah.jenjangId,
      },
    },
    include: {
      mataPelajaran: {
        select: { id: true, nama: true, kode: true },
      },
      guru: {
        select: { id: true, nama: true },
      },
      kelasFormal: {
        select: { id: true, namaKelas: true },
      },
    },
  })

  let initialJadwal: any[] = []
  if (activeSemester) {
    initialJadwal = await prisma.jadwalPelajaran.findMany({
      where: {
        semesterId: activeSemester.id,
        pengampu: {
          mataPelajaran: {
            jenjangId: kepalaSekolah.jenjangId,
          },
        },
      },
      include: {
        pengampu: {
          select: {
            id: true,
            guru: { select: { nama: true } },
            mataPelajaran: { select: { nama: true } },
            kelasFormal: { select: { id: true, namaKelas: true } },
          },
        },
      },
    })
  }

  return (
    <div className="p-4 md:p-8">
      <JadwalClient
        activeTa={activeTa}
        activeSemester={activeSemester}
        kelasFormalList={kelasFormalList}
        pengampuList={pengampuList as any}
        initialJadwal={initialJadwal}
      />
    </div>
  )
}
