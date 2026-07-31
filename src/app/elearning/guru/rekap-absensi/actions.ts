"use server"

import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export async function getRekapAbsensiWaliKelas() {
  const session = await getSession()
  if (!session || session.role !== "GURU") {
    throw new Error("Unauthorized")
  }

  const { getSelectedSemester } = await import("@/lib/ta-context")
  const selectedSem = await getSelectedSemester()
  
  let activeTA = selectedSem?.tahunAjaran
  let activeSemester = selectedSem

  if (!activeTA) {
    activeTA = await prisma.tahunAjaran.findFirst({
      where: { isActive: true },
      include: { semester: true }
    })
    if (activeTA) {
      activeSemester = activeTA.semester.find((s: any) => s.isActive) || activeTA.semester[0]
    }
  }
  
  if (!activeTA) throw new Error("Tidak ada Tahun Ajaran aktif")

  // Cari kelas yang diwalikan
  const kelas = await prisma.kelasFormal.findFirst({
    where: {
      waliKelasId: session.id,
      tahunAjaranId: activeTA.id
    },
    include: {
      anggota: {
        include: {
          santri: true
        }
      }
    }
  })

  if (!kelas) {
    throw new Error("Anda bukan wali kelas pada Tahun Ajaran saat ini.")
  }

  // Ambil rekap absensi untuk setiap anggota kelas pada semester aktif
  const santriIds = kelas.anggota.map(a => a.santri.id)

  const absensiData = await prisma.kehadiranHarianSantri.findMany({
    where: {
      santriId: { in: santriIds },
      kelasFormalId: kelas.id,
      semesterId: activeSemester?.id
    }
  })

  // Format data: group by santri
  const rekap = kelas.anggota.map(anggota => {
    const santriAbsen = absensiData.filter(a => a.santriId === anggota.santriId)
    
    // Group by Date for the detailed view
    const detailHarian = santriAbsen.map(a => ({
      tanggal: a.tanggal.toISOString(),
      status: a.status,
      keterangan: a.keterangan
    })).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())

    const hadir = santriAbsen.filter(a => a.status === "HADIR").length
    const sakit = santriAbsen.filter(a => a.status === "SAKIT").length
    const izin = santriAbsen.filter(a => a.status === "IZIN").length
    const alpa = santriAbsen.filter(a => a.status === "ALPA").length
    const total = santriAbsen.length
    
    return {
      santri: anggota.santri,
      rekap: { hadir, sakit, izin, alpa, total },
      detailHarian
    }
  })

  return { 
    kelas: { id: kelas.id, namaKelas: kelas.namaKelas }, 
    semester: activeSemester?.nama,
    rekap 
  }
}
