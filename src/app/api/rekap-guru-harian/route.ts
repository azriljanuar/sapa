import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { isHariLibur } from "@/lib/holiday-utils"

// GET /api/rekap-guru-harian?jenjangId=1&tanggal=2026-11-11&tahunAjaranId=2
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const jenjangId = searchParams.get("jenjangId")
    const tanggalParam = searchParams.get("tanggal")
    const tahunAjaranId = searchParams.get("tahunAjaranId")

    if (!jenjangId || !tanggalParam) {
      return NextResponse.json(
        { success: false, message: "Jenjang ID dan Tanggal diperlukan" },
        { status: 400 }
      )
    }

    const tanggal = new Date(tanggalParam)

    const jenjang = await prisma.jenjangPendidikan.findUnique({
      where: { id: parseInt(jenjangId) },
      select: { id: true, nama: true },
    })

    if (!jenjang) {
      return NextResponse.json(
        { success: false, message: "Jenjang tidak ditemukan" },
        { status: 404 }
      )
    }

    const holiday = await isHariLibur(tanggalParam, parseInt(jenjangId))

    // Tentukan nama hari dalam seminggu
    const [year, month, day] = tanggalParam.split("-").map(Number)
    const dateObj = new Date(year, month - 1, day)
    const dayMap: Array<"MINGGU" | "SENIN" | "SELASA" | "RABU" | "KAMIS" | "JUMAT" | "SABTU"> = [
      "MINGGU",
      "SENIN",
      "SELASA",
      "RABU",
      "KAMIS",
      "JUMAT",
      "SABTU",
    ]
    const namaHari = dayMap[dateObj.getDay()]

    // Tentukan semester acuan
    let semesterWhere: any = { isActive: true }
    if (tahunAjaranId) {
      const tId = parseInt(tahunAjaranId)
      const semActive = await prisma.semester.findFirst({
        where: { tahunAjaranId: tId, isActive: true },
      })
      if (semActive) {
        semesterWhere = { id: semActive.id }
      } else {
        semesterWhere = { tahunAjaranId: tId }
      }
    }
    const semester = await prisma.semester.findFirst({
      where: semesterWhere,
      orderBy: { id: "desc" },
    })

    // Ambil jadwal pelajaran pada hari ini untuk jenjang bersangkutan
    let jadwalHariIni = await prisma.jadwalPelajaran.findMany({
      where: {
        hari: namaHari,
        ...(semester ? { semesterId: semester.id } : {}),
        pengampu: {
          kelasFormal: {
            jenjangId: parseInt(jenjangId),
          },
        },
      },
      include: {
        pengampu: {
          include: {
            mataPelajaran: { select: { id: true, nama: true, kode: true } },
            kelasFormal: { select: { id: true, namaKelas: true } },
          },
        },
      },
      orderBy: [{ jamMulai: "asc" }],
    })

    // Fallback jika tidak ada jadwal dengan semesterId tertentu
    if (jadwalHariIni.length === 0 && semester) {
      jadwalHariIni = await prisma.jadwalPelajaran.findMany({
        where: {
          hari: namaHari,
          pengampu: {
            kelasFormal: {
              jenjangId: parseInt(jenjangId),
            },
          },
        },
        include: {
          pengampu: {
            include: {
              mataPelajaran: { select: { id: true, nama: true, kode: true } },
              kelasFormal: { select: { id: true, namaKelas: true } },
            },
          },
        },
        orderBy: [{ jamMulai: "asc" }],
      })
    }

    // Kelompokkan jadwal per guruId
    const jadwalByGuru = new Map<
      number,
      Array<{
        id: number
        mapel: string
        kodeMapel: string | null
        kelas: string
        jamMulai: string
        jamSelesai: string
      }>
    >()

    for (const j of jadwalHariIni) {
      const gid = j.pengampu.guruId
      if (!jadwalByGuru.has(gid)) {
        jadwalByGuru.set(gid, [])
      }
      const existingList = jadwalByGuru.get(gid)!
      const isDuplicate = existingList.some(
        (item) =>
          item.mapel === j.pengampu.mataPelajaran.nama &&
          item.kelas === j.pengampu.kelasFormal.namaKelas &&
          item.jamMulai === j.jamMulai &&
          item.jamSelesai === j.jamSelesai
      )
      if (!isDuplicate) {
        existingList.push({
          id: j.id,
          mapel: j.pengampu.mataPelajaran.nama,
          kodeMapel: j.pengampu.mataPelajaran.kode,
          kelas: j.pengampu.kelasFormal.namaKelas,
          jamMulai: j.jamMulai,
          jamSelesai: j.jamSelesai,
        })
      }
    }

    // Ambil semua guru di jenjang ini
    const guruList = await prisma.guru.findMany({
      where: {
        jenjangs: {
          some: { id: parseInt(jenjangId) },
        },
      },
      include: {
        kehadiran: {
          where: { tanggal: tanggal },
        },
      },
      orderBy: { nama: "asc" },
    })

    // Pisahkan guru yang terjadwal vs di luar jadwal
    const guruTerjadwal: any[] = []
    const guruLuarJadwal: any[] = []
    const guruLainnya: any[] = []

    for (const g of guruList) {
      const kehadiran = g.kehadiran[0]
      const status = kehadiran?.status || null
      const keterangan = kehadiran?.keterangan || null
      const hasJadwal = jadwalByGuru.has(g.id)
      const guruJadwalList = jadwalByGuru.get(g.id) || []

      const guruItem = {
        id: g.id,
        nama: g.nama,
        nip: g.nip,
        rfidCardId: g.rfidCardId,
        status,
        keterangan,
        jamMasuk: kehadiran?.jamMasuk || null,
        jamPulang: kehadiran?.jamPulang || null,
        metode: kehadiran?.metode || null,
        jadwal: guruJadwalList,
        hasJadwal,
      }

      if (hasJadwal) {
        guruTerjadwal.push(guruItem)
      } else if (status !== null || kehadiran?.jamMasuk) {
        // Tidak ada jadwal hari ini TAPI hadir / presensi
        guruLuarJadwal.push(guruItem)
      } else {
        // Tidak ada jadwal hari ini dan belum absen
        guruLainnya.push(guruItem)
      }
    }

    const summary = {
      totalGuru: guruList.length,
      totalTerjadwal: guruTerjadwal.length,
      hadirTerjadwal: guruTerjadwal.filter((g) => g.status === "HADIR" || g.status === "TERLAMBAT").length,
      terlambatTerjadwal: guruTerjadwal.filter((g) => g.status === "TERLAMBAT").length,
      sakitTerjadwal: guruTerjadwal.filter((g) => g.status === "SAKIT").length,
      izinTerjadwal: guruTerjadwal.filter((g) => g.status === "IZIN").length,
      alpaTerjadwal: guruTerjadwal.filter((g) => g.status === "ALPA").length,
      belumAbsenTerjadwal: guruTerjadwal.filter((g) => !g.status).length,

      // Ringkasan guru hadir di luar jadwal
      hadirLuarJadwal: guruLuarJadwal.filter((g) => g.status === "HADIR" || g.status === "TERLAMBAT").length,
      totalLuarJadwalHadir: guruLuarJadwal.length,

      // Ringkasan global untuk kompatibilitas
      hadir:
        guruTerjadwal.filter((g) => g.status === "HADIR" || g.status === "TERLAMBAT").length +
        guruLuarJadwal.filter((g) => g.status === "HADIR" || g.status === "TERLAMBAT").length,
      sakit: guruList.filter((g) => g.kehadiran[0]?.status === "SAKIT").length,
      izin: guruList.filter((g) => g.kehadiran[0]?.status === "IZIN").length,
      alpa: guruList.filter((g) => g.kehadiran[0]?.status === "ALPA").length,
      belumAbsen: guruTerjadwal.filter((g) => !g.status).length,
    }

    return NextResponse.json({
      success: true,
      jenjang,
      tanggal: tanggalParam,
      namaHari,
      holiday,
      summary,
      guruTerjadwal,
      guruLuarJadwal,
      guruLainnya,
      data: [...guruTerjadwal, ...guruLuarJadwal, ...guruLainnya],
    })
  } catch (error: any) {
    console.error("GET Rekap Guru Harian Error:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
