"use server"

import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { Hari, KategoriKaldik, SistemHariSekolah } from "@prisma/client"
import { serializeHariLiburRutin, normalizeDate } from "@/lib/kaldik-utils"

export async function updateSistemHariSekolah({
  tahunAjaranId,
  sistemHariSekolah,
  hariLiburRutin,
}: {
  tahunAjaranId: number
  sistemHariSekolah: SistemHariSekolah
  hariLiburRutin: Hari[]
}) {
  try {
    const session = await getSession()
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_JENJANG")) {
      return { success: false, message: "Tidak memiliki hak akses." }
    }

    const serializedDays = serializeHariLiburRutin(hariLiburRutin)

    await prisma.kaldikPengaturan.upsert({
      where: { tahunAjaranId },
      update: {
        sistemHariSekolah,
        hariLiburRutin: serializedDays,
      },
      create: {
        tahunAjaranId,
        sistemHariSekolah,
        hariLiburRutin: serializedDays,
      },
    })

    revalidatePath("/admin/kalender-pendidikan")
    revalidatePath("/admin/rekap-kehadiran")

    return {
      success: true,
      message: "Sistem hari sekolah dan libur rutin berhasil diperbarui.",
    }
  } catch (error: any) {
    console.error("Error updateSistemHariSekolah:", error)
    return {
      success: false,
      message: error.message || "Gagal memperbarui sistem hari sekolah.",
    }
  }
}

export async function upsertKaldikAgenda(formData: FormData) {
  try {
    const session = await getSession()
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_JENJANG")) {
      return { success: false, message: "Tidak memiliki hak akses." }
    }

    const idStr = formData.get("id") as string
    const id = idStr ? parseInt(idStr) : undefined
    const tahunAjaranId = parseInt(formData.get("tahunAjaranId") as string)
    const semesterIdStr = formData.get("semesterId") as string
    const semesterId = semesterIdStr ? parseInt(semesterIdStr) : null

    const kategori = formData.get("kategori") as KategoriKaldik
    const nama = (formData.get("nama") as string)?.trim()
    const kodeSingkatan = ((formData.get("kodeSingkatan") as string) || "").trim()
    const tanggalMulaiStr = formData.get("tanggalMulai") as string
    const tanggalAkhirStr = formData.get("tanggalAkhir") as string || tanggalMulaiStr
    const warnaHex = (formData.get("warnaHex") as string) || "#3b82f6"
    const allowAbsensiRfid = formData.get("allowAbsensiRfid") === "true" || formData.get("allowAbsensiRfid") === "on"
    const keterangan = (formData.get("keterangan") as string) || ""

    if (!tahunAjaranId || !kategori || !nama || !tanggalMulaiStr) {
      return { success: false, message: "Data agenda tidak lengkap." }
    }

    const { dateObj: tanggalMulai } = normalizeDate(tanggalMulaiStr)
    const { dateObj: tanggalAkhir } = normalizeDate(tanggalAkhirStr)

    if (tanggalAkhir < tanggalMulai) {
      return { success: false, message: "Tanggal akhir tidak boleh mendahului tanggal mulai." }
    }

    if (id) {
      await prisma.kaldikAgenda.update({
        where: { id },
        data: {
          semesterId,
          kategori,
          nama,
          kodeSingkatan: kodeSingkatan || null,
          tanggalMulai,
          tanggalAkhir,
          warnaHex,
          allowAbsensiRfid,
          keterangan,
        },
      })
    } else {
      await prisma.kaldikAgenda.create({
        data: {
          tahunAjaranId,
          semesterId,
          kategori,
          nama,
          kodeSingkatan: kodeSingkatan || null,
          tanggalMulai,
          tanggalAkhir,
          warnaHex,
          allowAbsensiRfid,
          keterangan,
        },
      })
    }

    revalidatePath("/admin/kalender-pendidikan")
    revalidatePath("/admin/rekap-kehadiran")

    return {
      success: true,
      message: `Agenda "${nama}" berhasil ${id ? "diperbarui" : "ditambahkan"}.`,
    }
  } catch (error: any) {
    console.error("Error upsertKaldikAgenda:", error)
    return {
      success: false,
      message: error.message || "Gagal menyimpan agenda Kaldik.",
    }
  }
}

export async function deleteKaldikAgenda(id: number) {
  try {
    const session = await getSession()
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_JENJANG")) {
      return { success: false, message: "Tidak memiliki hak akses." }
    }

    const item = await prisma.kaldikAgenda.delete({
      where: { id },
    })

    revalidatePath("/admin/kalender-pendidikan")
    revalidatePath("/admin/rekap-kehadiran")

    return {
      success: true,
      message: `Agenda "${item.nama}" berhasil dihapus.`,
    }
  } catch (error: any) {
    console.error("Error deleteKaldikAgenda:", error)
    return {
      success: false,
      message: error.message || "Gagal menghapus agenda Kaldik.",
    }
  }
}

export async function applyTemplateKaldikKemenag(tahunAjaranId: number, semesterNama: "GANJIL" | "GENAP") {
  try {
    const session = await getSession()
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_JENJANG")) {
      return { success: false, message: "Tidak memiliki hak akses." }
    }

    const ta = await prisma.tahunAjaran.findUnique({
      where: { id: tahunAjaranId },
      include: { semester: true },
    })

    if (!ta) {
      return { success: false, message: "Tahun ajaran tidak ditemukan." }
    }

    const semester = ta.semester.find((s) => s.nama === semesterNama)
    const semesterId = semester?.id || null

    const years = ta.nama.match(/\d{4}/g)
    const startYear = years && years[0] ? parseInt(years[0]) : new Date().getFullYear()
    const endYear = years && years[1] ? parseInt(years[1]) : startYear + 1

    interface TemplateAgenda {
      kategori: KategoriKaldik
      nama: string
      kodeSingkatan: string
      mulai: string // YYYY-MM-DD
      akhir: string // YYYY-MM-DD
      warnaHex: string
      allowAbsensiRfid: boolean
      keterangan: string
    }

    let templates: TemplateAgenda[] = []

    if (semesterNama === "GANJIL") {
      templates = [
        {
          kategori: "NON_EFEKTIF",
          nama: "Matsama (Masa Ta'aruf Siswa Madrasah)",
          kodeSingkatan: "MATSAMA",
          mulai: `${startYear}-07-15`,
          akhir: `${startYear}-07-17`,
          warnaHex: "#7c3aed",
          allowAbsensiRfid: true,
          keterangan: "Pengenalan lingkungan madrasah dan pondok santri baru",
        },
        {
          kategori: "LIBUR_NASIONAL",
          nama: "Hari Kemerdekaan RI (HUT RI)",
          kodeSingkatan: "HUT-RI",
          mulai: `${startYear}-08-17`,
          akhir: `${startYear}-08-17`,
          warnaHex: "#dc2626",
          allowAbsensiRfid: false,
          keterangan: "Upacara Peringatan Kemerdekaan Republik Indonesia",
        },
        {
          kategori: "NON_EFEKTIF",
          nama: "Asesmen Sumatif Tengah Semester (ASTS) Ganjil",
          kodeSingkatan: "ASTS-1",
          mulai: `${startYear}-09-21`,
          akhir: `${startYear}-09-26`,
          warnaHex: "#4f46e5",
          allowAbsensiRfid: true,
          keterangan: "Pelaksanaan evaluasi tengah semester ganjil",
        },
        {
          kategori: "HEF",
          nama: "Peringatan Hari Santri Nasional",
          kodeSingkatan: "HSN",
          mulai: `${startYear}-10-22`,
          akhir: `${startYear}-10-22`,
          warnaHex: "#059669",
          allowAbsensiRfid: true,
          keterangan: "Apel Akbar & Kegiatan Keagamaan Hari Santri Nasional",
        },
        {
          kategori: "NON_EFEKTIF",
          nama: "Asesmen Sumatif Akhir Semester (ASAS) Ganjil",
          kodeSingkatan: "ASAS",
          mulai: `${startYear}-11-30`,
          akhir: `${startYear}-12-10`,
          warnaHex: "#4f46e5",
          allowAbsensiRfid: true,
          keterangan: "Asesmen akhir semester ganjil madrasah",
        },
        {
          kategori: "NON_EFEKTIF",
          nama: "Titimangsa & Pembagian Rapor Semester Ganjil",
          kodeSingkatan: "RAPOR-1",
          mulai: `${startYear}-12-19`,
          akhir: `${startYear}-12-19`,
          warnaHex: "#7c3aed",
          allowAbsensiRfid: true,
          keterangan: "Penyerahan Buku Laporan Hasil Belajar (LHB) kepada Wali Santri",
        },
        {
          kategori: "LIBUR_SEMESTER",
          nama: "Libur Pembelajaran Akhir Semester Ganjil",
          kodeSingkatan: "LS-1",
          mulai: `${startYear}-12-21`,
          akhir: `${startYear}-12-31`,
          warnaHex: "#d97706",
          allowAbsensiRfid: true,
          keterangan: "Libur akhir semester ganjil untuk santri dan dewan asatidz",
        },
      ]
    } else {
      templates = [
        {
          kategori: "HEF",
          nama: "Hari Amal Bhakti (HAB) Kemenag RI",
          kodeSingkatan: "HAB",
          mulai: `${endYear}-01-03`,
          akhir: `${endYear}-01-03`,
          warnaHex: "#059669",
          allowAbsensiRfid: true,
          keterangan: "Peringatan Hari Amal Bhakti Kementerian Agama",
        },
        {
          kategori: "NON_EFEKTIF",
          nama: "Asesmen Sumatif Tengah Semester (ASTS) Genap",
          kodeSingkatan: "ASTS-2",
          mulai: `${endYear}-03-02`,
          akhir: `${endYear}-03-07`,
          warnaHex: "#4f46e5",
          allowAbsensiRfid: true,
          keterangan: "Pelaksanaan evaluasi tengah semester genap",
        },
        {
          kategori: "HEF",
          nama: "Pondok Ramadhan & Amaliah Keagamaan",
          kodeSingkatan: "PONDOK-RAM",
          mulai: `${endYear}-03-16`,
          akhir: `${endYear}-03-21`,
          warnaHex: "#059669",
          allowAbsensiRfid: true,
          keterangan: "Kegiatan pendalaman keagamaan santri di bulan suci Ramadhan",
        },
        {
          kategori: "LIBUR_RAMADHAN",
          nama: "Libur Hari Raya Idulfitri",
          kodeSingkatan: "LBR",
          mulai: `${endYear}-03-23`,
          akhir: `${endYear}-04-04`,
          warnaHex: "#ea580c",
          allowAbsensiRfid: false,
          keterangan: "Cuti bersama dan libur perayaan Idulfitri",
        },
        {
          kategori: "NON_EFEKTIF",
          nama: "Asesmen Madrasah (AM) Tingkat Akhir",
          kodeSingkatan: "AM",
          mulai: `${endYear}-04-20`,
          akhir: `${endYear}-04-28`,
          warnaHex: "#4f46e5",
          allowAbsensiRfid: true,
          keterangan: "Ujian kelulusan madrasah santri kelas akhir",
        },
        {
          kategori: "NON_EFEKTIF",
          nama: "Asesmen Sumatif Akhir Tahun (ASAT)",
          kodeSingkatan: "ASAT",
          mulai: `${endYear}-06-01`,
          akhir: `${endYear}-06-11`,
          warnaHex: "#4f46e5",
          allowAbsensiRfid: true,
          keterangan: "Penilaian akhir tahun untuk kenaikan kelas",
        },
        {
          kategori: "NON_EFEKTIF",
          nama: "Titimangsa & Pembagian Rapor Semester Genap",
          kodeSingkatan: "RAPOR-2",
          mulai: `${endYear}-06-20`,
          akhir: `${endYear}-06-20`,
          warnaHex: "#7c3aed",
          allowAbsensiRfid: true,
          keterangan: "Penyerahan Laporan Hasil Belajar kenaikan kelas",
        },
        {
          kategori: "LIBUR_SEMESTER",
          nama: "Libur Akhir Tahun Ajaran / Kenaikan Kelas",
          kodeSingkatan: "LS-2",
          mulai: `${endYear}-06-22`,
          akhir: `${endYear}-07-11`,
          warnaHex: "#d97706",
          allowAbsensiRfid: true,
          keterangan: "Libur kenaikan kelas dan persiapan tahun ajaran baru",
        },
      ]
    }

    let insertedCount = 0
    for (const t of templates) {
      const { dateObj: tanggalMulai } = normalizeDate(t.mulai)
      const { dateObj: tanggalAkhir } = normalizeDate(t.akhir)

      // Cek apakah agenda yang sama persis sudah ada
      const exists = await prisma.kaldikAgenda.findFirst({
        where: {
          tahunAjaranId,
          nama: t.nama,
          tanggalMulai,
        },
      })

      if (!exists) {
        await prisma.kaldikAgenda.create({
          data: {
            tahunAjaranId,
            semesterId,
            kategori: t.kategori,
            nama: t.nama,
            kodeSingkatan: t.kodeSingkatan,
            tanggalMulai,
            tanggalAkhir,
            warnaHex: t.warnaHex,
            allowAbsensiRfid: t.allowAbsensiRfid,
            keterangan: t.keterangan,
          },
        })
        insertedCount++
      }
    }

    revalidatePath("/admin/kalender-pendidikan")
    revalidatePath("/admin/rekap-kehadiran")

    return {
      success: true,
      message: `Berhasil menambahkan ${insertedCount} agenda template Kemenag untuk Semester ${semesterNama}.`,
    }
  } catch (error: any) {
    console.error("Error applyTemplateKaldikKemenag:", error)
    return {
      success: false,
      message: error.message || "Gagal menerapkan template Kemenag.",
    }
  }
}
