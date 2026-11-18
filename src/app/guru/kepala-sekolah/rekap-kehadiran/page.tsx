import { Metadata } from "next"
import { getLoggedInKepalaSekolah } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getSelectedTahunAjaran } from "@/lib/ta-context"
import RekapKehadiranClient from "@/app/admin/rekap-kehadiran/rekap-client"

export const metadata: Metadata = {
  title: "Rekap Kehadiran Guru & Santri - Kepala Madrasah | SAPA",
  description: "Supervisi presensi harian dan bulanan seluruh guru dan santri",
}

export const dynamic = "force-dynamic"

export default async function KepalaSekolahRekapKehadiranPage() {
  const kepala = await getLoggedInKepalaSekolah()
  const activeTA = await getSelectedTahunAjaran()

  if (!activeTA) {
    return <div className="p-8 text-center text-muted-foreground">Tahun ajaran belum diatur.</div>
  }

  const kelasList = await prisma.kelasFormal.findMany({
    where: {
      jenjangId: kepala.jenjangId,
      tahunAjaranId: activeTA.id,
    },
    orderBy: { namaKelas: "asc" },
    select: { id: true, namaKelas: true },
  })

  let config = await prisma.pengaturanAbsensi.findFirst()
  if (!config) {
    config = await prisma.pengaturanAbsensi.create({
      data: {
        jamMasukMulai: "06:00",
        jamMasukBatas: "07:15",
        jamPulangMulai: "14:30",
        jamPulangSelesai: "17:30",
        toleransiTerlambat: 15,
      },
    })
  }

  const holidays = await prisma.hariLibur.findMany({
    where: {
      OR: [{ jenjangId: null }, { jenjangId: kepala.jenjangId }],
    },
    orderBy: [{ tipe: "asc" }, { tanggal: "asc" }, { tanggalMulai: "asc" }],
    include: {
      jenjang: { select: { id: true, nama: true, singkatan: true } },
    },
  })

  const mingguan = holidays
    .filter((h) => h.tipe === "MINGGUAN" && h.hariMingguan)
    .map((h) => h.hariMingguan!)

  const kondisional = holidays
    .filter((h) => h.tipe === "KONDISIONAL")
    .map((h) => ({
      ...h,
      tanggal: h.tanggal ? h.tanggal.toISOString() : null,
      createdAt: h.createdAt.toISOString(),
      updatedAt: h.updatedAt.toISOString(),
    }))

  const semester = holidays
    .filter((h) => h.tipe === "SEMESTER")
    .map((h) => ({
      ...h,
      tanggalMulai: h.tanggalMulai ? h.tanggalMulai.toISOString() : null,
      tanggalAkhir: h.tanggalAkhir ? h.tanggalAkhir.toISOString() : null,
      createdAt: h.createdAt.toISOString(),
      updatedAt: h.updatedAt.toISOString(),
    }))

  return (
    <RekapKehadiranClient
      kelasList={kelasList}
      jenjangId={kepala.jenjangId}
      jenjangNama={kepala.jenjangs[0]?.nama || "Madrasah"}
      tahunAjaran={activeTA.nama}
      tahunAjaranId={activeTA.id}
      initialConfig={{
        id: config.id,
        jamMasukMulai: config.jamMasukMulai,
        jamMasukBatas: config.jamMasukBatas,
        jamPulangMulai: config.jamPulangMulai,
        jamPulangSelesai: config.jamPulangSelesai,
        toleransiTerlambat: config.toleransiTerlambat,
      }}
      initialHariLibur={{
        mingguan,
        kondisional,
        semester,
      }}
    />
  )
}
