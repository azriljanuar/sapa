"use server"

import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import path from "path"
import { processAndSaveWebP } from "@/lib/image-processor"

function getWibDate(date = new Date()) {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000
  return new Date(utc + 7 * 3600000)
}

export async function guruCheckOut() {
  try {
    const session = await getSession()
    if (!session || session.role !== "GURU") {
      return { success: false, message: "Tidak memiliki hak akses." }
    }

    const now = new Date()
    const nowWib = getWibDate(now)
    const todayDateStr = nowWib.toISOString().split("T")[0]
    const todayDate = new Date(todayDateStr)

    // Cari data absensi guru hari ini
    const kehadiran = await prisma.kehadiranGuru.findUnique({
      where: {
        guruId_tanggal: {
          guruId: session.id,
          tanggal: todayDate,
        },
      },
    })

    if (!kehadiran) {
      return {
        success: false,
        message: "Anda belum melakukan presensi masuk hari ini. Silakan scan kartu RFID terlebih dahulu.",
      }
    }

    if (kehadiran.jamPulang) {
      const jamStr = new Date(kehadiran.jamPulang).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })
      return {
        success: false,
        message: `Anda sudah check out sebelumnya pada pukul ${jamStr} WIB.`,
      }
    }

    // Update jam pulang
    await prisma.kehadiranGuru.update({
      where: { id: kehadiran.id },
      data: {
        jamPulang: now,
        keterangan: kehadiran.keterangan
          ? `${kehadiran.keterangan} | Pulang via Web`
          : "Pulang via Web",
      },
    })

    revalidatePath("/guru")
    revalidatePath("/admin/rekap-kehadiran")

    return {
      success: true,
      message: "Check out berhasil. Selamat beristirahat!",
    }
  } catch (error: any) {
    console.error("Error in guruCheckOut:", error)
    return {
      success: false,
      message: error.message || "Terjadi kesalahan saat check out.",
    }
  }
}

export async function uploadGuruProfilePhoto(formData: FormData) {
  try {
    const session = await getSession()
    if (!session || session.role !== "GURU") {
      return { success: false, error: "Akses ditolak" }
    }

    const file = formData.get("file") as File | null
    if (!file) return { success: false, error: "Tidak ada berkas foto yang dipilih" }

    const validMimes = ["image/jpeg", "image/png", "image/webp"]
    if (!validMimes.includes(file.type)) {
      return { success: false, error: "Format foto harus JPG, PNG, atau WebP" }
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles")
    const baseName = `guru_${session.id}_${Date.now()}`

    const { fileUrl } = await processAndSaveWebP({
      input: buffer,
      targetDir: uploadDir,
      baseName,
      maxWidth: 600,
      maxHeight: 600,
      quality: 85,
    })

    await prisma.guru.update({
      where: { id: session.id },
      data: { fotoWajah: fileUrl },
    })

    revalidatePath("/guru")
    revalidatePath("/guru/profil")

    return { success: true, url: fileUrl }
  } catch (error: any) {
    console.error("Error uploadGuruProfilePhoto:", error)
    return { success: false, error: error.message || "Gagal mengunggah foto profil" }
  }
}

export async function deleteGuruProfilePhoto() {
  try {
    const session = await getSession()
    if (!session || session.role !== "GURU") {
      return { success: false, error: "Akses ditolak" }
    }

    await prisma.guru.update({
      where: { id: session.id },
      data: { fotoWajah: null },
    })

    revalidatePath("/guru")
    revalidatePath("/guru/profil")

    return { success: true }
  } catch (error: any) {
    console.error("Error deleteGuruProfilePhoto:", error)
    return { success: false, error: error.message || "Gagal menghapus foto profil" }
  }
}
