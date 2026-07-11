import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey } from "@/lib/api-auth"

export async function GET(request: Request) {
  const authError = validateApiKey(request)
  if (authError) return authError

  try {
    const tahunAjaranAktif = await prisma.tahunAjaran.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        nama: true,
        isActive: true,
        semester: {
          where: { isActive: true },
          select: {
            id: true,
            nama: true,
            isActive: true
          }
        }
      }
    })

    if (!tahunAjaranAktif) {
      return NextResponse.json({ success: true, data: null, message: "Tidak ada tahun ajaran yang aktif" })
    }

    return NextResponse.json({ success: true, data: tahunAjaranAktif })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
