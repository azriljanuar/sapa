"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { getLoggedInAdminJenjang } from "@/lib/auth"

const kelasSchema = z.object({
  id: z.number().optional(),
  namaKelas: z.string().min(1, "Nama kelas wajib diisi"),
  waliKelasId: z.number().optional(),
})

export async function createKelas(formData: FormData) {
  try {
    const admin = await getLoggedInAdminJenjang()
    if (!admin.jenjangId) throw new Error("Akses ditolak.")

    const rawData = {
      namaKelas: formData.get("namaKelas") as string,
      waliKelasId: Number(formData.get("waliKelasId")),
    }

    const validated = kelasSchema.parse(rawData)

    const { getSelectedTahunAjaran } = await import("@/lib/tahun-ajaran")
    const activeTahunAjaran = await getSelectedTahunAjaran()
    
    if (!activeTahunAjaran) {
      throw new Error("Tidak ada Tahun Ajaran yang aktif. Harap setting di Super Admin terlebih dahulu.")
    }

    await prisma.kelasFormal.create({
      data: {
        namaKelas: validated.namaKelas,
        jenjangId: admin.jenjangId,
        waliKelasId: validated.waliKelasId && validated.waliKelasId > 0 ? validated.waliKelasId : null,
        tahunAjaranId: activeTahunAjaran.id,
      },
    })

    revalidatePath("/admin-jenjang/kelas-formal")
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Gagal membuat kelas formal" }
  }
}

export async function updateKelas(formData: FormData) {
  try {
    const admin = await getLoggedInAdminJenjang()
    if (!admin.jenjangId) throw new Error("Akses ditolak.")

    const rawData = {
      id: Number(formData.get("id")),
      namaKelas: formData.get("namaKelas") as string,
      waliKelasId: Number(formData.get("waliKelasId")),
    }

    const validated = kelasSchema.parse(rawData)

    const existing = await prisma.kelasFormal.findUnique({ where: { id: validated.id } })
    if (!existing || existing.jenjangId !== admin.jenjangId) {
       throw new Error("Kelas tidak ditemukan atau tidak berhak mengaksesnya.")
    }

    await prisma.kelasFormal.update({
      where: { id: validated.id },
      data: {
        namaKelas: validated.namaKelas,
        waliKelasId: validated.waliKelasId && validated.waliKelasId > 0 ? validated.waliKelasId : null,
      },
    })

    revalidatePath("/admin-jenjang/kelas-formal")
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Gagal memperbarui kelas formal" }
  }
}

export async function deleteKelas(id: number) {
  try {
    const admin = await getLoggedInAdminJenjang()
    if (!admin.jenjangId) throw new Error("Akses ditolak.")

    const existing = await prisma.kelasFormal.findUnique({ where: { id } })
    if (!existing || existing.jenjangId !== admin.jenjangId) {
       throw new Error("Kelas tidak ditemukan atau tidak berhak mengaksesnya.")
    }

    await prisma.kelasFormal.delete({ where: { id } })

    revalidatePath("/admin-jenjang/kelas-formal")
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Gagal menghapus kelas formal" }
  }
}
