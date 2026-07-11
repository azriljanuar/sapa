import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey } from "@/lib/api-auth"

export async function GET(request: Request) {
  const authError = validateApiKey(request)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const jenjangId = searchParams.get("jenjangId")
    const tahunAjaranId = searchParams.get("tahunAjaranId")

    let whereClause: any = {}
    if (jenjangId) {
      whereClause.jenjangId = parseInt(jenjangId)
    }
    if (tahunAjaranId) {
      whereClause.tahunAjaranId = parseInt(tahunAjaranId)
    } else {
      // By default only return classes from active academic year
      whereClause.tahunAjaran = { isActive: true }
    }

    const kelas = await prisma.kelasFormal.findMany({
      where: whereClause,
      select: {
        id: true,
        namaKelas: true,
        jenjang: {
          select: {
            id: true,
            nama: true,
            singkatan: true
          }
        },
        waliKelas: {
          select: {
            id: true,
            nama: true,
            nip: true
          }
        },
        tahunAjaran: {
          select: {
            id: true,
            nama: true,
            isActive: true
          }
        },
        _count: {
          select: {
            anggota: true
          }
        }
      }
    })

    return NextResponse.json({ success: true, data: kelas })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
