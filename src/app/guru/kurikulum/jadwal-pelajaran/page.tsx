import { Metadata } from "next"
import { getLoggedInKurikulum } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { JadwalClient } from "@/app/admin/jadwal-pelajaran/jadwal-client"
import { getSelectedTahunAjaran, getSelectedSemester } from "@/lib/ta-context"

export const metadata: Metadata = {
  title: "Jadwal Pelajaran KBM - Kurikulum | SAPA",
  description: "Pengelolaan jadwal kegiatan belajar mengajar",
}

export const dynamic = "force-dynamic"

export default async function KurikulumJadwalPage() {
  const kurikulum = await getLoggedInKurikulum()

  const activeTa = await getSelectedTahunAjaran()

  if (!activeTa) {
    return (
      <div className="p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-sm font-medium">
          Belum ada Tahun Ajaran aktif. Silakan hubungi Admin Sekolah.
        </div>
    )
  }

  const activeSemester = await getSelectedSemester()

  const kelasFormalList = await prisma.kelasFormal.findMany({
    where: {
      jenjangId: kurikulum.jenjangId,
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
        jenjangId: kurikulum.jenjangId,
      },
    },
    include: {
      mataPelajaran: {
        select: { id: true, nama: true, kode: true },
      },
      guru: {
        select: { id: true, nama: true },
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
            jenjangId: kurikulum.jenjangId,
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
    <JadwalClient
      activeTa={activeTa}
      activeSemester={activeSemester}
      kelasFormalList={kelasFormalList}
      pengampuList={pengampuList as any}
      initialJadwal={initialJadwal}
    />
  )
}
