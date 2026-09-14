import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey } from "@/lib/api-auth"

export async function GET(request: Request) {
  const authError = validateApiKey(request)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const jenjangId = searchParams.get("jenjangId")
    const kelasId = searchParams.get("kelasId")
    const isAlumniParam = searchParams.get("isAlumni")

    let whereClause: any = {}
    
    // Default filter out alumni unless explicitly asked
    const isAlumniFilter = isAlumniParam === "true" ? true : isAlumniParam === "false" ? false : undefined;

    if (jenjangId) {
      whereClause.jenjangs = {
        some: {
          jenjangId: parseInt(jenjangId),
          ...(isAlumniFilter !== undefined && { isAlumni: isAlumniFilter })
        }
      }
    } else if (isAlumniFilter !== undefined) {
      whereClause.jenjangs = {
        some: { isAlumni: isAlumniFilter }
      }
    }

    if (kelasId) {
      whereClause.riwayatKelas = {
        some: {
          kelasFormalId: parseInt(kelasId)
        }
      }
    }

    const santri = await prisma.santri.findMany({
      where: whereClause,
      select: {
        id: true,
        nisn: true,
        namaLengkap: true,
        nik: true,
        tempatLahir: true,
        tanggalLahir: true,
        jenisKelamin: true,
        noTelepon: true,
        fotoWajah: true,
        jenjangs: {
          select: {
            jenjang: {
              select: {
                id: true,
                nama: true,
                singkatan: true
              }
            },
            statusMukim: true,
            isAlumni: true,
          }
        },
        riwayatKelas: {
          select: {
            kelasFormal: {
              select: {
                id: true,
                namaKelas: true,
                tahunAjaran: {
                  select: {
                    nama: true,
                    isActive: true
                  }
                }
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ success: true, data: santri })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
