import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET /api/absensi-manual?kelasId=123
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const kelasId = searchParams.get("kelasId")

    if (!kelasId) {
      return NextResponse.json({ success: false, message: "Kelas ID diperlukan" }, { status: 400 })
    }

    const todayStr = new Date().toISOString().split("T")[0]
    const today = new Date(todayStr)

    // Ambil santri melalui RiwayatKelas (relasi many-to-many)
    const riwayatList = await prisma.riwayatKelas.findMany({
      where: {
        kelasFormalId: parseInt(kelasId),
      },
      include: {
        santri: {
          include: {
            kehadiranHarian: {
              where: { tanggal: today }
            }
          }
        }
      },
      orderBy: { santri: { namaLengkap: 'asc' } }
    })

    const result = riwayatList.map(r => ({
      id: r.santri.id,
      namaLengkap: r.santri.namaLengkap,
      nisn: r.santri.nisn,
      kehadiranHariIni: r.santri.kehadiranHarian[0] || null
    }))

    return NextResponse.json({ success: true, data: result })

  } catch (error: any) {
    console.error("GET Absen Manual Error:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

// POST /api/absensi-manual
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { kelasId, absensiData } = body 
    // absensiData = [{ santriId: 1, status: "SAKIT", keterangan: "" }, ...]

    if (!kelasId || !absensiData || !Array.isArray(absensiData)) {
      return NextResponse.json({ success: false, message: "Data tidak valid" }, { status: 400 })
    }

    const todayStr = new Date().toISOString().split("T")[0]
    const today = new Date(todayStr)

    // Find active semester
    const activeTA = await prisma.tahunAjaran.findFirst({
      orderBy: { nama: 'desc' },
      include: { semester: { orderBy: { nama: 'asc' } } }
    })
    const activeSemester = activeTA?.semester[0]

    // Gunakan transaksi untuk update bulk
    const operations = absensiData.map((data: any) => {
      // Upsert: update jika ada, create jika belum ada
      return prisma.kehadiranHarianSantri.upsert({
        where: {
          santriId_tanggal: {
            santriId: data.santriId,
            tanggal: today
          }
        },
        update: {
          status: data.status,
          keterangan: data.keterangan || null
        },
        create: {
          santriId: data.santriId,
          kelasFormalId: parseInt(kelasId),
          tanggal: today,
          status: data.status as any,
          semesterId: activeSemester?.id || null,
          keterangan: data.keterangan || null
        }
      })
    })

    await prisma.$transaction(operations)

    return NextResponse.json({ success: true, message: "Absensi berhasil disimpan" })

  } catch (error: any) {
    console.error("POST Absen Manual Error:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
