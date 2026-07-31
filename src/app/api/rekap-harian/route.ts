import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET /api/rekap-harian?kelasId=123&tanggal=2026-07-29
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const kelasId = searchParams.get("kelasId")
    const tanggalParam = searchParams.get("tanggal")

    if (!kelasId || !tanggalParam) {
      return NextResponse.json({ success: false, message: "Kelas ID dan Tanggal diperlukan" }, { status: 400 })
    }

    const tanggal = new Date(tanggalParam)

    const kelas = await prisma.kelasFormal.findUnique({
      where: { id: parseInt(kelasId) },
      select: { id: true, namaKelas: true }
    })

    if (!kelas) {
      return NextResponse.json({ success: false, message: "Kelas tidak ditemukan" }, { status: 404 })
    }

    // Ambil santri melalui RiwayatKelas
    const riwayatList = await prisma.riwayatKelas.findMany({
      where: {
        kelasFormalId: parseInt(kelasId),
      },
      include: {
        santri: {
          include: {
            kehadiranHarian: {
              where: { tanggal: tanggal }
            }
          }
        }
      },
      orderBy: { santri: { namaLengkap: 'asc' } }
    })

    const summary = { hadir: 0, sakit: 0, izin: 0, alpa: 0, belumAbsen: 0 }
    const totalSantri = riwayatList.length

    const data = riwayatList.map(r => {
      const kehadiran = r.santri.kehadiranHarian[0]
      const status = kehadiran?.status || null
      const keterangan = kehadiran?.keterangan || null

      if (status === 'HADIR') summary.hadir++
      else if (status === 'SAKIT') summary.sakit++
      else if (status === 'IZIN') summary.izin++
      else if (status === 'ALPA') summary.alpa++
      else summary.belumAbsen++

      return {
        id: r.santri.id,
        namaLengkap: r.santri.namaLengkap,
        nisn: r.santri.nisn,
        status,
        keterangan
      }
    })

    return NextResponse.json({
      success: true,
      kelas,
      tanggal: tanggalParam,
      totalSantri,
      summary,
      data
    })

  } catch (error: any) {
    console.error("GET Rekap Harian Error:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
