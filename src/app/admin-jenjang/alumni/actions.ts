"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { getLoggedInAdminJenjang } from "@/lib/auth"

export async function transferAlumniToJenjang(santriIds: number[], targetJenjangId: number) {
  try {
    const admin = await getLoggedInAdminJenjang()
    if (!admin.jenjangId) throw new Error("Akses ditolak.")

    // Ambil data alumni yang dipilih
    const alumniList = await prisma.santri.findMany({
      where: {
        id: { in: santriIds },
        jenjangs: { some: { jenjangId: admin.jenjangId, isAlumni: true } }
      }
    })

    if (alumniList.length === 0) {
      throw new Error("Tidak ada data alumni yang valid.")
    }

    // Sambungkan ke jenjang baru tanpa duplikasi
    for (const alumni of alumniList) {
      await prisma.santriJenjang.upsert({
        where: { santriId_jenjangId: { santriId: alumni.id, jenjangId: targetJenjangId } },
        update: { isAlumni: false },
        create: { santriId: alumni.id, jenjangId: targetJenjangId, isAlumni: false }
      })
    }

    revalidatePath("/admin-jenjang/alumni")
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Gagal mentransfer alumni" }
  }
}

export async function updateKeteranganLulus(id: number, keterangan: string) {
  try {
    const admin = await getLoggedInAdminJenjang()
    if (!admin.jenjangId) throw new Error("Akses ditolak.")

    const existing = await prisma.santriJenjang.findUnique({
      where: { santriId_jenjangId: { santriId: id, jenjangId: admin.jenjangId } }
    })
    if (!existing) {
      throw new Error("Data tidak valid.")
    }

    await prisma.santriJenjang.update({
      where: { id: existing.id },
      data: { keteranganLulus: keterangan }
    })

    revalidatePath("/admin-jenjang/alumni")
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Gagal memperbarui keterangan" }
  }
}
