import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey } from "@/lib/api-auth"

export async function GET(request: Request) {
  const authError = validateApiKey(request)
  if (authError) return authError

  try {
    const jenjang = await prisma.jenjangPendidikan.findMany({
      select: {
        id: true,
        nama: true,
        singkatan: true,
        deskripsi: true
      },
      orderBy: {
        id: 'asc'
      }
    })

    return NextResponse.json({ success: true, data: jenjang })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
