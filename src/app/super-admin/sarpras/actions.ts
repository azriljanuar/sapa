"use server"

import prisma from "@/lib/prisma"
import { getLoggedInSuperAdmin } from "@/lib/auth"

export async function createSarprasPesantren(formData: FormData) {
  try {
    await getLoggedInSuperAdmin()
    
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

    await prisma.sarprasPesantren.create({
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
    return { error: error.message || "Gagal menambah data sarpras" }
  }
}

export async function updateSarprasPesantren(formData: FormData) {
  try {
    await getLoggedInSuperAdmin()
    
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

    const tahunPerolehan = tahunPerolehanRaw ? Number(tahunPerolehanRaw) : null

    await prisma.sarprasPesantren.update({
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

export async function deleteSarprasPesantren(id: number) {
  try {
    await getLoggedInSuperAdmin()
    
    await prisma.sarprasPesantren.delete({
      where: { id }
    })

    return { success: true }
  } catch (error: any) {
    console.error(error)
    return { error: error.message || "Gagal menghapus data sarpras" }
  }
}
