import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { isHariLibur } from "@/lib/holiday-utils"

// GET /api/rekap-harian?kelasId=123&tanggal=2026-07-29 atau ?kelasId=ALL&jenjangId=1&tanggal=2026-07-29
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const kelasId = searchParams.get("kelasId")
    const jenjangId = searchParams.get("jenjangId")
    const tanggalParam = searchParams.get("tanggal")

    if ((!kelasId && !jenjangId) || !tanggalParam) {
      return NextResponse.json({ success: false, message: "Parameter tidak lengkap" }, { status: 400 })
    }

    const tanggal = new Date(tanggalParam)
    let effectiveJenjangId = jenjangId ? parseInt(jenjangId) : null
    let kelas = null

    if (kelasId && kelasId !== "ALL") {
      kelas = await prisma.kelasFormal.findUnique({
        where: { id: parseInt(kelasId) },
        select: { id: true, namaKelas: true, jenjangId: true }
      })

      if (!kelas) {
        return NextResponse.json({ success: false, message: "Kelas tidak ditemukan" }, { status: 404 })
      }
      effectiveJenjangId = kelas.jenjangId
    }

    const holiday = effectiveJenjangId ? await isHariLibur(tanggalParam, effectiveJenjangId) : { isLibur: false }

    const whereClause: any = {}
    if (kelasId && kelasId !== "ALL") {
      whereClause.kelasFormalId = parseInt(kelasId)
    } else if (effectiveJenjangId) {
      whereClause.kelasFormal = { 
        jenjangId: effectiveJenjangId,
        tahunAjaran: { isActive: true }
      }
    }

    // Ambil santri melalui RiwayatKelas
    const riwayatList = await prisma.riwayatKelas.findMany({
      where: whereClause,
      include: {
        kelasFormal: {
          select: { id: true, namaKelas: true }
        },
        santri: {
          include: {
            kehadiranHarian: {
              where: { tanggal: tanggal }
            }
          }
        }
      },
      orderBy: [
        { kelasFormal: { namaKelas: 'asc' } },
        { santri: { namaLengkap: 'asc' } }
      ]
    })

    const summary = { hadir: 0, terlambat: 0, sakit: 0, izin: 0, alpa: 0, belumAbsen: 0 }
    const totalSantri = riwayatList.length

    const data = riwayatList.map(r => {
      const kehadiran = r.santri.kehadiranHarian[0]
      const status = kehadiran?.status || null
      const keterangan = kehadiran?.keterangan || null

      if (status === 'HADIR') summary.hadir++
      else if (status === 'TERLAMBAT') {
        summary.hadir++
        summary.terlambat++
      }
      else if (status === 'SAKIT') summary.sakit++
      else if (status === 'IZIN') summary.izin++
      else if (status === 'ALPA') summary.alpa++
      else summary.belumAbsen++

      return {
        id: r.santri.id,
        namaLengkap: r.santri.namaLengkap,
        nisn: r.santri.nisn,
        rfidCardId: r.santri.rfidCardId,
        kelasId: r.kelasFormal.id,
        namaKelas: r.kelasFormal.namaKelas,
        status,
        keterangan,
        jamMasuk: kehadiran?.jamMasuk || null,
        jamPulang: kehadiran?.jamPulang || null,
        metode: kehadiran?.metode || null,
      }
    })

    return NextResponse.json({
      success: true,
      kelas,
      tanggal: tanggalParam,
      totalSantri,
      summary,
      holiday,
      data
    })

  } catch (error: any) {
    console.error("GET Rekap Harian Error:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
