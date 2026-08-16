import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { type, id } = body

    if (!type || !id) {
      return NextResponse.json({ success: false, message: "Data QR tidak lengkap" }, { status: 400 })
    }

    const todayStr = new Date().toISOString().split("T")[0]
    const today = new Date(todayStr)
    const scanTimeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

    // Cari semester aktif (digunakan untuk catatan absensi)
    const activeSemester = await prisma.semester.findFirst({
      where: { isActive: true }
    })

    if (type === "GURU") {
      const guru = await prisma.guru.findUnique({
        where: { id: parseInt(id) }
      })

      if (!guru) {
        return NextResponse.json({ success: false, message: "Data Guru tidak ditemukan" }, { status: 404 })
      }

      // Cek apakah sudah absen hari ini
      const existing = await prisma.kehadiranGuru.findUnique({
        where: { guruId_tanggal: { guruId: guru.id, tanggal: today } }
      })

      if (existing) {
        return NextResponse.json({ success: false, message: "Anda sudah melakukan absensi hari ini", nama: guru.nama, fotoWajah: guru.fotoWajah, isDuplicate: true }, { status: 400 })
      }

      // Catat kehadiran
      await prisma.kehadiranGuru.create({
        data: {
          guruId: guru.id,
          tanggal: today,
          status: "HADIR",
          semesterId: activeSemester?.id || null,
          keterangan: `Hadir via QR Code — ${scanTimeStr} WIB`
        }
      })

      return NextResponse.json({ 
        success: true, 
        nama: guru.nama, 
        kelas: "-",
        jenjang: "GURU",
        fotoWajah: guru.fotoWajah,
        message: "Absensi Berhasil Disimpan" 
      })

    } else if (type === "SANTRI") {
      const santri = await prisma.santri.findUnique({
        where: { id: parseInt(id) },
        include: {
          riwayatKelas: {
            orderBy: { id: 'desc' },
            take: 1,
            include: { kelasFormal: { include: { jenjang: true } } }
          }
        }
      })

      if (!santri) {
        return NextResponse.json({ success: false, message: "Data Santri tidak ditemukan" }, { status: 404 })
      }

      const activeKelas = santri.riwayatKelas[0]?.kelasFormal
      if (!activeKelas) {
        return NextResponse.json({ success: false, message: "Santri tidak terdaftar di kelas mana pun" }, { status: 400 })
      }

      // Cek apakah sudah absen hari ini
      const existing = await prisma.kehadiranHarianSantri.findUnique({
        where: { santriId_tanggal: { santriId: santri.id, tanggal: today } }
      })

      if (existing) {
        return NextResponse.json({ success: false, message: "Anda sudah melakukan absensi hari ini", nama: santri.namaLengkap, fotoWajah: santri.fotoWajah, isDuplicate: true }, { status: 400 })
      }

      // Catat kehadiran
      await prisma.kehadiranHarianSantri.create({
        data: {
          santriId: santri.id,
          kelasFormalId: activeKelas.id,
          tanggal: today,
          status: "HADIR",
          semesterId: activeSemester?.id || null,
          keterangan: `Hadir via QR Code — ${scanTimeStr} WIB`
        }
      })

      return NextResponse.json({ 
        success: true, 
        nama: santri.namaLengkap,
        kelas: activeKelas.namaKelas,
        jenjang: activeKelas.jenjang.nama,
        fotoWajah: santri.fotoWajah,
        message: "Absensi Berhasil Disimpan" 
      })
    }

    return NextResponse.json({ success: false, message: "Tipe QR tidak valid" }, { status: 400 })

  } catch (error: any) {
    console.error("QR Absen Error:", error)
    return NextResponse.json({ success: false, message: error.message || "Terjadi kesalahan internal" }, { status: 500 })
  }
}
