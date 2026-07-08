"use server"

import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export async function assignPengampuAction(
  mataPelajaranId: number, 
  kelasFormalIds: number[], 
  guruId: number, 
  tahunAjaranId: number
) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN_JENJANG" || !session.jenjangId) {
      return { success: false, error: "Unauthorized" }
    }

    // 1. Hapus kelas yang tidak dicentang (untuk guru ini dan mapel ini)
    await prisma.pengampuMataPelajaran.deleteMany({
      where: {
        mataPelajaranId,
        guruId,
        tahunAjaranId,
        kelasFormalId: {
          notIn: kelasFormalIds
        }
      }
    })

    // 2. Upsert kelas-kelas yang dicentang
    await prisma.$transaction(
      kelasFormalIds.map((kelasFormalId) => 
        prisma.pengampuMataPelajaran.upsert({
          where: {
            mataPelajaranId_kelasFormalId_tahunAjaranId: {
              mataPelajaranId,
              kelasFormalId,
              tahunAjaranId
            }
          },
          update: {
            guruId
          },
          create: {
            mataPelajaranId,
            kelasFormalId,
            guruId,
            tahunAjaranId
          }
        })
      )
    )

    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Gagal menyimpan pengampu" }
  }
}

export async function removePengampuAction(pengampuId: number) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN_JENJANG" || !session.jenjangId) {
      return { success: false, error: "Unauthorized" }
    }

    await prisma.pengampuMataPelajaran.delete({
      where: { id: pengampuId }
    })

    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Gagal menghapus pengampu" }
  }
}
