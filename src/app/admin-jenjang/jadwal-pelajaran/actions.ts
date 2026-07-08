"use server"

import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { Hari } from "@prisma/client"

export async function createJadwalAction(
  pengampuId: number,
  semesterId: number,
  hari: Hari,
  jamMulai: string,
  jamSelesai: string
) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN_JENJANG" || !session.jenjangId) {
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

    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Gagal menyimpan jadwal" }
  }
}

export async function deleteJadwalAction(jadwalId: number) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN_JENJANG" || !session.jenjangId) {
      return { success: false, error: "Unauthorized" }
    }

    await prisma.jadwalPelajaran.delete({
      where: { id: jadwalId }
    })

    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Gagal menghapus jadwal" }
  }
}
