"use server"

import prisma from "@/lib/prisma"
import { getLoggedInAdminJenjang } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function createMataPelajaran(formData: FormData) {
  try {
    const admin = await getLoggedInAdminJenjang()

    const nama = formData.get("nama") as string
    const kode = formData.get("kode") as string
    const kkm = formData.get("kkm") ? parseFloat(formData.get("kkm") as string) : null

    if (!nama) {
      return { success: false, error: "Nama mata pelajaran wajib diisi" }
    }

    await prisma.mataPelajaran.create({
      data: {
        nama,
        kode: kode || null,
        kkm: kkm || null,
        jenjangId: admin.jenjangId
      }
    })

    revalidatePath("/admin/mata-pelajaran")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Gagal menambahkan mata pelajaran" }
  }
}

export async function updateMataPelajaran(id: number, formData: FormData) {
  try {
    const admin = await getLoggedInAdminJenjang()

    const nama = formData.get("nama") as string
    const kode = formData.get("kode") as string
    const kkm = formData.get("kkm") ? parseFloat(formData.get("kkm") as string) : null

    if (!nama) {
      return { success: false, error: "Nama mata pelajaran wajib diisi" }
    }

    // Pastikan data yang diedit adalah milik jenjangnya
    const existing = await prisma.mataPelajaran.findFirst({
      where: { id, jenjangId: admin.jenjangId }
    })
    
    if (!existing) {
      return { success: false, error: "Data tidak ditemukan" }
    }

    await prisma.mataPelajaran.update({
      where: { id },
      data: {
        nama,
        kode: kode || null,
        kkm: kkm || null,
      }
    })

    revalidatePath("/admin/mata-pelajaran")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Gagal mengubah mata pelajaran" }
  }
}

export async function deleteMataPelajaran(id: number) {
  try {
    const admin = await getLoggedInAdminJenjang()

    // Verifikasi kepemilikan
    const existing = await prisma.mataPelajaran.findFirst({
      where: { id, jenjangId: admin.jenjangId }
    })
    
    if (!existing) {
      return { success: false, error: "Data tidak ditemukan" }
    }

    await prisma.mataPelajaran.delete({
      where: { id }
    })

    revalidatePath("/admin/mata-pelajaran")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Gagal menghapus mata pelajaran" }
  }
}
