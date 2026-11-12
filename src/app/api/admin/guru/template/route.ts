import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import * as xlsx from "xlsx"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_JENJANG")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const templateData = [
      {
        "Nama Lengkap": "Ust. Ahmad Fauzi, S.Pd.I",
        "Email": "ahmad.fauzi@sapa.sch.id",
        "NIP": "198501012010011001",
        "NUPTK": "1234567890123456",
        "NIK": "3201010101850001",
        "Jenis Kelamin": "Laki-laki",
        "No Telepon": "081234567890",
        "Status Pegawai": "Guru Tetap Yayasan",
        "Pendidikan Terakhir": "S1",
        "Jurusan": "Pendidikan Agama Islam",
        "Alamat Lengkap": "Jl. Pesantren No. 12, Komplek Al-Ittihaad",
      },
      {
        "Nama Lengkap": "Usth. Siti Maryam, M.Pd",
        "Email": "siti.maryam@sapa.sch.id",
        "NIP": "199002022015022002",
        "NUPTK": "2345678901234567",
        "NIK": "3201014202900002",
        "Jenis Kelamin": "Perempuan",
        "No Telepon": "081987654321",
        "Status Pegawai": "PPPK",
        "Pendidikan Terakhir": "S2",
        "Jurusan": "Bahasa Arab",
        "Alamat Lengkap": "Jl. Mawar No. 5",
      },
    ]

    const worksheet = xlsx.utils.json_to_sheet(templateData)

    // Set column widths
    worksheet["!cols"] = [
      { wch: 28 }, // Nama
      { wch: 28 }, // Email
      { wch: 22 }, // NIP
      { wch: 20 }, // NUPTK
      { wch: 20 }, // NIK
      { wch: 15 }, // Jenis Kelamin
      { wch: 16 }, // No Telepon
      { wch: 22 }, // Status Pegawai
      { wch: 18 }, // Pendidikan
      { wch: 24 }, // Jurusan
      { wch: 35 }, // Alamat
    ]

    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, worksheet, "Template Guru")

    const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" })

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": 'attachment; filename="Template_Import_Guru_SAPA.xlsx"',
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    })
  } catch (error: any) {
    console.error("Error generating template:", error)
    return NextResponse.json({ error: error.message || "Gagal membuat template" }, { status: 500 })
  }
}
