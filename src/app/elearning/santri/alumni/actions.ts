"use server"

import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function updateProfilAlumniSantri(jenjangId: number, data: {
  statusLanjutan: string | null
  namaInstansi?: string
  programStudi?: string
  kotaDomisiliSekarang?: string
  kontakWA?: string
  email?: string
}) {
  const session = await getSession()
  if (!session || session.role !== "SANTRI") {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Pastikan dia adalah alumni di jenjang tersebut
    const existing = await prisma.santriJenjang.findUnique({
      where: {
        santriId_jenjangId: {
          santriId: session.id,
          jenjangId: jenjangId
        }
      }
    })

    if (!existing || !existing.isAlumni) {
      return { success: false, error: "Data alumni tidak ditemukan atau akses ditolak." }
    }

    await prisma.santriJenjang.update({
      where: {
        santriId_jenjangId: {
          santriId: session.id,
          jenjangId: jenjangId
        }
      },
      data: {
        statusLanjutan: data.statusLanjutan as any,
        namaInstansi: data.namaInstansi || null,
        programStudi: data.programStudi || null,
        kotaDomisiliSekarang: data.kotaDomisiliSekarang || null,
        kontakWA: data.kontakWA || null,
        email: data.email || null,
      }
    })

    return { success: true }
  } catch (error) {
    console.error("Failed to update profil alumni santri:", error)
    return { success: false, error: "Gagal menyimpan data" }
  }
}
