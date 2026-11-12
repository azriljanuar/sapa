"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function pairRfidCard({
  id,
  tipe,
  rfidCardId,
}: {
  id: number
  tipe: "SANTRI" | "GURU"
  rfidCardId: string | null
}): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanUid = rfidCardId && rfidCardId.trim().length > 0
      ? rfidCardId.trim().toUpperCase()
      : null

    if (cleanUid) {
      // 1. Cek apakah UID sudah dipakai oleh Guru lain
      const existingGuru = await prisma.guru.findUnique({
        where: { rfidCardId: cleanUid },
        select: { id: true, nama: true },
      })

      if (existingGuru && !(tipe === "GURU" && existingGuru.id === id)) {
        return {
          success: false,
          error: `Kartu RFID ${cleanUid} sudah dipakai oleh Guru: ${existingGuru.nama}`,
        }
      }

      // 2. Cek apakah UID sudah dipakai oleh Santri lain
      const existingSantri = await prisma.santri.findUnique({
        where: { rfidCardId: cleanUid },
        select: { id: true, namaLengkap: true },
      })

      if (existingSantri && !(tipe === "SANTRI" && existingSantri.id === id)) {
        return {
          success: false,
          error: `Kartu RFID ${cleanUid} sudah dipakai oleh Santri: ${existingSantri.namaLengkap}`,
        }
      }
    }

    if (tipe === "SANTRI") {
      await prisma.santri.update({
        where: { id },
        data: { rfidCardId: cleanUid },
      })
      revalidatePath("/admin/santri")
      revalidatePath("/admin/kartu-identitas")
    } else {
      await prisma.guru.update({
        where: { id },
        data: { rfidCardId: cleanUid },
      })
      revalidatePath("/admin/guru")
      revalidatePath("/admin/kartu-identitas")
    }

    return { success: true }
  } catch (error: any) {
    console.error("pairRfidCard error:", error)
    return { success: false, error: error.message || "Gagal menyimpan kartu RFID" }
  }
}
