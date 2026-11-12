import { getLoggedInAdmin } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import PenilaianAdminClient from "./penilaian-client"
import { getSelectedSemester } from "@/lib/ta-context"

export const dynamic = "force-dynamic"

export default async function PenilaianAdminPage() {
  await getLoggedInAdmin()

  const selectedSem = await getSelectedSemester()
  const semesterId = selectedSem?.id || null

  // Ambil data semester lengkap (termasuk nilaiDirilis)
  const semesterData = semesterId 
    ? await prisma.semester.findUnique({ where: { id: semesterId } })
    : null

  // Ambil semua pengampu untuk semester yang dipilih
  const pengampuList = await prisma.pengampuMataPelajaran.findMany({
    where: {
      ...(selectedSem ? { tahunAjaranId: selectedSem.tahunAjaran.id } : {})
    },
    include: {
      mataPelajaran: true,
      kelasFormal: true,
      guru: { select: { id: true, nama: true } },
      tahunAjaran: true,
      // Nilai sumatif
      nilaiSumatif: {
        where: semesterId ? { semesterId } : {}
      },
      // Nilai PAS
      nilaiPAS: {
        where: semesterId ? { semesterId } : {}
      },
      // Jurnal (untuk hitung kehadiran)
      jurnalMengajar: {
        include: {
          absensiMapel: { select: { santriId: true, status: true } }
        }
      }
    },
    orderBy: [
      { kelasFormal: { namaKelas: "asc" } },
      { mataPelajaran: { nama: "asc" } }
    ]
  })

  // Kelas-kelas
  const kelasList = await prisma.kelasFormal.findMany({
    where: {
      ...(selectedSem ? { tahunAjaranId: selectedSem.tahunAjaran.id } : {})
    },
    include: {
      anggota: {
        include: { santri: { select: { id: true, namaLengkap: true, nisn: true } } },
        orderBy: { santri: { namaLengkap: "asc" } }
      }
    },
    orderBy: { namaKelas: "asc" }
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
