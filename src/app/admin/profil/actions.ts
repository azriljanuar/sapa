"use server"

import prisma from "@/lib/prisma"
import { getLoggedInAdmin } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function updateProfilJenjang(formData: FormData) {
  try {
    await getLoggedInAdmin()

    const namaLembaga = formData.get("namaLembaga") as string
    const singkatan = formData.get("singkatan") as string
    const tingkatJenjang = formData.get("tingkatJenjang") as string
    const sebutanSantri = formData.get("sebutanSantri") as string
    const sebutanGuru = formData.get("sebutanGuru") as string
    const npsn = formData.get("npsn") as string
    const nsm = formData.get("nsm") as string
    const akreditasi = formData.get("akreditasi") as string
    const namaKepalaMadrasah = formData.get("namaKepalaMadrasah") as string
    const nipKepalaMadrasah = formData.get("nipKepalaMadrasah") as string
    const alamat = formData.get("alamat") as string
    const telepon = formData.get("telepon") as string
    const email = formData.get("email") as string
    const website = formData.get("website") as string
    const templateSKL = formData.get("templateSKL") as string
    const waktuMulaiAbsen = formData.get("waktuMulaiAbsen") as string
    const waktuAkhirAbsen = formData.get("waktuAkhirAbsen") as string

    const updateData: any = {
      namaLembaga: namaLembaga || undefined,
      singkatan: singkatan || undefined,
      tingkatJenjang: tingkatJenjang || undefined,
      sebutanSantri: sebutanSantri || "Santri",
      sebutanGuru: sebutanGuru || "Guru",
      npsn: npsn || null,
      nsm: nsm || null,
      akreditasi: akreditasi || null,
      namaKepalaMadrasah: namaKepalaMadrasah || null,
      nipKepalaMadrasah: nipKepalaMadrasah || null,
      alamat: alamat || null,
      telepon: telepon || null,
      email: email || null,
      website: website || null,
      templateSKL: templateSKL || null,
      waktuMulaiAbsen: waktuMulaiAbsen || null,
      waktuAkhirAbsen: waktuAkhirAbsen || null
    }

    await prisma.identitasLembaga.upsert({
      where: { id: 1 },
      update: updateData,
      create: {
        id: 1,
        ...updateData
      }
    })

    // Sinkronkan juga ke jenjang (jika ada) untuk backwards compatibility
    try {
      await prisma.jenjangPendidikan.updateMany({
        where: { id: 2 },
        data: {
          nama: namaLembaga || undefined,
          singkatan: singkatan || undefined,
          npsn: npsn || null,
          namaKepalaMadrasah: namaKepalaMadrasah || null,
          nipKepalaMadrasah: nipKepalaMadrasah || null,
          alamat: alamat || null,
          telepon: telepon || null,
          email: email || null,
          templateSKL: templateSKL || null,
          waktuMulaiAbsen: waktuMulaiAbsen || null,
          waktuAkhirAbsen: waktuAkhirAbsen || null
        }
      })
    } catch (e) {
      // Ignore
    }

    revalidatePath("/admin/profil")
    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    console.error("updateProfil error:", error)
    return { error: error.message || "Gagal memperbarui profil lembaga" }
  }
}
