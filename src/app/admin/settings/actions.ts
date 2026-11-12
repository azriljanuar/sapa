"use server"

import prisma from "@/lib/prisma"
import { getLoggedInAdmin } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { writeFile } from "fs/promises"
import path from "path"
import { revalidatePath } from "next/cache"
import { processAndSaveWebP } from "@/lib/image-processor"

export async function updateAccountProfile(values: { nama: string, email: string }) {
  try {
    const admin = await getLoggedInAdmin()
    if (!admin) return { success: false, error: "Unauthorized" }

    // Check email uniqueness if email changed
    if (values.email) {
      const existing = await prisma.user.findUnique({
        where: { email: values.email }
      })
      if (existing && existing.id !== admin.id) {
        return { success: false, error: "Email sudah digunakan oleh akun lain." }
      }
    }

    await prisma.user.update({
      where: { id: admin.id },
      data: {
        nama: values.nama,
        email: values.email
      }
    })

    revalidatePath("/admin/settings")
    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    console.error(error)
    return { success: false, error: "Gagal memperbarui profil akun." }
  }
}

export async function updatePassword(values: { oldPassword: string, newPassword: string }) {
  try {
    const admin = await getLoggedInAdmin()
    if (!admin) return { success: false, error: "Unauthorized" }

    const user = await prisma.user.findUnique({
      where: { id: admin.id }
    })
    
    if (!user) return { success: false, error: "User tidak ditemukan" }

    const isMatch = await bcrypt.compare(values.oldPassword, user.password)
    if (!isMatch) {
      return { success: false, error: "Password lama tidak sesuai." }
    }

    const hashedPassword = await bcrypt.hash(values.newPassword, 10)

    await prisma.user.update({
      where: { id: admin.id },
      data: { password: hashedPassword }
    })

    return { success: true }
  } catch (error: any) {
    console.error(error)
    return { success: false, error: "Gagal memperbarui password." }
  }
}

export async function uploadBrandingAsset(formData: FormData) {
  try {
    const admin = await getLoggedInAdmin()
    if (!admin) return { success: false, error: "Unauthorized" }

    const file = formData.get("file") as File | null
    const type = formData.get("type") as "logo" | "icon"

    if (!file) return { success: false, error: "File tidak ditemukan" }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const baseName = `${type}_admin_${uniqueSuffix}`
    
    // Save to public/uploads as WebP
    const uploadDir = path.join(process.cwd(), "public/uploads")
    const { fileUrl: url } = await processAndSaveWebP({
      input: buffer,
      targetDir: uploadDir,
      baseName,
      maxWidth: type === "logo" ? 800 : 256,
      quality: 85,
    })

    // Update IdentitasLembaga
    if (type === "logo") {
      await prisma.identitasLembaga.upsert({
        where: { id: 1 },
        update: { logoUrl: url },
        create: { id: 1, logoUrl: url }
      })
    } else {
      await prisma.identitasLembaga.upsert({
        where: { id: 1 },
        update: { iconUrl: url },
        create: { id: 1, iconUrl: url }
      })
    }

    // Also update jenjang for backwards compatibility
    try {
      if (type === "logo") {
        await prisma.jenjangPendidikan.updateMany({
          where: { id: 2 },
          data: { logoUrl: url }
        })
      } else {
        await prisma.jenjangPendidikan.updateMany({
          where: { id: 2 },
          data: { iconUrl: url }
        })
      }
    } catch (e) {
      // Ignore
    }

    revalidatePath("/admin/settings")
    revalidatePath("/admin")
    return { success: true, url }
  } catch (error: any) {
    console.error("Upload error:", error)
    return { success: false, error: "Terjadi kesalahan saat upload." }
  }
}
