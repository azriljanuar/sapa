import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET /api/rekap-guru-harian?jenjangId=1&tanggal=2026-09-13
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const jenjangId = searchParams.get("jenjangId")
    const tanggalParam = searchParams.get("tanggal")

    if (!jenjangId || !tanggalParam) {
      return NextResponse.json({ success: false, message: "Jenjang ID dan Tanggal diperlukan" }, { status: 400 })
    }

    const tanggal = new Date(tanggalParam)

    const jenjang = await prisma.jenjangPendidikan.findUnique({
      where: { id: parseInt(jenjangId) },
      select: { id: true, nama: true }
    })

    if (!jenjang) {
      return NextResponse.json({ success: false, message: "Jenjang tidak ditemukan" }, { status: 404 })
    }

    // Ambil guru yang mengajar di jenjang ini
    const guruList = await prisma.guru.findMany({
      where: {
        jenjangs: {
          some: { id: parseInt(jenjangId) }
        }
      },
      include: {
        kehadiran: {
          where: { tanggal: tanggal }
        }
      },
      orderBy: { nama: 'asc' }
    })

    const summary = { hadir: 0, sakit: 0, izin: 0, alpa: 0, belumAbsen: 0 }
    const totalGuru = guruList.length

    const data = guruList.map(g => {
      const kehadiran = g.kehadiran[0]
      const status = kehadiran?.status || null
      const keterangan = kehadiran?.keterangan || null

      if (status === 'HADIR') summary.hadir++
      else if (status === 'SAKIT') summary.sakit++
      else if (status === 'IZIN') summary.izin++
      else if (status === 'ALPA') summary.alpa++
      else summary.belumAbsen++

      return {
        id: g.id,
        nama: g.nama,
        nip: g.nip,
        status,
        keterangan
      }
    })

    return NextResponse.json({
      success: true,
      jenjang,
      tanggal: tanggalParam,
      totalGuru,
      summary,
      data
    })

  } catch (error: any) {
    console.error("GET Rekap Guru Harian Error:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
