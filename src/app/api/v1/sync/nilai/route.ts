import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { validateApiKey } from "@/lib/api-auth"

export async function POST(request: Request) {
  // Verifikasi API Key
  const authError = validateApiKey(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { tipe, data } = body

    if (!tipe || !data || !Array.isArray(data)) {
      return NextResponse.json(
        { success: false, message: "Format payload tidak valid. Harap sertakan 'tipe' dan 'data' (array)." },
        { status: 400 }
      )
    }

    let processedCount = 0

    // Proses sinkronisasi berdasarkan tipe nilai
    switch (tipe.toUpperCase()) {
      case "SUMATIF":
        for (const item of data) {
          if (!item.pengampuId || !item.santriId || !item.semesterId || !item.sumatifKe) continue
          
          await prisma.nilaiSumatif.upsert({
            where: {
              pengampuId_santriId_sumatifKe_semesterId: {
                pengampuId: item.pengampuId,
                santriId: item.santriId,
                sumatifKe: item.sumatifKe,
                semesterId: item.semesterId
              }
            },
            update: {
              nilaiKurikuler: item.nilaiKurikuler ?? null,
              nilaiTesSumatif: item.nilaiTesSumatif ?? null,
            },
            create: {
              pengampuId: item.pengampuId,
              santriId: item.santriId,
              semesterId: item.semesterId,
              sumatifKe: item.sumatifKe,
              nilaiKurikuler: item.nilaiKurikuler ?? null,
              nilaiTesSumatif: item.nilaiTesSumatif ?? null,
            }
          })
          processedCount++
        }
        break

      case "PAS":
        for (const item of data) {
          if (!item.pengampuId || !item.santriId || !item.semesterId) continue

          await prisma.nilaiPAS.upsert({
            where: {
              pengampuId_santriId_semesterId: {
                pengampuId: item.pengampuId,
                santriId: item.santriId,
                semesterId: item.semesterId
              }
            },
            update: {
              nilai: item.nilai ?? null,
            },
            create: {
              pengampuId: item.pengampuId,
              santriId: item.santriId,
              semesterId: item.semesterId,
              nilai: item.nilai ?? null,
            }
          })
          processedCount++
        }
        break

      case "RAPOR":
        for (const item of data) {
          if (!item.pengampuId || !item.santriId || !item.semesterId) continue

          await prisma.laporanSemester.upsert({
            where: {
              santriId_pengampuId_semesterId: {
                santriId: item.santriId,
                pengampuId: item.pengampuId,
                semesterId: item.semesterId
              }
            },
            update: {
              nilaiAkhir: item.nilaiAkhir ?? null,
              grade: item.grade ?? null,
            },
            create: {
              santriId: item.santriId,
              pengampuId: item.pengampuId,
              semesterId: item.semesterId,
              nilaiAkhir: item.nilaiAkhir ?? null,
              grade: item.grade ?? null,
            }
          })
          processedCount++
        }
        break

      default:
        return NextResponse.json(
          { success: false, message: "Tipe nilai tidak dikenali. Gunakan SUMATIF, PAS, atau RAPOR." },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: `Sinkronisasi berhasil. ${processedCount} data ${tipe} diproses.`,
    })

  } catch (error: any) {
    console.error("Sync API Error:", error)
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server saat sinkronisasi.", error: error.message },
      { status: 500 }
    )
  }
}
