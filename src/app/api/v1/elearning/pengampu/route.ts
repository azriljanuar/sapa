import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey } from "@/lib/api-auth"

export async function GET(request: Request) {
  const authError = validateApiKey(request)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const tahunAjaranId = searchParams.get("tahunAjaranId")
    const guruId = searchParams.get("guruId")
    const kelasFormalId = searchParams.get("kelasFormalId")

    let whereClause: any = {}
    
    if (tahunAjaranId) {
      whereClause.tahunAjaranId = parseInt(tahunAjaranId)
    } else {
      const activeTA = await prisma.tahunAjaran.findFirst({ orderBy: { nama: 'desc' } })
      if (activeTA) {
        whereClause.tahunAjaranId = activeTA.id
      }
    }
    
    if (guruId) {
      whereClause.guruId = parseInt(guruId)
    }
    
    if (kelasFormalId) {
      whereClause.kelasFormalId = parseInt(kelasFormalId)
    }

    const pengampu = await prisma.pengampuMataPelajaran.findMany({
      where: whereClause,
      select: {
        id: true,
        mataPelajaran: {
          select: {
            id: true,
            nama: true,
            jenjang: {
              select: {
                id: true,
                nama: true
              }
            }
          }
        },
        kelasFormal: {
          select: {
            id: true,
            namaKelas: true
          }
        },
        guru: {
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
        }
      }
    })

    return NextResponse.json({ success: true, data: pengampu })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
