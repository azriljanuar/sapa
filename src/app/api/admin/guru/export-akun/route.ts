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

    const gurus = await prisma.guru.findMany({
      where: {
        jenjangs: {
          some: { id: admin.jenjangId }
        }
      },
      orderBy: {
        nama: "asc"
      }
    })

    const jenjang = await prisma.jenjangPendidikan.findUnique({
      where: { id: admin.jenjangId }
    })
    const jenjangSingkatan = jenjang?.singkatan || "MA"

    const excelData = gurus.map((g, index) => ({
      "No": index + 1,
      "NIP": String(g.nip || "-"),
      "Nama Lengkap": g.nama,
      "Username (Email)": g.email,
      "Password Default": "password123",
      "Status Akun": "Aktif"
    }))

    const worksheet = xlsx.utils.json_to_sheet(excelData)

    // Force string formatting on NIP, Email, and Password cells
    const range = xlsx.utils.decode_range(worksheet['!ref'] || "A1:F1")
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      // Column index 1: NIP
      const nipAddr = xlsx.utils.encode_cell({ r: R, c: 1 })
      if (worksheet[nipAddr]) {
        worksheet[nipAddr].t = 's'
        worksheet[nipAddr].z = '@'
      }
      // Column index 3: Username (Email)
      const emailAddr = xlsx.utils.encode_cell({ r: R, c: 3 })
      if (worksheet[emailAddr]) {
        worksheet[emailAddr].t = 's'
        worksheet[emailAddr].z = '@'
      }
      // Column index 4: Password Default
      const pwdAddr = xlsx.utils.encode_cell({ r: R, c: 4 })
      if (worksheet[pwdAddr]) {
        worksheet[pwdAddr].t = 's'
        worksheet[pwdAddr].z = '@'
      }
    }

    // Set responsive column widths
    worksheet['!cols'] = [
      { wch: 6 },  // No
      { wch: 22 }, // NIP
      { wch: 34 }, // Nama Lengkap
      { wch: 30 }, // Username (Email)
      { wch: 18 }, // Password Default
      { wch: 14 }, // Status Akun
    ]

    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, worksheet, "Akun Guru")

    const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" })
    const fileName = `Akun_Guru_${jenjangSingkatan}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }
    })
  } catch (error: any) {
    console.error("Export Akun Guru Error:", error)
    return NextResponse.json({ error: "Gagal mengekspor data akun guru" }, { status: 500 })
  }
}
