import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { isHariLibur } from "@/lib/holiday-utils"

// Helper waktu Indonesia (WIB = UTC+7)
function getWibDate(date = new Date()) {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000
  return new Date(utc + 7 * 3600000)
}

function formatHHmm(date: Date) {
  const h = String(date.getHours()).padStart(2, "0")
  const m = String(date.getMinutes()).padStart(2, "0")
  return `${h}:${m}`
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

export async function POST(req: NextRequest) {
  try {
    // 1. Validasi Autentikasi Perangkat IoT via Header
    const apiKey =
      req.headers.get("x-device-key") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")

    if (!apiKey) {
      return NextResponse.json(
        { success: false, code: "UNAUTHORIZED", pesan: "Device Key Diperlukan", beep: 3 },
        { status: 401 }
      )
    }

    const device = await prisma.perangkatRfid.findUnique({
      where: { apiKey },
    })

    if (!device || !device.aktif) {
      return NextResponse.json(
        { success: false, code: "FORBIDDEN", pesan: "Perangkat Dinonaktifkan", beep: 3 },
        { status: 403 }
      )
    }

    // Perbarui status lastPing perangkat
    prisma.perangkatRfid
      .update({
        where: { id: device.id },
        data: { lastPing: new Date() },
      })
      .catch(() => {})

    // 2. Ekstrak & Sanitasi Payload
    const body = await req.json().catch(() => ({}))
    const rawUid = String(body.rfidUid || body.rfidCardId || "").trim()

    if (!rawUid || rawUid.length < 4) {
      return NextResponse.json(
        { success: false, code: "INVALID_UID", pesan: "UID Kartu Kosong", beep: 3 },
        { status: 400 }
      )
    }

    const rfidUid = rawUid.toUpperCase()

    // 3. Debounce: Cegah double tap dalam 10 detik terakhir
    const tenSecondsAgo = new Date(Date.now() - 10 * 1000)
    const recentTap = await prisma.logTapRfid.findFirst({
      where: {
        rfidUid,
        waktuTap: { gte: tenSecondsAgo },
      },
      orderBy: { waktuTap: "desc" },
    })

    if (recentTap) {
      return NextResponse.json({
        success: true,
        code: "DOUBLE_TAP",
        nama: recentTap.namaPemilik || "Kartu",
        pesan: "Sudah Ditap",
        jam: formatHHmm(getWibDate()),
        beep: 2,
      })
    }

    // 4. Pengaturan Jam Operasional Absensi
    const now = new Date()
    const nowWib = getWibDate(now)
    const timeStr = formatHHmm(nowWib)
    const timeMinutes = timeToMinutes(timeStr)

    // Tanggal hari ini (tanpa jam, waktu server local)
    const todayDateStr = nowWib.toISOString().split("T")[0]
    const todayDate = new Date(`${todayDateStr}T00:00:00.000Z`)

    // 4.1 Cek Hari Libur (Mingguan, Kondisional, Libur Semester)
    const holidayCheck = await isHariLibur(todayDateStr)
    if (holidayCheck.isLibur && !holidayCheck.allowRfidScan) {
      await prisma.logTapRfid.create({
        data: {
          rfidUid,
          pemilikTipe: "UNKNOWN",
          statusTap: "HARI_LIBUR",
          kodePerangkat: device.kodePerangkat,
        },
      }).catch(() => {})

      return NextResponse.json({
        success: false,
        code: "HARI_LIBUR",
        tipe: "LIBUR",
        pesan: holidayCheck.namaLibur || "Hari Libur",
        sub: "Tidak Ada Presensi",
        jam: timeStr,
        beep: 3,
      })
    }

    const activeSemester = await prisma.semester.findFirst({
      where: { isActive: true },
    })
    const semesterId = activeSemester?.id ?? null

    const config = await prisma.pengaturanAbsensi.findFirst()
    const jamMasukBatas = config?.jamMasukBatas || "07:15"
    const jamPulangMulai = config?.jamPulangMulai || "14:30"
    const limitMasukMinutes = timeToMinutes(jamMasukBatas)
    const limitPulangMinutes = timeToMinutes(jamPulangMulai)

    // 5. Cari Pemilik Kartu (Guru atau Santri)
    // A. Cek Guru
    const guru = await prisma.guru.findUnique({
      where: { rfidCardId: rfidUid },
      select: { id: true, nama: true },
    })

    if (guru) {
      // Periksa riwayat kehadiran guru hari ini
      const kehadiran = await prisma.kehadiranGuru.findUnique({
        where: {
          guruId_tanggal: {
            guruId: guru.id,
            tanggal: todayDate,
          },
        },
      })

      // Jika belum ada absensi masuk hari ini
      if (!kehadiran) {
        // Untuk guru: selalu tercatat HADIR (tidak ada status terlambat)
        await prisma.kehadiranGuru.create({
          data: {
            guruId: guru.id,
            semesterId,
            tanggal: todayDate,
            jamMasuk: now,
            status: "HADIR",
            metode: "RFID",
            keterangan: "Hadir (RFID)",
          },
        })

        await prisma.logTapRfid.create({
          data: {
            rfidUid,
            pemilikTipe: "GURU",
            pemilikId: guru.id,
            namaPemilik: guru.nama,
            statusTap: "BERHASIL_MASUK",
            kodePerangkat: device.kodePerangkat,
          },
        })

        return NextResponse.json({
          success: true,
          code: "MASUK_OK",
          tipe: "GURU",
          nama: guru.nama,
          sub: "Guru",
          jam: timeStr,
          pesan: "Hadir",
          beep: 1,
        })
      }

      // Jika sudah ada absensi masuk, periksa untuk absensi pulang
      if (kehadiran.jamPulang) {
        return NextResponse.json({
          success: true,
          code: "ALREADY_CHECKED",
          tipe: "GURU",
          nama: guru.nama,
          sub: "Guru",
          jam: timeStr,
          pesan: "Sudah Absen",
          beep: 2,
        })
      }

      // Jika waktu sekarang sudah masuk jam pulang
      if (timeMinutes >= limitPulangMinutes) {
        await prisma.kehadiranGuru.update({
          where: { id: kehadiran.id },
          data: { jamPulang: now },
        })

        await prisma.logTapRfid.create({
          data: {
            rfidUid,
            pemilikTipe: "GURU",
            pemilikId: guru.id,
            namaPemilik: guru.nama,
            statusTap: "BERHASIL_PULANG",
            kodePerangkat: device.kodePerangkat,
          },
        })

        return NextResponse.json({
          success: true,
          code: "PULANG_OK",
          tipe: "GURU",
          nama: guru.nama,
          sub: "Guru",
          jam: timeStr,
          pesan: "Absen Pulang OK",
          beep: 1,
        })
      } else {
        // Belum waktunya pulang dan sudah masuk
        return NextResponse.json({
          success: true,
          code: "ALREADY_CHECKED",
          tipe: "GURU",
          nama: guru.nama,
          sub: "Guru",
          jam: timeStr,
          pesan: "Sudah Masuk",
          beep: 2,
        })
      }
    }

    // B. Cek Santri
    const santri = await prisma.santri.findUnique({
      where: { rfidCardId: rfidUid },
      select: {
        id: true,
        namaLengkap: true,
        nisn: true,
        riwayatKelas: {
          select: {
            kelasFormalId: true,
            kelasFormal: { select: { namaKelas: true } },
          },
          orderBy: { id: "desc" },
          take: 1,
        },
      },
    })

    if (santri) {
      const activeKelas = santri.riwayatKelas[0]
      const kelasFormalId = activeKelas?.kelasFormalId
      const namaKelas = activeKelas?.kelasFormal?.namaKelas || "Santri"

      if (!kelasFormalId) {
        return NextResponse.json({
          success: false,
          code: "NO_CLASS",
          tipe: "SANTRI",
          nama: santri.namaLengkap,
          sub: "Belum Ada Kelas",
          pesan: "Hubungi Admin",
          beep: 3,
        })
      }

      // Cek kehadiran santri hari ini
      const kehadiran = await prisma.kehadiranHarianSantri.findUnique({
        where: {
          santriId_tanggal: {
            santriId: santri.id,
            tanggal: todayDate,
          },
        },
      })

      // Jika belum absen masuk hari ini
      if (!kehadiran) {
        const isLate = timeMinutes > limitMasukMinutes
        const lateMinutes = isLate ? timeMinutes - limitMasukMinutes : 0
        const status = isLate ? "TERLAMBAT" : "HADIR"
        const pesan = isLate ? `Terlambat ${lateMinutes}m` : "Tepat Waktu"
        const beep = isLate ? 2 : 1

        await prisma.kehadiranHarianSantri.create({
          data: {
            santriId: santri.id,
            kelasFormalId,
            semesterId,
            tanggal: todayDate,
            jamMasuk: now,
            status,
            metode: "RFID",
            keterangan: isLate
              ? `Terlambat ${lateMinutes} menit (RFID)`
              : "Hadir tepat waktu (RFID)",
          },
        })

        await prisma.logTapRfid.create({
          data: {
            rfidUid,
            pemilikTipe: "SANTRI",
            pemilikId: santri.id,
            namaPemilik: santri.namaLengkap,
            statusTap: "BERHASIL_MASUK",
            kodePerangkat: device.kodePerangkat,
          },
        })

        return NextResponse.json({
          success: true,
          code: isLate ? "TERLAMBAT" : "MASUK_OK",
          tipe: "SANTRI",
          nama: santri.namaLengkap,
          sub: namaKelas,
          jam: timeStr,
          pesan,
          beep,
        })
      }

      // Jika sudah ada record masuk hari ini
      if (kehadiran.jamPulang) {
        return NextResponse.json({
          success: true,
          code: "ALREADY_CHECKED",
          tipe: "SANTRI",
          nama: santri.namaLengkap,
          sub: namaKelas,
          jam: timeStr,
          pesan: "Sudah Absen",
          beep: 2,
        })
      }

      // Jika waktu sekarang sudah masuk jam pulang
      if (timeMinutes >= limitPulangMinutes) {
        await prisma.kehadiranHarianSantri.update({
          where: { id: kehadiran.id },
          data: { jamPulang: now },
        })

        await prisma.logTapRfid.create({
          data: {
            rfidUid,
            pemilikTipe: "SANTRI",
            pemilikId: santri.id,
            namaPemilik: santri.namaLengkap,
            statusTap: "BERHASIL_PULANG",
            kodePerangkat: device.kodePerangkat,
          },
        })

        return NextResponse.json({
          success: true,
          code: "PULANG_OK",
          tipe: "SANTRI",
          nama: santri.namaLengkap,
          sub: namaKelas,
          jam: timeStr,
          pesan: "Absen Pulang OK",
          beep: 1,
        })
      } else {
        return NextResponse.json({
          success: true,
          code: "ALREADY_CHECKED",
          tipe: "SANTRI",
          nama: santri.namaLengkap,
          sub: namaKelas,
          jam: timeStr,
          pesan: "Sudah Masuk",
          beep: 2,
        })
      }
    }

    // 6. Kartu Tidak Dikenal / Belum Terdaftar
    await prisma.logTapRfid.create({
      data: {
        rfidUid,
        pemilikTipe: "UNKNOWN",
        statusTap: "KARTU_TIDAK_TERDAFTAR",
        kodePerangkat: device.kodePerangkat,
      },
    })

    return NextResponse.json({
      success: false,
      code: "UNREGISTERED",
      uid: rfidUid,
      pesan: "Belum Terdaftar",
      beep: 3,
    })
  } catch (error: any) {
    console.error("Error /api/absensi-rfid:", error)
    return NextResponse.json(
      { success: false, code: "SERVER_ERROR", pesan: "Error Server", beep: 3 },
      { status: 500 }
    )
  }
}
