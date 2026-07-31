import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN_JENJANG") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { pengampuId, kkm } = await req.json()
    if (!pengampuId) {
      return NextResponse.json({ success: false, error: "pengampuId diperlukan" }, { status: 400 })
    }

    const jenjangId = session.jenjangId
    if (!jenjangId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Pastikan pengampu ada di jenjang admin ini
    const pengampu = await prisma.pengampuMataPelajaran.findFirst({
      where: {
        id: pengampuId,
        kelasFormal: { jenjangId }
      }
    })

    if (!pengampu) {
      return NextResponse.json({ success: false, error: "Data tidak ditemukan" }, { status: 404 })
    }


    const updated = await prisma.pengampuMataPelajaran.update({
      where: { id: pengampuId },
      data: { kkm: kkm !== null && !isNaN(kkm) ? Number(kkm) : null }
    })

    return NextResponse.json({ success: true, data: { kkm: updated.kkm } })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
