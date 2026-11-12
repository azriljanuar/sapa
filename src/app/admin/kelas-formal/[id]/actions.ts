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

    revalidatePath(`/admin/kelas-formal/${kelasId}`)
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

    revalidatePath(`/admin/kelas-formal/${kelasId}`)
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

    revalidatePath(`/admin/kelas-formal/${kelasId}`)
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

    // 1. Update status santri menjadi ALUMNI secara langsung pada tabel Santri
    await prisma.santri.updateMany({
      where: { id: { in: santriIds } },
      data: {
        status: "ALUMNI",
        tahunLulusId: tahunLulusId,
      }
    })

    // Backwards compatibility untuk SantriJenjang
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

    // 2. Tandai RiwayatKelas siswa di kelas ini sebagai LULUS (TIDAK DIHAPUS agar riwayat masa lalu tetap aman)
    await prisma.riwayatKelas.updateMany({
      where: {
        kelasFormalId: kelasId,
        santriId: { in: santriIds },
      },
      data: {
        statusKenaikan: "LULUS",
        tanggalSelesai: new Date(),
      }
    })

    revalidatePath(`/admin`)
    revalidatePath(`/admin/kelas-formal`)
    revalidatePath(`/admin/kelas-formal/${kelasId}`)
    revalidatePath(`/admin/santri`)
    revalidatePath(`/admin/alumni`)
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Gagal meluluskan santri." }
  }
}
