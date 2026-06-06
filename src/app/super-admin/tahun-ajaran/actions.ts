"use server"

import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export async function createTahunAjaran(formData: FormData) {
  try {
    const session = await getSession()
    if (!session || session.role !== "SUPER_ADMIN") throw new Error("Unauthorized")

    const nama = formData.get("nama") as string
    if (!nama) throw new Error("Nama Tahun Ajaran diperlukan")
      
    // Validate format YYYY/YYYY roughly
    if (!/^\d{4}\/\d{4}$/.test(nama)) {
      throw new Error("Format harus YYYY/YYYY, contoh: 2024/2025")
    }

    const newTa = await prisma.tahunAjaran.create({
      data: {
        nama,
        isActive: false, // Default false
        semester: {
          create: [
            { nama: "GANJIL", isActive: false },
            { nama: "GENAP", isActive: false },
          ]
        }
      }
    })

    // Cari TA sebelumnya berdasarkan format nama YYYY/YYYY
    const parts = nama.split("/")
    const prevNama = `${parseInt(parts[0]) - 1}/${parseInt(parts[1]) - 1}`
    let prevTa = await prisma.tahunAjaran.findUnique({ where: { nama: prevNama } })

    // Jika tidak ketemu berdasarkan nama, gunakan TA yang sedang aktif sebagai referensi
    if (!prevTa) {
      prevTa = await prisma.tahunAjaran.findFirst({ where: { isActive: true } })
    }

    if (prevTa) {
      // Ambil semua kelas formal di TA referensi
      const oldClasses = await prisma.kelasFormal.findMany({
        where: { tahunAjaranId: prevTa.id }
      })

      if (oldClasses.length > 0) {
        const newClasses = oldClasses.map(c => ({
          namaKelas: c.namaKelas,
          waliKelasId: c.waliKelasId,
          jenjangId: c.jenjangId,
          tahunAjaranId: newTa.id,
        }))

        // Salin ke TA yang baru dibuat
        await prisma.kelasFormal.createMany({
          data: newClasses
        })
      }
    }

    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan" }
  }
}

export async function deleteTahunAjaran(id: number) {
  try {
    const session = await getSession()
    if (!session || session.role !== "SUPER_ADMIN") throw new Error("Unauthorized")

    // Cek apakah TA sedang aktif
    const ta = await prisma.tahunAjaran.findUnique({ 
      where: { id },
      include: {
        kelasFormal: {
          include: { anggota: true }
        }
      }
    })

    if (!ta) throw new Error("Tahun ajaran tidak ditemukan")

    if (ta.isActive) {
      throw new Error("Tidak dapat menghapus Tahun Ajaran yang sedang aktif!")
    }

    // Cek apakah sudah ada anggota kelas di TA ini
    const hasSiswa = ta.kelasFormal.some(k => k.anggota.length > 0)
    if (hasSiswa) {
      throw new Error("Tidak dapat menghapus Tahun Ajaran karena sudah ada data siswa di dalamnya!")
    }

    // Hapus menggunakan transaction
    await prisma.$transaction([
      prisma.semester.deleteMany({ where: { tahunAjaranId: id } }),
      prisma.kelasFormal.deleteMany({ where: { tahunAjaranId: id } }),
      prisma.tahunAjaran.delete({ where: { id } })
    ])

    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan" }
  }
}

export async function setTahunAjaranAktif(id: number) {
  try {
    const session = await getSession()
    if (!session || session.role !== "SUPER_ADMIN") throw new Error("Unauthorized")

    await prisma.$transaction([
      // Matikan semua TA
      prisma.tahunAjaran.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      }),
      // Hidupkan TA yang dipilih
      prisma.tahunAjaran.update({
        where: { id },
        data: { isActive: true }
      })
    ])

    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan" }
  }
}

export async function setSemesterAktif(semesterId: number) {
  try {
    const session = await getSession()
    if (!session || session.role !== "SUPER_ADMIN") throw new Error("Unauthorized")

    await prisma.$transaction([
      // Matikan semua semester
      prisma.semester.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      }),
      // Hidupkan semester yang dipilih
      prisma.semester.update({
        where: { id: semesterId },
        data: { isActive: true }
      })
    ])

    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan" }
  }
}
