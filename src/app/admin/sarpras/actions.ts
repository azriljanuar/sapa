"use server"

import prisma from "@/lib/prisma"
import { getLoggedInAdminJenjang } from "@/lib/auth"

export async function createSarprasJenjang(formData: FormData) {
  try {
    const admin = await getLoggedInAdminJenjang()
    
    if (!admin.jenjangId) {
      return { error: "Akses ditolak" }
    }

    const namaBarang = formData.get("namaBarang") as string
    const kodeBarang = formData.get("kodeBarang") as string
    const kategori = formData.get("kategori") as string
    const jumlah = Number(formData.get("jumlah"))
    const kondisiBaik = Number(formData.get("kondisiBaik"))
    const kondisiRusak = Number(formData.get("kondisiRusak"))
    const sumberDana = formData.get("sumberDana") as string
    const tahunPerolehanRaw = formData.get("tahunPerolehan") as string
    const keterangan = formData.get("keterangan") as string

    if (!namaBarang || isNaN(jumlah)) {
      return { error: "Nama Barang dan Jumlah valid wajib diisi" }
    }

    const tahunPerolehan = tahunPerolehanRaw ? Number(tahunPerolehanRaw) : null

    await prisma.sarprasJenjang.create({
      data: {
        jenjangId: admin.jenjangId,
        namaBarang,
        kodeBarang,
        kategori,
        jumlah,
        kondisiBaik,
        kondisiRusak,
        sumberDana,
        tahunPerolehan,
        keterangan
      }
    })

    return { success: true }
  } catch (error: any) {
    console.error(error)
    return { error: error.message || "Gagal menambah data sarpras" }
  }
}

export async function updateSarprasJenjang(formData: FormData) {
  try {
    const admin = await getLoggedInAdminJenjang()
    
    if (!admin.jenjangId) {
      return { error: "Akses ditolak" }
    }

    const id = Number(formData.get("id"))
    const namaBarang = formData.get("namaBarang") as string
    const kodeBarang = formData.get("kodeBarang") as string
    const kategori = formData.get("kategori") as string
    const jumlah = Number(formData.get("jumlah"))
    const kondisiBaik = Number(formData.get("kondisiBaik"))
    const kondisiRusak = Number(formData.get("kondisiRusak"))
    const sumberDana = formData.get("sumberDana") as string
    const tahunPerolehanRaw = formData.get("tahunPerolehan") as string
    const keterangan = formData.get("keterangan") as string

    if (!id || !namaBarang || isNaN(jumlah)) {
      return { error: "Data tidak valid" }
    }

    // Verify ownership
    const existing = await prisma.sarprasJenjang.findUnique({ where: { id } })
    if (existing?.jenjangId !== admin.jenjangId) {
      return { error: "Akses ditolak" }
    }

    const tahunPerolehan = tahunPerolehanRaw ? Number(tahunPerolehanRaw) : null

    await prisma.sarprasJenjang.update({
      where: { id },
      data: {
        namaBarang,
        kodeBarang,
        kategori,
        jumlah,
        kondisiBaik,
        kondisiRusak,
        sumberDana,
        tahunPerolehan,
        keterangan
      }
    })

    return { success: true }
  } catch (error: any) {
    console.error(error)
    return { error: error.message || "Gagal memperbarui data sarpras" }
  }
}

export async function deleteSarprasJenjang(id: number) {
  try {
    const admin = await getLoggedInAdminJenjang()
    
    if (!admin.jenjangId) {
      return { error: "Akses ditolak" }
    }

    // Verify ownership
    const existing = await prisma.sarprasJenjang.findUnique({ where: { id } })
    if (existing?.jenjangId !== admin.jenjangId) {
      return { error: "Akses ditolak" }
    }
    
    await prisma.sarprasJenjang.delete({
      where: { id }
    })

    return { success: true }
  } catch (error: any) {
    console.error(error)
    return { error: error.message || "Gagal menghapus data sarpras" }
  }
}
