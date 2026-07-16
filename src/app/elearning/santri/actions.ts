"use server"

import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

// Catatan: Untuk SANTRI login, session.id = santri.id dan session.email = santri.nisn
// Lihat src/app/login/actions.ts untuk referensi

export async function kumpulkanTugas(data: { tugasId: number; fileUrl?: string; catatanSantri?: string }) {
  const session = await getSession()
  if (!session || session.role !== "SANTRI") throw new Error("Unauthorized")

  try {
    // session.id = santri.id untuk SANTRI login
    const result = await prisma.pengumpulanTugas.upsert({
      where: {
        tugasId_santriId: {
          tugasId: data.tugasId,
          santriId: session.id
        }
      },
      update: {
        fileUrl: data.fileUrl,
        catatanSantri: data.catatanSantri,
        waktuKumpul: new Date()
      },
      create: {
        tugasId: data.tugasId,
        santriId: session.id,
        fileUrl: data.fileUrl,
        catatanSantri: data.catatanSantri,
      }
    })

    revalidatePath(`/elearning/santri/tugas/${data.tugasId}`)
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
