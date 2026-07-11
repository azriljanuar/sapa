import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey } from "@/lib/api-auth"

export async function GET(request: Request) {
  const authError = validateApiKey(request)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const jenjangId = searchParams.get("jenjangId")

    let whereClause = {}
    if (jenjangId) {
      whereClause = {
        jenjangs: {
          some: {
            id: parseInt(jenjangId)
          }
        }
      }
    }

    const guru = await prisma.guru.findMany({
      where: whereClause,
      select: {
        id: true,
        nama: true,
        nip: true,
        email: true,
        niPPPK: true,
        nuptk: true,
        nik: true,
        tempatLahir: true,
        tanggalLahir: true,
        jenisKelamin: true,
        noTelepon: true,
        fotoWajah: true,
        jenjangs: {
          select: {
            id: true,
            nama: true,
            singkatan: true
          }
        }
      }
    })

    return NextResponse.json({ success: true, data: guru })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
