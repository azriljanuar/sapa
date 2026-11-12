import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession, getLoggedInAdminJenjang } from "@/lib/auth"
import * as xlsx from "xlsx"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_JENJANG")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = await getLoggedInAdminJenjang()
    if (!admin.jenjangId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const kelasParam = searchParams.get("kelas") || "all"

    const { getSelectedTahunAjaran } = await import("@/lib/ta-context")
    const activeTA = await getSelectedTahunAjaran()

    const santris = await prisma.santri.findMany({
      where: {
        jenjangs: {
          some: {
            jenjangId: admin.jenjangId,
            isAlumni: false,
            statusKeluar: null,
          }
        }
      },
      include: {
        jenjangs: {
          where: { jenjangId: admin.jenjangId }
        },
        riwayatKelas: {
          where: {
            kelasFormal: { jenjangId: admin.jenjangId }
          },
          include: {
            kelasFormal: {
              select: { id: true, namaKelas: true, tahunAjaranId: true }
            }
          },
          orderBy: { id: "desc" }
        }
      },
      orderBy: {
        namaLengkap: "asc"
      }
    })

    const mappedSantris = santris.map(s => {
      const activeRiwayat = (activeTA && s.riwayatKelas.find(r => r.kelasFormal.tahunAjaranId === activeTA.id))
        || s.riwayatKelas[0]
      const namaKelas = activeRiwayat?.kelasFormal?.namaKelas || null
      const statusMukim = s.jenjangs[0]?.statusMukim || false

      return {
        id: s.id,
        nisn: s.nisn,
        namaLengkap: s.namaLengkap,
        jenisKelamin: s.jenisKelamin,
        namaKelas,
        statusMukim
      }
    })

    let filtered = mappedSantris
    if (kelasParam === "none") {
      filtered = mappedSantris.filter(s => !s.namaKelas)
    } else if (kelasParam && kelasParam !== "all") {
      filtered = mappedSantris.filter(s => s.namaKelas === kelasParam)
    }

    const jenjang = await prisma.jenjangPendidikan.findUnique({
      where: { id: admin.jenjangId }
    })
    const jenjangSingkatan = jenjang?.singkatan || "MA"

    const excelData = filtered.map((s, index) => ({
      "No": index + 1,
      "NISN (Username)": String(s.nisn || ""),
      "Nama Lengkap": s.namaLengkap,
      "Kelas": s.namaKelas || "Belum Ada Kelas",
      "Jenis Kelamin": s.jenisKelamin || "-",
      "Status Mukim": s.statusMukim ? "Mukim" : "Tidak",
      "Password Default": "password123",
      "Status Akun": "Aktif"
    }))

    const worksheet = xlsx.utils.json_to_sheet(excelData)

    // Force string formatting on NISN and Password cells to prevent Excel stripping leading zeros
    const range = xlsx.utils.decode_range(worksheet['!ref'] || "A1:H1")
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      // Column index 1: NISN (Username)
      const nisnAddr = xlsx.utils.encode_cell({ r: R, c: 1 })
      if (worksheet[nisnAddr]) {
        worksheet[nisnAddr].t = 's'
        worksheet[nisnAddr].z = '@'
      }
      // Column index 6: Password Default
      const pwdAddr = xlsx.utils.encode_cell({ r: R, c: 6 })
      if (worksheet[pwdAddr]) {
        worksheet[pwdAddr].t = 's'
        worksheet[pwdAddr].z = '@'
      }
    }

    // Set column widths
    worksheet['!cols'] = [
      { wch: 6 },  // No
      { wch: 18 }, // NISN (Username)
      { wch: 32 }, // Nama Lengkap
      { wch: 16 }, // Kelas
      { wch: 16 }, // Jenis Kelamin
      { wch: 14 }, // Status Mukim
      { wch: 18 }, // Password Default
      { wch: 14 }, // Status Akun
    ]

    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, worksheet, "Akun Siswa")

    const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" })

    const kelasLabel = (!kelasParam || kelasParam === "all") 
      ? "Semua_Kelas" 
      : (kelasParam === "none" ? "Tanpa_Kelas" : `Kelas_${kelasParam.replace(/[^a-zA-Z0-9_-]/g, "_")}`)
    const taLabel = activeTA ? `_${activeTA.nama.replace(/[^a-zA-Z0-9_-]/g, "_")}` : ""
    const fileName = `Akun_Siswa_${jenjangSingkatan}_${kelasLabel}${taLabel}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }
    })
  } catch (error: any) {
    console.error("Export Akun Santri Error:", error)
    return NextResponse.json({ error: "Gagal mengekspor data akun santri" }, { status: 500 })
  }
}
