import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey } from "@/lib/api-auth"

export async function GET(request: Request) {
  const authError = validateApiKey(request)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const jenjangId = searchParams.get("jenjangId")

    let whereClause: any = {}
    if (jenjangId) {
      whereClause.jenjangId = parseInt(jenjangId)
    }

    const mapel = await prisma.mataPelajaran.findMany({
      where: whereClause,
      select: {
        id: true,
        nama: true,
        kode: true,
        kkm: true,
        jenjang: {
          select: {
            id: true,
            nama: true,
            singkatan: true
          }
        }
      }
    })

    return NextResponse.json({ success: true, data: mapel })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
