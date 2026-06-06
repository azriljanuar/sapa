"use server"

import prisma from "@/lib/prisma"
import { getLoggedInAdminJenjang } from "@/lib/auth"

export async function promoteSantriBulk(
  santriIds: number[], 
  targetKelasId: number
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

    // Insert to RiwayatKelas for the target class
    // Gunakan transaksi agar aman
    await prisma.$transaction(
      santriIds.map(santriId => 
        prisma.riwayatKelas.upsert({
          where: {
            santriId_kelasFormalId: {
              santriId,
              kelasFormalId: targetKelasId
            }
          },
          create: {
            santriId,
            kelasFormalId: targetKelasId
          },
          update: {} // do nothing if already exists
        })
      )
    )

    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Gagal menaikkan kelas" }
  }
}
