"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { getLoggedInAdminJenjang } from "@/lib/auth"
import { getSelectedTahunAjaran } from "@/lib/ta-context"
import { PeranStruktural } from "@prisma/client"
import { getGuruPiketList } from "@/app/admin/guru-piket/actions"

export async function getTugasTambahanData() {
  try {
    const admin = await getLoggedInAdminJenjang()
    if (!admin.jenjangId) return { success: false, error: "Akses ditolak", data: null }

    const activeTA = await getSelectedTahunAjaran()
    if (!activeTA) return { success: false, error: "Tahun ajaran belum dipilih", data: null }

    const [assignments, availableGurus, kelasList, piketList] = await Promise.all([
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
          noTelepon: true,
          statusPegawai: true,
          pendidikanTerakhir: true,
        },
        orderBy: { nama: "asc" },
      }),
      prisma.kelasFormal.findMany({
        where: {
          jenjangId: admin.jenjangId,
          tahunAjaranId: activeTA.id,
        },
        include: {
          waliKelas: {
            select: {
              id: true,
              nama: true,
              nip: true,
              fotoWajah: true,
              email: true,
              noTelepon: true,
            },
          },
          _count: {
            select: {
              anggota: true,
            },
          },
        },
        orderBy: { namaKelas: "asc" },
      }),
      getGuruPiketList(),
    ])

    return {
      success: true,
      data: {
        activeTA: { id: activeTA.id, nama: activeTA.nama },
        assignments,
        availableGurus,
        kelasList,
        piketList,
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

export async function assignWaliKelas({
  kelasId,
  waliKelasId,
}: {
  kelasId: number
  waliKelasId: number | null
}) {
  try {
    const admin = await getLoggedInAdminJenjang()
    if (!admin.jenjangId) throw new Error("Akses ditolak")

    const existingKelas = await prisma.kelasFormal.findUnique({
      where: { id: kelasId },
    })

    if (!existingKelas || existingKelas.jenjangId !== admin.jenjangId) {
      throw new Error("Kelas tidak ditemukan atau tidak berada di jenjang Anda")
    }

    await prisma.kelasFormal.update({
      where: { id: kelasId },
      data: {
        waliKelasId: waliKelasId ?? null,
      },
    })

    revalidatePath("/admin/tugas-tambahan")
    revalidatePath("/admin/kelas-formal")
    revalidatePath("/guru")
    revalidatePath("/guru/kurikulum/kelas-formal")
    revalidatePath("/guru/kesiswaan/kelas-formal")

    return { success: true, message: "Penugasan wali kelas berhasil diperbarui." }
  } catch (error: any) {
    console.error("assignWaliKelas error:", error)
    return { success: false, error: error.message || "Gagal memperbarui wali kelas" }
  }
}
