"use server"

import prisma from "@/lib/prisma"
import { getLoggedInAdminJenjang } from "@/lib/auth"
import { Hari } from "@prisma/client"
import { revalidatePath } from "next/cache"

export async function createJadwalAction(
  pengampuId: number,
  semesterId: number,
  hari: Hari,
  jamMulai: string,
  jamSelesai: string
) {
  try {
    const admin = await getLoggedInAdminJenjang()
    if (!admin) {
      return { success: false, error: "Unauthorized" }
    }

    await prisma.jadwalPelajaran.create({
      data: {
        pengampuId,
        semesterId,
        hari,
        jamMulai,
        jamSelesai
      }
    })

    revalidatePath("/admin/jadwal-pelajaran")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Gagal menyimpan jadwal" }
  }
}

export async function deleteJadwalAction(jadwalId: number) {
  try {
    const admin = await getLoggedInAdminJenjang()
    if (!admin) {
      return { success: false, error: "Unauthorized" }
    }

    await prisma.jadwalPelajaran.delete({
      where: { id: jadwalId }
    })

    revalidatePath("/admin/jadwal-pelajaran")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Gagal menghapus jadwal" }
  }
}
