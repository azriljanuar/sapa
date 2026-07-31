import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import AbsensiGuruHub from "./hub-client"
import { getSelectedSemester } from "@/lib/ta-context"

export const dynamic = "force-dynamic"

export default async function AbsensiGuruPage() {
  const session = await getSession()
  if (!session || session.role !== "GURU") redirect("/login")

  const selectedSem = await getSelectedSemester()
  const semesterId = selectedSem?.id || null

  const today = new Date()
  const dateStr = today.toISOString().split("T")[0]
  const dateObj = new Date(dateStr)

  // Kehadiran guru hari ini
  const existingAbsensi = await prisma.kehadiranGuru.findUnique({
    where: { guruId_tanggal: { guruId: session.id, tanggal: dateObj } }
  })

  // Ambil semua PengampuMataPelajaran milik guru ini sesuai TA yang dipilih
  const pengampuList = await prisma.pengampuMataPelajaran.findMany({
    where: {
      guruId: session.id,
      ...(selectedSem ? { tahunAjaranId: selectedSem.tahunAjaran.id } : {})
    },
    include: {
      mataPelajaran: true,
      kelasFormal: { include: { jenjang: true } },
      tahunAjaran: { include: { semester: true } },
      jurnalMengajar: {
        orderBy: [{ sumatifKe: "asc" }, { pertemuanKe: "asc" }],
        include: {
          absensiMapel: {
            include: { santri: { select: { id: true, namaLengkap: true } } }
          }
        }
      },
      nilaiSumatif: {
        where: semesterId ? { semesterId } : {},
      },
      nilaiPAS: {
        where: semesterId ? { semesterId } : {},
      },
    }
  })

  // Untuk setiap pengampu, ambil daftar santri di kelasnya
  const kelasFormalIds = [...new Set(pengampuList.map(p => p.kelasFormalId))]
  const riwayatKelasList = await prisma.riwayatKelas.findMany({
    where: { kelasFormalId: { in: kelasFormalIds } },
    include: { santri: { select: { id: true, namaLengkap: true, nisn: true } } },
    orderBy: { santri: { namaLengkap: "asc" } }
  })

  // Map: kelasFormalId → santri[]
  const santriPerKelas: Record<number, { id: number; namaLengkap: string; nisn: string }[]> = {}
  for (const rk of riwayatKelasList) {
    if (!santriPerKelas[rk.kelasFormalId]) santriPerKelas[rk.kelasFormalId] = []
    santriPerKelas[rk.kelasFormalId].push(rk.santri)
  }

  return (
    <AbsensiGuruHub
      existingAbsensi={existingAbsensi as any}
      pengampuList={pengampuList as any}
      santriPerKelas={santriPerKelas}
      semesterId={semesterId}
      semesterNama={selectedSem ? `${selectedSem.tahunAjaran.nama} - ${selectedSem.nama}` : ""}
    />
  )
}

