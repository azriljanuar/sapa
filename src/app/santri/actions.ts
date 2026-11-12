"use server"

import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import path from "path"
import { processAndSaveWebP } from "@/lib/image-processor"

export async function uploadSantriProfilePhoto(formData: FormData) {
  try {
    const session = await getSession()
    if (!session || session.role !== "SANTRI") {
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
    const baseName = `santri_${session.id}_${Date.now()}`

    const { fileUrl } = await processAndSaveWebP({
      input: buffer,
      targetDir: uploadDir,
      baseName,
      maxWidth: 600,
      maxHeight: 600,
      quality: 85,
    })

    await prisma.santri.update({
      where: { id: session.id },
      data: { fotoWajah: fileUrl },
    })

    revalidatePath("/santri")
    revalidatePath("/santri/profil")

    return { success: true, url: fileUrl }
  } catch (error: any) {
    console.error("Error uploadSantriProfilePhoto:", error)
    return { success: false, error: error.message || "Gagal mengunggah foto profil" }
  }
}

export async function deleteSantriProfilePhoto() {
  try {
    const session = await getSession()
    if (!session || session.role !== "SANTRI") {
      return { success: false, error: "Akses ditolak" }
    }

    await prisma.santri.update({
      where: { id: session.id },
      data: { fotoWajah: null },
    })

    revalidatePath("/santri")
    revalidatePath("/santri/profil")

    return { success: true }
  } catch (error: any) {
    console.error("Error deleteSantriProfilePhoto:", error)
    return { success: false, error: error.message || "Gagal menghapus foto profil" }
  }
}
