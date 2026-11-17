import { type ReactNode } from "react"
import { getLoggedInGuru } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getSelectedSemester } from "@/lib/ta-context"
import { GuruLayoutClient } from "./guru-layout-client"

export const dynamic = 'force-dynamic'

export const metadata = {
  title: "Portal Guru - SAPA",
  description: "Portal Tenaga Pendidik Sistem Administrasi Pesantren & Akademik",
}

export default async function GuruLayout({ children }: { children: ReactNode }) {
  const guru = await getLoggedInGuru()

  // Cek apakah guru adalah wali kelas
  const waliKelasCount = await prisma.kelasFormal.count({
    where: { waliKelasId: guru.id }
  })

  const allTa = await prisma.tahunAjaran.findMany({
    include: { semester: true },
    orderBy: { nama: 'desc' }
  })

  const selectedSem = await getSelectedSemester()

  // Cek apakah guru adalah guru piket pada Tahun Ajaran aktif
  const activeTAId = selectedSem?.tahunAjaranId || allTa.find((t) => t.isActive)?.id
  const piketAssignments = activeTAId
    ? await prisma.guruPiket.findMany({
        where: {
          guruId: guru.id,
          tahunAjaranId: activeTAId,
        },
      })
    : []

  const isGuruPiket = piketAssignments.length > 0

  // Cek tugas tambahan struktural (Kepala Sekolah, Kurikulum, Kesiswaan) pada Tahun Ajaran aktif
  const tugasTambahan = activeTAId
    ? await prisma.tugasTambahanGuru.findMany({
        where: {
          guruId: guru.id,
          tahunAjaranId: activeTAId,
        },
      })
    : []

  const isKepalaSekolah = tugasTambahan.some((t) => t.peran === "KEPALA_SEKOLAH")
  const isKurikulum = tugasTambahan.some((t) => t.peran === "KURIKULUM")
  const isKesiswaan = tugasTambahan.some((t) => t.peran === "KESISWAAN")

  return (
    <GuruLayoutClient 
      guru={guru} 
      isWaliKelas={waliKelasCount > 0}
      isGuruPiket={isGuruPiket}
      isKepalaSekolah={isKepalaSekolah}
      isKurikulum={isKurikulum}
      isKesiswaan={isKesiswaan}
      allTa={allTa as any}
      activeSemesterId={selectedSem?.id || null}
    >
      {children}
    </GuruLayoutClient>
  )
}
