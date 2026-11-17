import { Metadata } from "next"
import { getLoggedInKepalaSekolah } from "@/lib/auth"
import prisma from "@/lib/prisma"
import PenilaianAdminClient from "@/app/admin/penilaian/penilaian-client"
import { getSelectedSemester } from "@/lib/ta-context"

export const metadata: Metadata = {
  title: "Supervisi Penilaian & Rilis Rapor - Kepala Madrasah | SAPA",
  description: "Pengawasan penilaian pembelajaran dan approval rilis rapor madrasah",
}

export const dynamic = "force-dynamic"

export default async function KepalaSekolahPenilaianPage() {
  await getLoggedInKepalaSekolah()

  const selectedSem = await getSelectedSemester()
  const semesterId = selectedSem?.id || null

  const semesterData = semesterId
    ? await prisma.semester.findUnique({ where: { id: semesterId } })
    : null

  const pengampuList = await prisma.pengampuMataPelajaran.findMany({
    where: {
      ...(selectedSem ? { tahunAjaranId: selectedSem.tahunAjaran.id } : {}),
    },
    include: {
      mataPelajaran: true,
      kelasFormal: true,
      guru: { select: { id: true, nama: true } },
      tahunAjaran: true,
      nilaiSumatif: {
        where: semesterId ? { semesterId } : {},
      },
      nilaiPAS: {
        where: semesterId ? { semesterId } : {},
      },
      jurnalMengajar: {
        include: {
          absensiMapel: { select: { santriId: true, status: true } },
        },
      },
    },
    orderBy: [
      { kelasFormal: { namaKelas: "asc" } },
      { mataPelajaran: { nama: "asc" } },
    ],
  })

  const kelasList = await prisma.kelasFormal.findMany({
    where: {
      ...(selectedSem ? { tahunAjaranId: selectedSem.tahunAjaran.id } : {}),
    },
    include: {
      anggota: {
        include: { santri: { select: { id: true, namaLengkap: true, nisn: true } } },
        orderBy: { santri: { namaLengkap: "asc" } },
      },
    },
    orderBy: { namaKelas: "asc" },
  })

  return (
    <PenilaianAdminClient
      pengampuList={pengampuList as any}
      kelasList={kelasList as any}
      semesterId={semesterId}
      semesterNama={selectedSem ? `${selectedSem.tahunAjaran.nama} — ${selectedSem.nama}` : ""}
      semesterNilaiDirilis={semesterData?.nilaiDirilis ?? false}
    />
  )
}
