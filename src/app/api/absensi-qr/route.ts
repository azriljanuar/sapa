import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// Helper to check if current time is within range
function isTimeWithinRange(start?: string | null, end?: string | null): boolean {
  if (!start || !end) return true; // No limit configured

  const now = new Date();
  
  // Create Date objects for today with the specified times
  const [startHour, startMin] = start.split(":").map(Number);
  const startTime = new Date(now);
  startTime.setHours(startHour, startMin, 0, 0);

  const [endHour, endMin] = end.split(":").map(Number);
  const endTime = new Date(now);
  endTime.setHours(endHour, endMin, 0, 0);

  return now >= startTime && now <= endTime;
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { type, id } = body

    if (!type || !id) {
      return NextResponse.json({ success: false, message: "Data QR tidak lengkap" }, { status: 400 })
    }

    const todayStr = new Date().toISOString().split("T")[0]
    const today = new Date(todayStr)

    // Cari semester aktif (digunakan untuk catatan absensi)
    const activeSemester = await prisma.semester.findFirst({
      where: { isActive: true }
    })

    if (type === "GURU") {
      const guru = await prisma.guru.findUnique({
        where: { id: parseInt(id) },
        include: { jenjangs: true }
      })

      if (!guru) {
        return NextResponse.json({ success: false, message: "Data Guru tidak ditemukan" }, { status: 404 })
      }

      // Cek validasi jam absensi jika dikonfigurasi di salah satu jenjang
      let isAllowedByTime = false;
      let configuredJenjangCount = 0;
      
      for (const jenjang of guru.jenjangs) {
        if (jenjang.waktuMulaiAbsen && jenjang.waktuAkhirAbsen) {
          configuredJenjangCount++;
          if (isTimeWithinRange(jenjang.waktuMulaiAbsen, jenjang.waktuAkhirAbsen)) {
            isAllowedByTime = true;
            break;
          }
        }
      }

      // Jika ada jenjang yang mengatur waktu, tapi tidak ada satupun yang match waktu saat ini
      if (configuredJenjangCount > 0 && !isAllowedByTime) {
        return NextResponse.json({ success: false, message: "Di luar batas waktu absensi yang ditentukan" }, { status: 400 })
      }

      // Cek apakah sudah absen hari ini
      const existing = await prisma.kehadiranGuru.findUnique({
        where: { guruId_tanggal: { guruId: guru.id, tanggal: today } }
      })

      if (existing) {
        return NextResponse.json({ success: false, message: "Anda sudah melakukan absensi hari ini" }, { status: 400 })
      }

      // Catat kehadiran
      await prisma.kehadiranGuru.create({
        data: {
          guruId: guru.id,
          tanggal: today,
          status: "HADIR",
          semesterId: activeSemester?.id || null,
          keterangan: "Hadir via QR Code"
        }
      })

      return NextResponse.json({ 
        success: true, 
        nama: guru.nama, 
        message: "Absensi Berhasil Disimpan" 
      })

    } else if (type === "SANTRI") {
      const santri = await prisma.santri.findUnique({
        where: { id: parseInt(id) },
        include: {
          jenjangs: { include: { jenjang: true } },
          riwayatKelas: {
            where: { kelasFormal: { tahunAjaran: { isActive: true } } },
            include: { kelasFormal: true }
          }
        }
      })

      if (!santri) {
        return NextResponse.json({ success: false, message: "Data Santri tidak ditemukan" }, { status: 404 })
      }

      const activeKelas = santri.riwayatKelas[0]?.kelasFormal
      if (!activeKelas) {
        return NextResponse.json({ success: false, message: "Santri tidak terdaftar di kelas aktif mana pun" }, { status: 400 })
      }

      // Cek validasi jam absensi
      const jenjang = santri.jenjangs[0]?.jenjang
      if (jenjang && jenjang.waktuMulaiAbsen && jenjang.waktuAkhirAbsen) {
        if (!isTimeWithinRange(jenjang.waktuMulaiAbsen, jenjang.waktuAkhirAbsen)) {
          return NextResponse.json({ success: false, message: `Di luar batas waktu absensi (${jenjang.waktuMulaiAbsen} - ${jenjang.waktuAkhirAbsen})` }, { status: 400 })
        }
      }

      // Cek apakah sudah absen hari ini
      const existing = await prisma.kehadiranHarianSantri.findUnique({
        where: { santriId_tanggal: { santriId: santri.id, tanggal: today } }
      })

      if (existing) {
        return NextResponse.json({ success: false, message: "Anda sudah melakukan absensi hari ini" }, { status: 400 })
      }

      // Catat kehadiran
      await prisma.kehadiranHarianSantri.create({
        data: {
          santriId: santri.id,
          kelasFormalId: activeKelas.id,
          tanggal: today,
          status: "HADIR",
          semesterId: activeSemester?.id || null,
          keterangan: "Hadir via QR Code"
        }
      })

      return NextResponse.json({ 
        success: true, 
        nama: santri.namaLengkap, 
        message: "Absensi Berhasil Disimpan" 
      })
    }

    return NextResponse.json({ success: false, message: "Tipe QR tidak valid" }, { status: 400 })

  } catch (error: any) {
    console.error("QR Absen Error:", error)
    return NextResponse.json({ success: false, message: error.message || "Terjadi kesalahan internal" }, { status: 500 })
  }
}
