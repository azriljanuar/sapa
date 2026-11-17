import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import {
  migrateHariLiburToKaldik,
  getMatriksKaldikSemester,
  getWibDate,
} from "@/lib/kaldik-utils"
import { getSelectedSemester, getSelectedTahunAjaran } from "@/lib/ta-context"
import KaldikClient from "./kaldik-client"

export const metadata: Metadata = {
  title: "Kalender Pendidikan (Kaldik) - Admin | SAPA",
  description: "Kalender Pendidikan Madrasah dan Pesantren Standar Ditjen Pendis Kementerian Agama RI",
}

export const dynamic = "force-dynamic"

export default async function KalenderPendidikanPage({
  searchParams,
}: {
  searchParams?: Promise<{ semesterId?: string; taId?: string }>
}) {
  const session = await getSession()
  if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_JENJANG")) {
    redirect("/login")
  }

  const resolvedParams = searchParams ? await searchParams : {}

  // 1. Ambil seluruh daftar Tahun Ajaran dan Semester untuk opsi switcher
  const allTahunAjarans = await prisma.tahunAjaran.findMany({
    include: { semester: true, kaldikPengaturan: true },
    orderBy: { nama: "desc" },
  })

  // 2. Ambil preferensi Tahun Ajaran & Semester dari context / cookie sistem
  const selectedSemesterFromCookie = await getSelectedSemester()
  const defaultTA = selectedSemesterFromCookie?.tahunAjaran || (await getSelectedTahunAjaran())

  // Tentukan Tahun Ajaran target (utamakan URL param, lalu cookie switcher, lalu TA terbaru)
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
          Sistem belum mendeteksi Tahun Ajaran. Silakan tambahkan tahun ajaran terlebih dahulu melalui menu{" "}
          <a href="/admin/tahun-ajaran" className="text-primary underline font-medium">
            Tahun Ajaran
          </a>
          .
        </p>
      </div>
    )
  }

  // 3. Tentukan Semester yang Aktif / Terpilih
  const availableSemesters = activeTA.semester || []
  let activeSemester = null

  if (resolvedParams.semesterId) {
    activeSemester = availableSemesters.find((s) => s.id === parseInt(resolvedParams.semesterId!))
  } else if (selectedSemesterFromCookie && selectedSemesterFromCookie.tahunAjaranId === activeTA.id) {
    activeSemester = availableSemesters.find((s) => s.id === selectedSemesterFromCookie.id)
  }

  if (!activeSemester && availableSemesters.length > 0) {
    // Sesuaikan semester dengan bulan real-world saat ini jika memungkinkan
    const nowWib = getWibDate()
    const currentMonth = nowWib.getMonth() + 1
    const isGanjil = currentMonth >= 7 && currentMonth <= 12
    const targetSemNama = isGanjil ? "GANJIL" : "GENAP"

    activeSemester =
      availableSemesters.find((s) => s.nama === targetSemNama) ||
      availableSemesters.find((s) => s.isActive) ||
      availableSemesters[0]
  }

  // 4. Jalankan migrasi data otomatis (Zero Data Loss) dari HariLibur ke Kaldik jika belum ada
  await migrateHariLiburToKaldik(activeTA.id)

  // 5. Hitung Matriks Kaldik Kemenag (MEB, HEB, HEF, HK, dsb.)
  const summary = await getMatriksKaldikSemester(activeTA.id, activeSemester?.id)

  // 6. Ambil seluruh data agenda Kaldik untuk TA ini
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
