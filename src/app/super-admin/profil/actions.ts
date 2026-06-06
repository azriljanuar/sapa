"use server"

import prisma from "@/lib/prisma"
import { getLoggedInSuperAdmin } from "@/lib/auth"

export async function updateProfilPesantren(formData: FormData) {
  try {
    await getLoggedInSuperAdmin()

    const id = formData.get("id") ? Number(formData.get("id")) : 0
    const namaPesantren = formData.get("namaPesantren") as string
    const nspp = formData.get("nspp") as string
    const alamatLengkap = formData.get("alamatLengkap") as string
    const telepon = formData.get("telepon") as string
    const email = formData.get("email") as string
    const website = formData.get("website") as string
    const namaPimpinan = formData.get("namaPimpinan") as string

    if (!namaPesantren) {
      return { error: "Nama Pesantren wajib diisi" }
    }

    if (id > 0) {
      // Update
      await prisma.profilPesantren.update({
        where: { id },
        data: {
          namaPesantren,
          nspp,
          alamatLengkap,
          telepon,
          email,
          website,
          namaPimpinan
        }
      })
    } else {
      // Create first time
      await prisma.profilPesantren.create({
        data: {
          namaPesantren,
          nspp,
          alamatLengkap,
          telepon,
          email,
          website,
          namaPimpinan
        }
      })
    }

    return { success: true }
  } catch (error: any) {
    console.error(error)
    return { error: error.message || "Gagal memperbarui profil pesantren" }
  }
}
