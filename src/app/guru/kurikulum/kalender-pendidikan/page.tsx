import { Metadata } from "next"
import prisma from "@/lib/prisma"
import { getLoggedInKurikulum } from "@/lib/auth"
import {
  migrateHariLiburToKaldik,
  getMatriksKaldikSemester,
  getWibDate,
} from "@/lib/kaldik-utils"
import { getSelectedSemester, getSelectedTahunAjaran } from "@/lib/ta-context"
import KaldikClient from "@/app/admin/kalender-pendidikan/kaldik-client"

export const metadata: Metadata = {
  title: "Kalender Pendidikan - Kurikulum | SAPA",
  description: "Kalender Pendidikan Madrasah dan Pesantren Standar Ditjen Pendis Kementerian Agama RI",
}

export const dynamic = "force-dynamic"

export default async function KurikulumKaldikPage({
  searchParams,
}: {
  searchParams?: Promise<{ semesterId?: string; taId?: string }>
}) {
  await getLoggedInKurikulum()

  const resolvedParams = searchParams ? await searchParams : {}

  const allTahunAjarans = await prisma.tahunAjaran.findMany({
    include: { semester: true, kaldikPengaturan: true },
    orderBy: { nama: "desc" },
  })

  const selectedSemesterFromCookie = await getSelectedSemester()
  const defaultTA = selectedSemesterFromCookie?.tahunAjaran || (await getSelectedTahunAjaran())

  let activeTA = defaultTA
  if (resolvedParams.taId) {
    const customTa = allTahunAjarans.find((ta) => ta.id === parseInt(resolvedParams.taId!))
    if (customTa) activeTA = customTa
  }

  if (!activeTA && allTahunAjarans.length > 0) {
    activeTA = allTahunAjarans[0]
  }

  if (!activeTA) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-3">
        <h2 className="text-xl font-bold text-foreground">Tahun Ajaran Belum Ada</h2>
        <p className="text-sm text-muted-foreground">
          Sistem belum mendeteksi Tahun Ajaran aktif.
        </p>
      </div>
    )
  }

  const availableSemesters = activeTA.semester || []
  let activeSemester = null

  if (resolvedParams.semesterId) {
    activeSemester = availableSemesters.find((s) => s.id === parseInt(resolvedParams.semesterId!))
  } else if (selectedSemesterFromCookie && selectedSemesterFromCookie.tahunAjaranId === activeTA.id) {
    activeSemester = availableSemesters.find((s) => s.id === selectedSemesterFromCookie.id)
  }

  if (!activeSemester && availableSemesters.length > 0) {
    const nowWib = getWibDate()
    const currentMonth = nowWib.getMonth() + 1
    const isGanjil = currentMonth >= 7 && currentMonth <= 12
    const targetSemNama = isGanjil ? "GANJIL" : "GENAP"

    activeSemester =
      availableSemesters.find((s) => s.nama === targetSemNama) ||
      availableSemesters.find((s) => s.isActive) ||
      availableSemesters[0]
  }

  await migrateHariLiburToKaldik(activeTA.id)
  const summary = await getMatriksKaldikSemester(activeTA.id, activeSemester?.id)

  const allAgendas = await prisma.kaldikAgenda.findMany({
    where: { tahunAjaranId: activeTA.id },
    orderBy: { tanggalMulai: "asc" },
  })

  return (
    <KaldikClient
      summary={summary}
      allAgendas={allAgendas}
      allTahunAjarans={allTahunAjarans as any}
      currentSemesterId={activeSemester?.id || null}
    />
  )
}
