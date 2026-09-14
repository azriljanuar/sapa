import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { validateApiKey } from "@/lib/api-auth"

// GET /api/v1/elearning/absensi-harian?tanggal=2026-09-14&kelasId=1
export async function GET(request: Request) {
  const authError = validateApiKey(request)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const tanggalParam = searchParams.get("tanggal")
    const kelasId = searchParams.get("kelasId")
    const santriId = searchParams.get("santriId")

    let whereClause: any = {}
    
    if (tanggalParam) {
      whereClause.tanggal = new Date(tanggalParam)
    } else {
      // Default hari ini
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      whereClause.tanggal = today
    }

    if (kelasId) {
      whereClause.kelasFormalId = parseInt(kelasId)
    }

    if (santriId) {
      whereClause.santriId = parseInt(santriId)
    }

    const absensi = await prisma.kehadiranHarianSantri.findMany({
      where: whereClause,
      select: {
        id: true,
        santriId: true,
        kelasFormalId: true,
        tanggal: true,
        status: true,
        keterangan: true,
        santri: {
          select: {
            namaLengkap: true,
            nisn: true
          }
        }
      }
    })

    return NextResponse.json({ success: true, data: absensi })
  } catch (error: any) {
    console.error("API Absensi Harian Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
