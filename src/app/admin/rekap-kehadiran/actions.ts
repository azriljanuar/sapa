"use server"

import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { Hari } from "@prisma/client"
import { normalizeDate } from "@/lib/holiday-utils"

export async function getPengaturanAbsensi() {
  try {
    const session = await getSession()
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_JENJANG")) {
      throw new Error("Unauthorized")
    }

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

    return {
      success: true,
      data: {
        id: config.id,
        jamMasukMulai: config.jamMasukMulai,
        jamMasukBatas: config.jamMasukBatas,
        jamPulangMulai: config.jamPulangMulai,
        jamPulangSelesai: config.jamPulangSelesai,
        toleransiTerlambat: config.toleransiTerlambat,
      },
    }
  } catch (error: any) {
    console.error("Error in getPengaturanAbsensi:", error)
    return {
      success: false,
      message: error.message || "Gagal mengambil pengaturan absensi",
      data: null,
    }
  }
}

export async function updatePengaturanAbsensi(formData: FormData) {
  try {
    const session = await getSession()
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_JENJANG")) {
      return { success: false, message: "Tidak memiliki hak akses." }
    }

    const jamMasukMulai = (formData.get("jamMasukMulai") as string) || "06:00"
    const jamMasukBatas = (formData.get("jamMasukBatas") as string) || "07:15"
    const jamPulangMulai = (formData.get("jamPulangMulai") as string) || "14:30"
    const jamPulangSelesai = (formData.get("jamPulangSelesai") as string) || "17:30"
    const toleransiTerlambat = parseInt(formData.get("toleransiTerlambat") as string) || 15

    // Validasi format HH:mm sederhana
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
    if (!timeRegex.test(jamMasukMulai) || !timeRegex.test(jamMasukBatas) || !timeRegex.test(jamPulangMulai) || !timeRegex.test(jamPulangSelesai)) {
      return { success: false, message: "Format jam harus berupa HH:mm (contoh: 07:15)." }
    }

    const existing = await prisma.pengaturanAbsensi.findFirst()
    if (existing) {
      await prisma.pengaturanAbsensi.update({
        where: { id: existing.id },
        data: {
          jamMasukMulai,
          jamMasukBatas,
          jamPulangMulai,
          jamPulangSelesai,
          toleransiTerlambat,
        },
      })
    } else {
      await prisma.pengaturanAbsensi.create({
        data: {
          jamMasukMulai,
          jamMasukBatas,
          jamPulangMulai,
          jamPulangSelesai,
          toleransiTerlambat,
        },
      })
    }

    // Sinkronkan ke IdentitasLembaga agar profil dan absensi selalu selaras
    await prisma.identitasLembaga.updateMany({
      data: {
        waktuMulaiAbsen: jamMasukMulai,
        waktuAkhirAbsen: jamMasukBatas,
      },
    })

    revalidatePath("/admin/rekap-kehadiran")
    revalidatePath("/admin/profil")

    return {
      success: true,
      message: "Pengaturan jam absensi berhasil disimpan dan disinkronkan.",
    }
  } catch (error: any) {
    console.error("Error in updatePengaturanAbsensi:", error)
    return {
      success: false,
      message: error.message || "Gagal menyimpan pengaturan absensi.",
    }
  }
}

export async function updateKehadiranGuruManual(formData: FormData) {
  try {
    const session = await getSession()
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_JENJANG")) {
      return { success: false, message: "Tidak memiliki hak akses." }
    }

    const guruId = parseInt(formData.get("guruId") as string)
    const tanggalStr = formData.get("tanggal") as string
    const status = formData.get("status") as "HADIR" | "IZIN" | "SAKIT" | "ALPA"
    const jamMasukStr = formData.get("jamMasuk") as string // HH:mm atau kosong
    const jamPulangStr = formData.get("jamPulang") as string // HH:mm atau kosong
    const keterangan = formData.get("keterangan") as string

    if (!guruId || !tanggalStr || !status) {
      return { success: false, message: "Data guru, tanggal, dan status diperlukan." }
    }

    const tanggal = new Date(tanggalStr)

    // Bentuk DateTime untuk jamMasuk dan jamPulang jika diisi
    let jamMasuk: Date | null = null
    if (jamMasukStr) {
      const [h, m] = jamMasukStr.split(":").map(Number)
      jamMasuk = new Date(tanggal)
      jamMasuk.setHours(h, m, 0, 0)
    }

    let jamPulang: Date | null = null
    if (jamPulangStr) {
      const [h, m] = jamPulangStr.split(":").map(Number)
      jamPulang = new Date(tanggal)
      jamPulang.setHours(h, m, 0, 0)
    }

    // Cari semester aktif
    const activeSemester = await prisma.semester.findFirst({
      where: { isActive: true },
    })

    await prisma.kehadiranGuru.upsert({
      where: {
        guruId_tanggal: {
          guruId,
          tanggal,
        },
      },
      update: {
        status,
        jamMasuk,
        jamPulang,
        metode: "MANUAL",
        keterangan: keterangan || (status === "HADIR" ? "Diinput manual oleh Admin" : `${status} (Input Admin)`),
      },
      create: {
        guruId,
        semesterId: activeSemester?.id ?? null,
        tanggal,
        status,
        jamMasuk,
        jamPulang,
        metode: "MANUAL",
        keterangan: keterangan || (status === "HADIR" ? "Diinput manual oleh Admin" : `${status} (Input Admin)`),
      },
    })

    revalidatePath("/admin/rekap-kehadiran")
    return {
      success: true,
      message: "Data kehadiran guru berhasil diperbarui.",
    }
  } catch (error: any) {
    console.error("Error in updateKehadiranGuruManual:", error)
    return {
      success: false,
      message: error.message || "Gagal memperbarui kehadiran guru.",
    }
  }
}

export async function getAllHariLibur(jenjangId?: number) {
  try {
    const session = await getSession()
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_JENJANG")) {
      return { success: false, message: "Unauthorized", data: null }
    }

    const holidays = await prisma.hariLibur.findMany({
      where: {
        OR: [
          { jenjangId: null },
          ...(jenjangId ? [{ jenjangId }] : []),
        ],
      },
      orderBy: [{ tipe: "asc" }, { tanggal: "asc" }, { tanggalMulai: "asc" }],
      include: {
        jenjang: { select: { id: true, nama: true, singkatan: true } },
      },
    })

    const mingguan = holidays
      .filter((h) => h.tipe === "MINGGUAN" && h.hariMingguan)
      .map((h) => h.hariMingguan as Hari)

    const kondisional = holidays.filter((h) => h.tipe === "KONDISIONAL")
    const semester = holidays.filter((h) => h.tipe === "SEMESTER")

    return {
      success: true,
      data: {
        all: holidays,
        mingguan,
        kondisional,
        semester,
      },
    }
  } catch (error: any) {
    console.error("Error in getAllHariLibur:", error)
    return { success: false, message: error.message, data: null }
  }
}

export async function saveLiburMingguan(hariList: Hari[], jenjangId?: number) {
  try {
    const session = await getSession()
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_JENJANG")) {
      return { success: false, message: "Tidak memiliki hak akses." }
    }

    const jId = jenjangId ?? (session.role === "ADMIN_JENJANG" ? session.jenjangId : null)

    // Hapus setting mingguan yang lama untuk jenjang ini (atau global jika jId null)
    await prisma.hariLibur.deleteMany({
      where: {
        tipe: "MINGGUAN",
        jenjangId: jId,
      },
    })

    // Buat entri baru untuk setiap hari yang dipilih
    if (hariList.length > 0) {
      await prisma.hariLibur.createMany({
        data: hariList.map((hari) => ({
          tipe: "MINGGUAN",
          nama: `Libur Rutin ${hari}`,
          hariMingguan: hari,
          jenjangId: jId,
        })),
      })
    }

    revalidatePath("/admin/rekap-kehadiran")
    return {
      success: true,
      message: "Pengaturan hari libur mingguan berhasil disimpan.",
    }
  } catch (error: any) {
    console.error("Error in saveLiburMingguan:", error)
    return { success: false, message: error.message || "Gagal menyimpan libur mingguan." }
  }
}

export async function addLiburKondisional(formData: FormData) {
  try {
    const session = await getSession()
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_JENJANG")) {
      return { success: false, message: "Tidak memiliki hak akses." }
    }

    const nama = (formData.get("nama") as string)?.trim()
    const tanggalStr = formData.get("tanggal") as string
    const keterangan = (formData.get("keterangan") as string)?.trim() || null
    const jenjangIdRaw = formData.get("jenjangId") as string
    const jenjangId = jenjangIdRaw ? parseInt(jenjangIdRaw) : (session.role === "ADMIN_JENJANG" ? session.jenjangId : null)

    if (!nama || !tanggalStr) {
      return { success: false, message: "Nama libur dan tanggal wajib diisi." }
    }

    const { dateObj } = normalizeDate(tanggalStr)

    await prisma.hariLibur.create({
      data: {
        tipe: "KONDISIONAL",
        nama,
        tanggal: dateObj,
        keterangan,
        jenjangId: jenjangId ?? null,
      },
    })

    revalidatePath("/admin/rekap-kehadiran")
    return {
      success: true,
      message: `Hari libur "${nama}" berhasil ditambahkan.`,
    }
  } catch (error: any) {
    console.error("Error in addLiburKondisional:", error)
    return { success: false, message: error.message || "Gagal menambah libur kondisional." }
  }
}

export async function addLiburSemester(formData: FormData) {
  try {
    const session = await getSession()
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_JENJANG")) {
      return { success: false, message: "Tidak memiliki hak akses." }
    }

    const nama = (formData.get("nama") as string)?.trim()
    const tanggalMulaiStr = formData.get("tanggalMulai") as string
    const tanggalAkhirStr = formData.get("tanggalAkhir") as string
    const keterangan = (formData.get("keterangan") as string)?.trim() || null
    const jenjangIdRaw = formData.get("jenjangId") as string
    const jenjangId = jenjangIdRaw ? parseInt(jenjangIdRaw) : (session.role === "ADMIN_JENJANG" ? session.jenjangId : null)

    if (!nama || !tanggalMulaiStr || !tanggalAkhirStr) {
      return { success: false, message: "Nama, tanggal mulai, dan tanggal akhir wajib diisi." }
    }

    const { dateObj: dateMulai } = normalizeDate(tanggalMulaiStr)
    const { dateObj: dateAkhir } = normalizeDate(tanggalAkhirStr)

    if (dateMulai > dateAkhir) {
      return { success: false, message: "Tanggal mulai tidak boleh lebih besar dari tanggal akhir." }
    }

    await prisma.hariLibur.create({
      data: {
        tipe: "SEMESTER",
        nama,
        tanggalMulai: dateMulai,
        tanggalAkhir: dateAkhir,
        keterangan,
        jenjangId: jenjangId ?? null,
      },
    })

    revalidatePath("/admin/rekap-kehadiran")
    return {
      success: true,
      message: `Libur semester "${nama}" berhasil ditambahkan.`,
    }
  } catch (error: any) {
    console.error("Error in addLiburSemester:", error)
    return { success: false, message: error.message || "Gagal menambah libur semester." }
  }
}

export async function deleteHariLibur(id: number) {
  try {
    const session = await getSession()
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_JENJANG")) {
      return { success: false, message: "Tidak memiliki hak akses." }
    }

    await prisma.hariLibur.delete({
      where: { id },
    })

    revalidatePath("/admin/rekap-kehadiran")
    return {
      success: true,
      message: "Data hari libur berhasil dihapus.",
    }
  } catch (error: any) {
    console.error("Error in deleteHariLibur:", error)
    return { success: false, message: error.message || "Gagal menghapus hari libur." }
  }
}
