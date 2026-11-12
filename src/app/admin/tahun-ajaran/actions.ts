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

    const copyStructure = formData.get("copyStructure") !== "false"
    const copyFromTaIdRaw = formData.get("copyFromTaId") as string
    let sourceTaId = copyFromTaIdRaw ? parseInt(copyFromTaIdRaw) : null

    if (copyStructure) {
      if (!sourceTaId) {
        // Cari TA referensi terbaik sebelum newTa (utamakan yang memiliki kelas formal)
        const bestWithClasses = await prisma.tahunAjaran.findFirst({
          where: {
            id: { not: newTa.id },
            kelasFormal: { some: {} }
          },
          orderBy: { nama: 'desc' }
        })

        const bestAny = await prisma.tahunAjaran.findFirst({
          where: { id: { not: newTa.id } },
          orderBy: { nama: 'desc' }
        })

        sourceTaId = bestWithClasses?.id || bestAny?.id || null
      }

      if (sourceTaId) {
        await copyAcademicStructure(sourceTaId, newTa.id, {
          copyClasses: true,
          copyPengampu: true,
          copyJadwal: true
        })
      }
    }

    revalidatePath("/admin/tahun-ajaran")
    revalidatePath("/admin/kelas-formal")
    revalidatePath("/admin/mata-pelajaran")
    revalidatePath("/admin/jadwal-pelajaran")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan" }
  }
}

function isMatchingClass(nameA: string, nameB: string): boolean {
  const normA = nameA.toLowerCase().trim()
  const normB = nameB.toLowerCase().trim()
  if (normA === normB) return true

  const getGrade = (s: string) => {
    if (s.includes("12") || s.includes("xii")) return "12"
    if (s.includes("11") || s.includes("xi")) return "11"
    if (s.includes("10") || s.includes(" x")) return "10"
    return null
  }

  const getStream = (s: string) => {
    if (s.includes("mia") || s.includes("f-1")) return "mia"
    if (s.includes("iis") || s.includes("f-2")) return "iis"
    if (s.includes("iik") || s.includes("f-3")) return "iik"
    if (s.includes("x-a") || s.includes(" 10 a") || s.includes("x a")) return "xa"
    if (s.includes("x-b") || s.includes(" 10 b") || s.includes("x b")) return "xb"
    if (s.includes("x-c") || s.includes(" 10 c") || s.includes("x c")) return "xc"
    return null
  }

  const gradeA = getGrade(normA)
  const gradeB = getGrade(normB)
  const streamA = getStream(normA)
  const streamB = getStream(normB)

  if (gradeA && gradeB && gradeA === gradeB && streamA && streamB && streamA === streamB) {
    return true
  }

  return false
}

/**
 * Salin struktur akademik (Kelas, Wali Kelas, Pengampu Mapel, dan Jadwal Pelajaran)
 * dari sourceTahunAjaranId ke targetTahunAjaranId secara aman dan idempotent.
 */
export async function copyAcademicStructure(
  sourceTahunAjaranId: number,
  targetTahunAjaranId: number,
  options: {
    copyClasses?: boolean
    copyPengampu?: boolean
    copyJadwal?: boolean
  } = { copyClasses: true, copyPengampu: true, copyJadwal: true }
) {
  if (sourceTahunAjaranId === targetTahunAjaranId) {
    throw new Error("Tahun Ajaran sumber dan tujuan tidak boleh sama.")
  }

  // 1. Ambil TA target dan pastikan semester tersedia
  const targetTa = await prisma.tahunAjaran.findUnique({
    where: { id: targetTahunAjaranId },
    include: { semester: true }
  })
  if (!targetTa) throw new Error("Tahun Ajaran tujuan tidak ditemukan")

  let targetSemesters = targetTa.semester
  if (targetSemesters.length === 0) {
    await prisma.semester.createMany({
      data: [
        { nama: "GANJIL", tahunAjaranId: targetTahunAjaranId, isActive: false },
        { nama: "GENAP", tahunAjaranId: targetTahunAjaranId, isActive: false },
      ]
    })
    targetSemesters = await prisma.semester.findMany({
      where: { tahunAjaranId: targetTahunAjaranId }
    })
  }

  // 2. Ambil TA sumber dan petakan semesternya
  const sourceTa = await prisma.tahunAjaran.findUnique({
    where: { id: sourceTahunAjaranId },
    include: { semester: true }
  })
  if (!sourceTa) throw new Error("Tahun Ajaran sumber tidak ditemukan")

  const semesterMap = new Map<number, number>()
  for (const srcSem of sourceTa.semester) {
    const tgtSem = targetSemesters.find(ts => ts.nama === srcSem.nama)
    if (tgtSem) {
      semesterMap.set(srcSem.id, tgtSem.id)
    }
  }

  // 3. Salin/Sinkronkan KelasFormal & Wali Kelas
  const sourceClasses = await prisma.kelasFormal.findMany({
    where: { tahunAjaranId: sourceTahunAjaranId }
  })

  const targetClasses = await prisma.kelasFormal.findMany({
    where: { tahunAjaranId: targetTahunAjaranId }
  })

  const kelasMap = new Map<number, number>() // oldKelasId -> newKelasId
  let copiedKelasCount = 0

  for (const sc of sourceClasses) {
    // Cari exact match atau smart match di targetClasses
    let matchedTargetClass = targetClasses.find(tc => 
      tc.jenjangId === sc.jenjangId && isMatchingClass(sc.namaKelas, tc.namaKelas)
    )

    if (matchedTargetClass) {
      if (sc.waliKelasId && matchedTargetClass.waliKelasId !== sc.waliKelasId) {
        await prisma.kelasFormal.update({
          where: { id: matchedTargetClass.id },
          data: { waliKelasId: sc.waliKelasId }
        })
      }
      kelasMap.set(sc.id, matchedTargetClass.id)
    } else {
      const newClass = await prisma.kelasFormal.create({
        data: {
          namaKelas: sc.namaKelas,
          jenjangId: sc.jenjangId,
          waliKelasId: sc.waliKelasId,
          tahunAjaranId: targetTahunAjaranId
        }
      })
      kelasMap.set(sc.id, newClass.id)
      copiedKelasCount++
    }
  }

  // 4. Salin/Sinkronkan PengampuMataPelajaran (Tugas Guru & KKM per kelas)
  let copiedPengampuCount = 0
  const pengampuMap = new Map<number, number>() // oldPengampuId -> newPengampuId

  if (options.copyPengampu !== false) {
    const sourcePengampuList = await prisma.pengampuMataPelajaran.findMany({
      where: { tahunAjaranId: sourceTahunAjaranId }
    })

    for (const sp of sourcePengampuList) {
      const targetKelasId = kelasMap.get(sp.kelasFormalId)
      if (!targetKelasId) continue

      const targetPengampu = await prisma.pengampuMataPelajaran.upsert({
        where: {
          mataPelajaranId_kelasFormalId_tahunAjaranId: {
            mataPelajaranId: sp.mataPelajaranId,
            kelasFormalId: targetKelasId,
            tahunAjaranId: targetTahunAjaranId
          }
        },
        update: {
          guruId: sp.guruId,
          kkm: sp.kkm
        },
        create: {
          mataPelajaranId: sp.mataPelajaranId,
          kelasFormalId: targetKelasId,
          guruId: sp.guruId,
          tahunAjaranId: targetTahunAjaranId,
          kkm: sp.kkm
        }
      })

      pengampuMap.set(sp.id, targetPengampu.id)
      copiedPengampuCount++
    }
  }

  // 5. Salin/Sinkronkan JadwalPelajaran
  let copiedJadwalCount = 0
  if (options.copyJadwal !== false && options.copyPengampu !== false) {
    const sourceJadwalList = await prisma.jadwalPelajaran.findMany({
      where: {
        pengampu: {
          tahunAjaranId: sourceTahunAjaranId
        }
      }
    })

    for (const sj of sourceJadwalList) {
      const newPengampuId = pengampuMap.get(sj.pengampuId)
      const newSemesterId = semesterMap.get(sj.semesterId)
      if (!newPengampuId || !newSemesterId) continue

      const existingJadwal = await prisma.jadwalPelajaran.findFirst({
        where: {
          pengampuId: newPengampuId,
          semesterId: newSemesterId,
          hari: sj.hari,
          jamMulai: sj.jamMulai,
          jamSelesai: sj.jamSelesai
        }
      })

      if (!existingJadwal) {
        await prisma.jadwalPelajaran.create({
          data: {
            pengampuId: newPengampuId,
            semesterId: newSemesterId,
            hari: sj.hari,
            jamMulai: sj.jamMulai,
            jamSelesai: sj.jamSelesai
          }
        })
        copiedJadwalCount++
      }
    }
  }

  return {
    success: true,
    copiedKelasCount,
    copiedPengampuCount,
    copiedJadwalCount
  }
}

export async function copyAcademicStructureAction(
  sourceTaId: number,
  targetTaId: number
) {
  try {
    const session = await getSession()
    if (!session || session.role !== "SUPER_ADMIN") throw new Error("Unauthorized")

    const res = await copyAcademicStructure(sourceTaId, targetTaId, {
      copyClasses: true,
      copyPengampu: true,
      copyJadwal: true
    })

    revalidatePath("/admin/tahun-ajaran")
    revalidatePath("/admin/kelas-formal")
    revalidatePath("/admin/mata-pelajaran")
    revalidatePath("/admin/jadwal-pelajaran")

    return {
      success: true,
      message: `Berhasil menyalin struktur akademik (${res.copiedKelasCount} kelas, ${res.copiedPengampuCount} pengampu mapel, ${res.copiedJadwalCount} jadwal pelajaran).`
    }
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menyalin struktur akademik" }
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

    revalidatePath("/admin/tahun-ajaran")
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
