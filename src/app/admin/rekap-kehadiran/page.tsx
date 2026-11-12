import { getLoggedInAdminJenjang } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getSelectedTahunAjaran } from "@/lib/ta-context"
import RekapKehadiranClient from "./rekap-client"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function RekapKehadiranPage() {
  const admin = await getLoggedInAdminJenjang()

  // Ambil Tahun Ajaran terpilih dari context/cookie
  const activeTA = await getSelectedTahunAjaran()

  if (!activeTA) {
    return <div className="p-8 text-center text-slate-500">Tahun ajaran belum diatur.</div>
  }

  // Ambil daftar kelas untuk jenjang ini sesuai TA yang dipilih
  const kelasList = await prisma.kelasFormal.findMany({
    where: {
      jenjangId: admin.jenjangId!,
      tahunAjaranId: activeTA.id
    },
    orderBy: { namaKelas: 'asc' },
    select: { id: true, namaKelas: true }
  })

  // Ambil atau inisialisasi pengaturan absensi
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

  // Ambil data hari libur (global + spesifik jenjang)
  const holidays = await prisma.hariLibur.findMany({
    where: {
      OR: [
        { jenjangId: null },
        { jenjangId: admin.jenjangId! },
      ],
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
      jenjangId={admin.jenjangId!}
      jenjangNama={admin.jenjang?.nama || "Jenjang"}
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
