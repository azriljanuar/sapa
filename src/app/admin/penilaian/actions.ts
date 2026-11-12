"use server"

import prisma from "@/lib/prisma"
import { getLoggedInAdmin } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function toggleRilisNilaiPengampu(pengampuId: number, nilaiDirilis: boolean) {
  try {
    await getLoggedInAdmin()

    await prisma.pengampuMataPelajaran.update({
      where: { id: pengampuId },
      data: {
        nilaiDirilis,
        tanggalRilis: nilaiDirilis ? new Date() : null,
      }
    })

    revalidatePath("/admin/penilaian")
    revalidatePath("/santri/nilai")
    return { success: true }
  } catch (e: any) {
    console.error("toggleRilisNilaiPengampu error:", e)
    return { success: false, error: e.message || "Gagal mengubah status rilis nilai" }
  }
}

export async function toggleRilisSemuaNilaiSemester(semesterId: number, nilaiDirilis: boolean) {
  try {
    await getLoggedInAdmin()

    // 1. Update status global semester
    const sem = await prisma.semester.update({
      where: { id: semesterId },
      data: { nilaiDirilis },
      include: { tahunAjaran: true }
    })

    // 2. Update seluruh pengampu di tahun ajaran semester ini
    await prisma.pengampuMataPelajaran.updateMany({
      where: {
        tahunAjaranId: sem.tahunAjaranId
      },
      data: {
        nilaiDirilis,
        tanggalRilis: nilaiDirilis ? new Date() : null
      }
    })

    revalidatePath("/admin/penilaian")
    revalidatePath("/santri/nilai")
    return { success: true }
  } catch (e: any) {
    console.error("toggleRilisSemuaNilaiSemester error:", e)
    return { success: false, error: e.message || "Gagal mengubah status rilis semester" }
  }
}
