"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { getLoggedInAdminJenjang } from "@/lib/auth"

export async function addSantriToKelas(kelasId: number, santriIds: number[]) {
  try {
    const admin = await getLoggedInAdminJenjang()
    if (!admin.jenjangId) throw new Error("Akses ditolak.")

    // Verifikasi kelas milik jenjang ini
    const kelas = await prisma.kelasFormal.findUnique({ where: { id: kelasId } })
    if (!kelas || kelas.jenjangId !== admin.jenjangId) {
      throw new Error("Kelas tidak valid.")
    }

    // Update santri-santri yang dipilih ke RiwayatKelas
    // Kita cek dulu apakah sudah ada
    const existingRiwayat = await prisma.riwayatKelas.findMany({
      where: {
        kelasFormalId: kelasId,
        santriId: { in: santriIds }
      }
    })
    
    const existingSantriIds = existingRiwayat.map(r => r.santriId)
    const newSantriIds = santriIds.filter(id => !existingSantriIds.includes(id))

    if (newSantriIds.length > 0) {
      await prisma.riwayatKelas.createMany({
        data: newSantriIds.map(id => ({
          kelasFormalId: kelasId,
          santriId: id
        }))
      })
    }

    revalidatePath(`/admin-jenjang/kelas-formal/${kelasId}`)
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Gagal menambahkan santri ke kelas" }
  }
}

export async function removeSantriFromKelas(kelasId: number, santriId: number) {
  try {
    const admin = await getLoggedInAdminJenjang()
    if (!admin.jenjangId) throw new Error("Akses ditolak.")

    // Verifikasi kelas milik jenjang ini
    const kelas = await prisma.kelasFormal.findUnique({ where: { id: kelasId } })
    if (!kelas || kelas.jenjangId !== admin.jenjangId) {
      throw new Error("Kelas tidak valid.")
    }

    await prisma.riwayatKelas.deleteMany({
      where: {
        santriId: santriId,
        kelasFormalId: kelasId,
      }
    })

    revalidatePath(`/admin-jenjang/kelas-formal/${kelasId}`)
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Gagal menghapus santri dari kelas" }
  }
}

export async function removeSantriFromKelasBulk(kelasId: number, santriIds: number[]) {
  try {
    const admin = await getLoggedInAdminJenjang()
    if (!admin.jenjangId) throw new Error("Akses ditolak.")

    // Verifikasi kelas milik jenjang ini
    const kelas = await prisma.kelasFormal.findUnique({ where: { id: kelasId } })
    if (!kelas || kelas.jenjangId !== admin.jenjangId) {
      throw new Error("Kelas tidak valid.")
    }

    await prisma.riwayatKelas.deleteMany({
      where: {
        kelasFormalId: kelasId,
        santriId: { in: santriIds },
      }
    })

    revalidatePath(`/admin-jenjang/kelas-formal/${kelasId}`)
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Gagal mengeluarkan santri secara massal" }
  }
}

export async function luluskanSantriBulk(kelasId: number, santriIds: number[], tahunLulusId: number) {
  try {
    const admin = await getLoggedInAdminJenjang()
    if (!admin.jenjangId) throw new Error("Akses ditolak.")

    // Verifikasi kelas milik jenjang ini
    const kelas = await prisma.kelasFormal.findUnique({ where: { id: kelasId } })
    if (!kelas || kelas.jenjangId !== admin.jenjangId) {
      throw new Error("Kelas tidak valid.")
    }

    // Update data santri menjadi alumni dan set tahunLulusId
    await prisma.santriJenjang.updateMany({
      where: {
        santriId: { in: santriIds },
        jenjangId: admin.jenjangId
      },
      data: {
        isAlumni: true,
        tahunLulusId: tahunLulusId,
      }
    })

    // Hapus juga riwayat kelas mereka yang sekarang di kelas ini 
    // agar mereka tidak nyangkut (atau biarkan saja riwayatnya? User minta dipindahkan dan tidak ada lagi pada data di kelas 12 ketika dipindahkan).
    // Lebih aman hapus riwayatKelas agar mereka hilang dari anggota kelas saat ini.
    await prisma.riwayatKelas.deleteMany({
      where: {
        kelasFormalId: kelasId,
        santriId: { in: santriIds },
      }
    })

    revalidatePath(`/admin-jenjang/kelas-formal/${kelasId}`)
    revalidatePath(`/admin-jenjang/santri`)
    revalidatePath(`/admin-jenjang/alumni`)
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Gagal meluluskan santri." }
  }
}
