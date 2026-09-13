"use server"

import prisma from "@/lib/prisma"
import { getLoggedInAdminJenjang } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { writeFile } from "fs/promises"
import path from "path"

export async function updateAccountProfile(values: { nama: string, email: string }) {
  try {
    const admin = await getLoggedInAdminJenjang()
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

    return { success: true }
  } catch (error: any) {
    console.error(error)
    return { success: false, error: "Gagal memperbarui profil akun." }
  }
}

export async function updatePassword(values: { oldPassword: string, newPassword: string }) {
  try {
    const admin = await getLoggedInAdminJenjang()
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
    const admin = await getLoggedInAdminJenjang()
    if (!admin || !admin.jenjangId) return { success: false, error: "Unauthorized" }

    const file = formData.get("file") as File | null
    const type = formData.get("type") as "logo" | "icon"

    if (!file) return { success: false, error: "File tidak ditemukan" }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.name)
    const filename = `${type}_${admin.jenjangId}_${uniqueSuffix}${ext}`
    
    // Save to public/uploads
    const uploadDir = path.join(process.cwd(), "public/uploads")
    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)

    const url = `/uploads/${filename}`

    // Update DB
    if (type === "logo") {
      await prisma.jenjangPendidikan.update({
        where: { id: admin.jenjangId },
        data: { logoUrl: url }
      })
    } else {
      await prisma.jenjangPendidikan.update({
        where: { id: admin.jenjangId },
        data: { iconUrl: url }
      })
    }

    return { success: true, url }
  } catch (error: any) {
    console.error("Upload error:", error)
    return { success: false, error: "Terjadi kesalahan saat upload." }
  }
}
