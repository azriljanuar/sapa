"use server"

import prisma from "@/lib/prisma"
import { getLoggedInAdminJenjang } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { StatusKenaikanKelas } from "@prisma/client"

export async function promoteSantriBulk(
  santriIds: number[], 
  targetKelasId: number,
  currentKelasId?: number,
  statusAksi: StatusKenaikanKelas = "NAIK_KELAS"
) {
  try {
    const admin = await getLoggedInAdminJenjang()
    if (!admin.jenjangId) throw new Error("Unauthorized")

    // Verifikasi kelas target ada dan milik jenjang ini
    const targetKelas = await prisma.kelasFormal.findUnique({
      where: { id: targetKelasId }
    })

    if (!targetKelas || targetKelas.jenjangId !== admin.jenjangId) {
      throw new Error("Kelas tujuan tidak valid")
    }

    await prisma.$transaction(async (tx) => {
      // 1. Jika ada currentKelasId, perbarui status RiwayatKelas sebelumnya (TIDAK DIHAPUS)
      if (currentKelasId) {
        await tx.riwayatKelas.updateMany({
          where: {
            santriId: { in: santriIds },
            kelasFormalId: currentKelasId,
          },
          data: {
            statusKenaikan: statusAksi,
            tanggalSelesai: new Date(),
          }
        })
      }

      // 2. Buat record baru di kelas tujuan untuk Tahun Ajaran baru dengan status AKTIF
      for (const santriId of santriIds) {
        await tx.riwayatKelas.upsert({
          where: {
            santriId_kelasFormalId: {
              santriId,
              kelasFormalId: targetKelasId
            }
          },
          create: {
            santriId,
            kelasFormalId: targetKelasId,
            statusKenaikan: "AKTIF",
          },
          update: {
            statusKenaikan: "AKTIF",
          }
        })
      }
    })

    revalidatePath("/admin/kelas-formal")
    if (currentKelasId) revalidatePath(`/admin/kelas-formal/${currentKelasId}`)
    revalidatePath(`/admin/kelas-formal/${targetKelasId}`)
    revalidatePath("/admin/santri")

    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Gagal memproses kenaikan kelas" }
  }
}
