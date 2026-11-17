"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { getLoggedInAdminJenjang } from "@/lib/auth"
import { getSelectedTahunAjaran } from "@/lib/ta-context"
import { PeranStruktural } from "@prisma/client"

export async function getTugasTambahanData() {
  try {
    const admin = await getLoggedInAdminJenjang()
    if (!admin.jenjangId) return { success: false, error: "Akses ditolak", data: null }

    const activeTA = await getSelectedTahunAjaran()
    if (!activeTA) return { success: false, error: "Tahun ajaran belum dipilih", data: null }

    const [assignments, availableGurus] = await Promise.all([
      prisma.tugasTambahanGuru.findMany({
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
              statusPegawai: true,
              pendidikanTerakhir: true,
            },
          },
        },
        orderBy: { peran: "asc" },
      }),
      prisma.guru.findMany({
        where: {
          jenjangs: { some: { id: admin.jenjangId } },
        },
        select: {
          id: true,
          nama: true,
          nip: true,
          fotoWajah: true,
          email: true,
        },
        orderBy: { nama: "asc" },
      }),
    ])

    return {
      success: true,
      data: {
        activeTA: { id: activeTA.id, nama: activeTA.nama },
        assignments,
        availableGurus,
      },
    }
  } catch (error: any) {
    console.error("getTugasTambahanData error:", error)
    return { success: false, error: error.message || "Gagal memuat data penugasan", data: null }
  }
}

export async function saveTugasTambahan({
  peran,
  guruId,
  skNomor,
  keterangan,
}: {
  peran: PeranStruktural
  guruId: number
  skNomor?: string | null
  keterangan?: string | null
}) {
  try {
    const admin = await getLoggedInAdminJenjang()
    if (!admin.jenjangId) throw new Error("Akses ditolak")

    const activeTA = await getSelectedTahunAjaran()
    if (!activeTA) throw new Error("Tahun ajaran aktif belum dipilih")

    if (!guruId) throw new Error("Guru wajib dipilih")
    if (!peran) throw new Error("Peran struktural wajib ditentukan")

    // Pastikan peran struktural (Kepala Sekolah, Kurikulum, Kesiswaan) unik per jenjang & TA
    // Jika sudah ada pejabat lama untuk peran ini, ganti dengan yang baru
    await prisma.$transaction(async (tx) => {
      // Hapus penugasan peran ini di TA & jenjang yang sama jika sudah ada
      await tx.tugasTambahanGuru.deleteMany({
        where: {
          jenjangId: admin.jenjangId,
          tahunAjaranId: activeTA.id,
          peran: peran,
        },
      })

      // Buat penugasan baru
      await tx.tugasTambahanGuru.create({
        data: {
          jenjangId: admin.jenjangId,
          tahunAjaranId: activeTA.id,
          guruId: guruId,
          peran: peran,
          skNomor: skNomor?.trim() || null,
          keterangan: keterangan?.trim() || null,
        },
      })

      // Jika peran adalah KEPALA_SEKOLAH, sinkronisasikan otomatis ke profil jenjang
      if (peran === "KEPALA_SEKOLAH") {
        const guru = await tx.guru.findUnique({
          where: { id: guruId },
          select: { nama: true, nip: true },
        })
        if (guru) {
          await tx.jenjangPendidikan.update({
            where: { id: admin.jenjangId },
            data: {
              namaKepalaMadrasah: guru.nama,
              nipKepalaMadrasah: guru.nip,
            },
          })
        }
      }
    })

    revalidatePath("/admin/tugas-tambahan")
    revalidatePath("/admin/profil")
    revalidatePath("/guru")

    return { success: true, message: "Penugasan tugas tambahan guru berhasil disimpan." }
  } catch (error: any) {
    console.error("saveTugasTambahan error:", error)
    return { success: false, error: error.message || "Gagal menyimpan penugasan guru" }
  }
}

export async function removeTugasTambahan(id: number) {
  try {
    const admin = await getLoggedInAdminJenjang()
    if (!admin.jenjangId) throw new Error("Akses ditolak")

    const existing = await prisma.tugasTambahanGuru.findUnique({
      where: { id },
    })

    if (!existing || existing.jenjangId !== admin.jenjangId) {
      throw new Error("Data penugasan tidak ditemukan")
    }

    await prisma.tugasTambahanGuru.delete({
      where: { id },
    })

    revalidatePath("/admin/tugas-tambahan")
    revalidatePath("/guru")

    return { success: true, message: "Penugasan struktural berhasil dicabut." }
  } catch (error: any) {
    console.error("removeTugasTambahan error:", error)
    return { success: false, error: error.message || "Gagal mencabut penugasan guru" }
  }
}
