import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Ambil tap terakhir yang statusnya KARTU_TIDAK_TERDAFTAR dalam 10 menit terakhir
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)

    const lastTap = await prisma.logTapRfid.findFirst({
      where: {
        statusTap: "KARTU_TIDAK_TERDAFTAR",
        waktuTap: { gte: tenMinutesAgo },
      },
      orderBy: { waktuTap: "desc" },
    })

    if (!lastTap) {
      return NextResponse.json({
        success: false,
        message: "Tidak ada tap kartu baru dalam 10 menit terakhir.",
      })
    }

    // Pastikan kartu ini belum didaftarkan ke Santri atau Guru lain
    const [usedByGuru, usedBySantri] = await Promise.all([
      prisma.guru.findUnique({
        where: { rfidCardId: lastTap.rfidUid },
        select: { id: true, nama: true },
      }),
      prisma.santri.findUnique({
        where: { rfidCardId: lastTap.rfidUid },
        select: { id: true, namaLengkap: true },
      }),
    ])

    if (usedByGuru) {
      return NextResponse.json({
        success: false,
        message: `Kartu ${lastTap.rfidUid} sudah terdaftar atas nama Guru ${usedByGuru.nama}.`,
      })
    }

    if (usedBySantri) {
      return NextResponse.json({
        success: false,
        message: `Kartu ${lastTap.rfidUid} sudah terdaftar atas nama Santri ${usedBySantri.namaLengkap}.`,
      })
    }

    return NextResponse.json({
      success: true,
      rfidUid: lastTap.rfidUid,
      waktuTap: lastTap.waktuTap,
      kodePerangkat: lastTap.kodePerangkat,
    })
  } catch (error: any) {
    console.error("Error /api/absensi-rfid/last-tap:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Gagal mengambil data tap terakhir." },
      { status: 500 }
    )
  }
}
