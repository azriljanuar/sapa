import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getLoggedInAdminJenjang } from "@/lib/auth"
import * as xlsx from "xlsx"

export async function GET(req: NextRequest) {
  try {
    const admin = await getLoggedInAdminJenjang()
    if (!admin.jenjangId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const alumniList = await prisma.santri.findMany({
      where: {
        jenjangs: {
          some: {
            jenjangId: admin.jenjangId,
            isAlumni: true,
          }
        }
      },
      include: {
        jenjangs: {
          where: { jenjangId: admin.jenjangId }
        }
      },
      orderBy: {
        namaLengkap: "asc",
      },
    })

    if (alumniList.length === 0) {
      return NextResponse.json({ error: "Tidak ada data alumni" }, { status: 404 })
    }

    const jenjang = await prisma.jenjangPendidikan.findUnique({
      where: { id: admin.jenjangId }
    })

    const dataExcel = alumniList.map((santri, index) => {
      const p = santri.jenjangs[0]
      return {
        "No": index + 1,
        "NISN": santri.nisn,
        "Nama Lengkap": santri.namaLengkap,
        "Tempat Lahir": santri.tempatLahir || "-",
        "Tanggal Lahir": santri.tanggalLahir ? santri.tanggalLahir.toISOString().split("T")[0] : "-",
        "Status Mukim": p?.statusMukim ? "Mukim" : "Tidak",
        "Status Lanjutan": p?.statusLanjutan ? p.statusLanjutan.replace("_", " ") : "-",
        "Nama Instansi / Kampus": p?.namaInstansi || "-",
        "Program Studi": p?.programStudi || "-",
        "Kota Domisili Sekarang": p?.kotaDomisiliSekarang || "-",
        "Kontak WA": p?.kontakWA || "-",
        "Email": p?.email || "-",
        "Catatan": p?.keteranganLulus || "-"
      }
    })

    const worksheet = xlsx.utils.json_to_sheet(dataExcel)
    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, worksheet, "Data Alumni")

    // Atur lebar kolom
    const wscols = [
      { wch: 5 },  // No
      { wch: 15 }, // NISN
      { wch: 30 }, // Nama
      { wch: 20 }, // Tempat Lahir
      { wch: 15 }, // Tanggal Lahir
      { wch: 15 }, // Status Mukim
      { wch: 20 }, // Status Lanjutan
      { wch: 30 }, // Instansi
      { wch: 20 }, // Prodi
      { wch: 20 }, // Domisili
      { wch: 15 }, // WA
      { wch: 25 }, // Email
      { wch: 30 }  // Catatan
    ]
    worksheet['!cols'] = wscols

    const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" })

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="Data_Alumni_${jenjang?.singkatan || "SAPA"}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }
    })

  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Gagal mengekspor data" }, { status: 500 })
  }
}
