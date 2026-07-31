"use server"

import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

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
      prevTa = await prisma.tahunAjaran.findFirst({ orderBy: { nama: 'desc' } })
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

    revalidatePath("/super-admin/tahun-ajaran")
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

    // Kita tidak perlu lagi mengecek isActive, cukup pastikan tidak ada data siswa.


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

    revalidatePath("/super-admin/tahun-ajaran")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan" }
  }
}

export async function snapshotNilaiSemester(semesterId: number) {
  try {
    const session = await getSession()
    if (!session || session.role !== "SUPER_ADMIN") throw new Error("Unauthorized")

    // Get all PenilaianAkhir for this semester's pengampu
    const penilaians = await (prisma as any).penilaianAkhir.findMany({
      where: {
        pengampu: {
          kelasFormal: {
            tahunAjaran: {
              semester: {
                some: { id: semesterId }
              }
            }
          }
        }
      }
    })

    if (penilaians.length === 0) {
       return { success: true, message: "Tidak ada data nilai untuk semester ini" }
    }

    const dataToInsert = penilaians.map((p: any) => ({
      santriId: p.santriId,
      semesterId: semesterId,
      pengampuId: p.pengampuId,
      nilaiAkhir: p.nilaiAkhir,
      grade: p.grade,
      isFinalized: true
    }))

    await prisma.$transaction(
      dataToInsert.map((d: any) => (prisma as any).laporanSemester.upsert({
        where: { santriId_pengampuId_semesterId: { santriId: d.santriId, pengampuId: d.pengampuId, semesterId: d.semesterId } },
        update: { nilaiAkhir: d.nilaiAkhir, grade: d.grade, isFinalized: true },
        create: d
      }))
    )

    return { success: true, message: `Berhasil mengambil snapshot ${dataToInsert.length} data nilai.` }
  } catch (error: any) {
    return { error: error.message || "Gagal melakukan snapshot nilai" }
  }
}
