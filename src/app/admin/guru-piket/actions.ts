"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { getLoggedInAdminJenjang } from "@/lib/auth"
import { getSelectedTahunAjaran } from "@/lib/ta-context"
import { Hari } from "@prisma/client"

export async function getGuruPiketList() {
  const admin = await getLoggedInAdminJenjang()
  if (!admin.jenjangId) return []

  const activeTA = await getSelectedTahunAjaran()
  if (!activeTA) return []

  const piketData = await prisma.guruPiket.findMany({
    where: {
      jenjangId: admin.jenjangId,
      tahunAjaranId: activeTA.id,
    },
    include: {
      guru: {
        select: {
          id: true,
          nama: true,
          nip: true,
          email: true,
          noTelepon: true,
          fotoWajah: true,
        },
      },
    },
    orderBy: [
      { guru: { nama: "asc" } },
      { hari: "asc" },
    ],
  })

  // Group by guruId
  const groupedMap = new Map<number, {
    guru: {
      id: number
      nama: string
      nip: string | null
      email: string
      noTelepon: string | null
      fotoWajah: string | null
    }
    assignments: { id: number; hari: Hari; keterangan: string | null }[]
    hariList: Hari[]
    keterangan: string | null
  }>()

  for (const item of piketData) {
    if (!groupedMap.has(item.guruId)) {
      groupedMap.set(item.guruId, {
        guru: item.guru,
        assignments: [],
        hariList: [],
        keterangan: item.keterangan,
      })
    }
    const entry = groupedMap.get(item.guruId)!
    entry.assignments.push({
      id: item.id,
      hari: item.hari,
      keterangan: item.keterangan,
    })
    entry.hariList.push(item.hari)
  }

  return Array.from(groupedMap.values())
}

export async function getAvailableGurus() {
  const admin = await getLoggedInAdminJenjang()
  if (!admin.jenjangId) return []

  return prisma.guru.findMany({
    where: {
      jenjangs: { some: { id: admin.jenjangId } },
    },
    select: {
      id: true,
      nama: true,
      nip: true,
      fotoWajah: true,
    },
    orderBy: { nama: "asc" },
  })
}

export async function saveGuruPiketAssignment(data: {
  guruId: number
  hariList: Hari[]
  keterangan?: string
}) {
  try {
    const admin = await getLoggedInAdminJenjang()
    if (!admin.jenjangId) throw new Error("Akses ditolak")

    const activeTA = await getSelectedTahunAjaran()
    if (!activeTA) throw new Error("Tahun ajaran aktif belum dipilih")

    if (!data.guruId) throw new Error("Guru wajib dipilih")
    if (!data.hariList || data.hariList.length === 0) {
      throw new Error("Pilih minimal satu hari piket")
    }

    // Gunakan transaction: hapus assignment lama guru ini di TA aktif, lalu insert yang baru
    await prisma.$transaction(async (tx) => {
      await tx.guruPiket.deleteMany({
        where: {
          guruId: data.guruId,
          tahunAjaranId: activeTA.id,
        },
      })

      const newEntries = data.hariList.map((hari) => ({
        guruId: data.guruId,
        jenjangId: admin.jenjangId!,
        tahunAjaranId: activeTA.id,
        hari,
        keterangan: data.keterangan?.trim() || null,
      }))

      await tx.guruPiket.createMany({
        data: newEntries,
      })
    })

    revalidatePath("/admin/guru-piket")
    revalidatePath("/guru")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menyimpan penugasan guru piket" }
  }
}

export async function removeGuruPiketAssignment(guruId: number) {
  try {
    const admin = await getLoggedInAdminJenjang()
    if (!admin.jenjangId) throw new Error("Akses ditolak")

    const activeTA = await getSelectedTahunAjaran()
    if (!activeTA) throw new Error("Tahun ajaran aktif belum dipilih")

    await prisma.guruPiket.deleteMany({
      where: {
        guruId,
        tahunAjaranId: activeTA.id,
      },
    })

    revalidatePath("/admin/guru-piket")
    revalidatePath("/guru")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menghapus penugasan guru piket" }
  }
}
