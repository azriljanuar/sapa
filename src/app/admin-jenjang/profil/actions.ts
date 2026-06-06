"use server"

import prisma from "@/lib/prisma"
import { getLoggedInAdminJenjang } from "@/lib/auth"

export async function updateProfilJenjang(formData: FormData) {
  try {
    const admin = await getLoggedInAdminJenjang()
    
    if (!admin.jenjangId) {
      return { error: "Akses ditolak" }
    }

    const npsn = formData.get("npsn") as string
    const namaKepalaMadrasah = formData.get("namaKepalaMadrasah") as string
    const nipKepalaMadrasah = formData.get("nipKepalaMadrasah") as string
    const alamat = formData.get("alamat") as string
    const telepon = formData.get("telepon") as string
    const email = formData.get("email") as string

    await prisma.jenjangPendidikan.update({
      where: { id: admin.jenjangId },
      data: {
        npsn,
        namaKepalaMadrasah,
        nipKepalaMadrasah,
        alamat,
        telepon,
        email
      }
    })

    return { success: true }
  } catch (error: any) {
    console.error(error)
    return { error: error.message || "Gagal memperbarui profil jenjang" }
  }
}
