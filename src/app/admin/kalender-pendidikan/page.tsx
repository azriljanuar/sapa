import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import {
  migrateHariLiburToKaldik,
  getMatriksKaldikSemester,
} from "@/lib/kaldik-utils"
import KaldikClient from "./kaldik-client"

export const metadata: Metadata = {
  title: "Kalender Pendidikan (Kaldik) - Admin | SAPA",
  description: "Kalender Pendidikan Madrasah dan Pesantren Standar Ditjen Pendis Kementerian Agama RI",
}

export const dynamic = "force-dynamic"

export default async function KalenderPendidikanPage() {
  const session = await getSession()
  if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_JENJANG")) {
    redirect("/login")
  }

  // 1. Ambil Tahun Ajaran Aktif
  const activeTA = await prisma.tahunAjaran.findFirst({
    where: { isActive: true },
    include: {
      semester: true,
      kaldikPengaturan: true,
    },
  })

  if (!activeTA) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-3">
        <h2 className="text-xl font-bold text-foreground">Tahun Ajaran Belum Aktif</h2>
        <p className="text-sm text-muted-foreground">
          Sistem belum mendeteksi Tahun Ajaran yang berstatus aktif. Silakan aktifkan tahun ajaran terlebih dahulu melalui menu{" "}
          <a href="/admin/tahun-ajaran" className="text-primary underline font-medium">
            Tahun Ajaran
          </a>
          .
        </p>
      </div>
    )
  }

  // 2. Jalankan migrasi data otomatis (Zero Data Loss) dari HariLibur ke Kaldik jika belum ada
  await migrateHariLiburToKaldik(activeTA.id)

  const activeSemester = activeTA.semester.find((s) => s.isActive) || activeTA.semester[0]

  // 3. Hitung Matriks Kaldik Kemenag (MEB, HEB, HEF, HK, dsb.)
  const summary = await getMatriksKaldikSemester(activeTA.id, activeSemester?.id)

  // 4. Ambil seluruh data agenda Kaldik
  const allAgendas = await prisma.kaldikAgenda.findMany({
    where: { tahunAjaranId: activeTA.id },
    orderBy: { tanggalMulai: "asc" },
  })

  return <KaldikClient summary={summary} allAgendas={allAgendas} />
}
