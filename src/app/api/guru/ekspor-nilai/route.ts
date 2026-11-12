import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import * as XLSX from "xlsx"

export async function GET(req: Request) {
  const session = await getSession()
  if (!session || session.role !== "GURU") {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const pengampuIdStr = searchParams.get("pengampuId")
  const semesterIdStr = searchParams.get("semesterId")

  if (!pengampuIdStr || !semesterIdStr) {
    return new NextResponse("Missing parameters", { status: 400 })
  }

  const pengampuId = parseInt(pengampuIdStr)
  const semesterId = parseInt(semesterIdStr)

  try {
    // 1. Ambil data pengampu, kelas, mata pelajaran
    const pengampu = await prisma.pengampuMataPelajaran.findFirst({
      where: { id: pengampuId, guruId: session.id },
      include: {
        mataPelajaran: true,
        kelasFormal: { include: { jenjang: true } },
        jurnalMengajar: {
          include: {
            absensiMapel: true
          }
        },
        nilaiSumatif: {
          where: { semesterId }
        },
        nilaiPAS: {
          where: { semesterId }
        }
      }
    })

    if (!pengampu) {
      return new NextResponse("Mata pelajaran tidak ditemukan atau Anda tidak memiliki akses", { status: 404 })
    }

    // 2. Ambil data santri di kelas tersebut
    const riwayatKelasList = await prisma.riwayatKelas.findMany({
      where: { kelasFormalId: pengampu.kelasFormalId },
      include: { santri: { select: { id: true, namaLengkap: true, nisn: true } } },
      orderBy: { santri: { namaLengkap: "asc" } }
    })

    const kkm = pengampu.kkm || 70

    // Helper functions (sama dengan di client)
    const hitungNilaiKehadiran = (santriId: number, sumatifKe: number): number | null => {
      const jurnalSumatif = pengampu.jurnalMengajar.filter(j => j.sumatifKe === sumatifKe)
      if (jurnalSumatif.length === 0) return null
      let hadir = 0, sakit = 0, izin = 0, alpa = 0
      for (const j of jurnalSumatif) {
        const absensi = j.absensiMapel.find(a => a.santriId === santriId)
        if (!absensi) { alpa++; continue }
        if (absensi.status === "HADIR") hadir++
        else if (absensi.status === "SAKIT") sakit++
        else if (absensi.status === "IZIN") izin++
        else alpa++
      }
      const total = hadir + sakit + izin + alpa
      if (total === 0) return null
      return ((hadir * 100) + (sakit * 80) + (izin * 70)) / total
    }

    const hitungRataSumatifItem = (kehadiran: number | null, kurikuler: number | null, tes: number | null): number | null => {
      if (kehadiran === null && kurikuler === null && tes === null) return null
      const k = kehadiran ?? 0; const ku = kurikuler ?? 0; const t = tes ?? 0
      return (k * 0.6) + (ku * 0.2) + (t * 0.2)
    }

    // 3. Susun data untuk Excel
    const excelData = riwayatKelasList.map((rk, index) => {
      const santri = rk.santri

      // Sumatif 1
      const ns1 = pengampu.nilaiSumatif.find(n => n.santriId === santri.id && n.sumatifKe === 1)
      const kh1 = ns1?.nilaiKehadiran ?? hitungNilaiKehadiran(santri.id, 1)
      const r1 = hitungRataSumatifItem(kh1, ns1?.nilaiKurikuler ?? null, ns1?.nilaiTesSumatif ?? null)

      // Sumatif 2
      const ns2 = pengampu.nilaiSumatif.find(n => n.santriId === santri.id && n.sumatifKe === 2)
      const kh2 = ns2?.nilaiKehadiran ?? hitungNilaiKehadiran(santri.id, 2)
      const r2 = hitungRataSumatifItem(kh2, ns2?.nilaiKurikuler ?? null, ns2?.nilaiTesSumatif ?? null)

      // Sumatif 3
      const ns3 = pengampu.nilaiSumatif.find(n => n.santriId === santri.id && n.sumatifKe === 3)
      const kh3 = ns3?.nilaiKehadiran ?? hitungNilaiKehadiran(santri.id, 3)
      const r3 = hitungRataSumatifItem(kh3, ns3?.nilaiKurikuler ?? null, ns3?.nilaiTesSumatif ?? null)

      // Rata Sumatif
      const validRata = [r1, r2, r3].filter(v => v !== null) as number[]
      const rataSumatif = validRata.length > 0 ? (validRata.reduce((a, b) => a + b, 0) / validRata.length) : null

      // PAS
      const pas = pengampu.nilaiPAS.find(n => n.santriId === santri.id)?.nilai ?? null

      // Nilai Akhir
      const nilaiAkhir = (rataSumatif === null && pas === null) ? null : ((rataSumatif ?? 0) * 0.6) + ((pas ?? 0) * 0.4)
      
      const lulus = nilaiAkhir !== null ? (nilaiAkhir >= kkm ? "Lulus" : "Belum") : "-"

      const fmt = (v: number | null) => v !== null ? Number(v.toFixed(1)) : null

      return {
        "No": index + 1,
        "Nama Santri": santri.namaLengkap,
        "NISN": santri.nisn || "-",
        "S1: Kehadiran": fmt(kh1),
        "S1: Kurikuler": fmt(ns1?.nilaiKurikuler ?? null),
        "S1: Tes": fmt(ns1?.nilaiTesSumatif ?? null),
        "Rata-rata S1": fmt(r1),
        "S2: Kehadiran": fmt(kh2),
        "S2: Kurikuler": fmt(ns2?.nilaiKurikuler ?? null),
        "S2: Tes": fmt(ns2?.nilaiTesSumatif ?? null),
        "Rata-rata S2": fmt(r2),
        "S3: Kehadiran": fmt(kh3),
        "S3: Kurikuler": fmt(ns3?.nilaiKurikuler ?? null),
        "S3: Tes": fmt(ns3?.nilaiTesSumatif ?? null),
        "Rata-rata S3": fmt(r3),
        "Rata-rata Sumatif": fmt(rataSumatif),
        "Nilai PAS": fmt(pas),
        "Nilai Akhir": fmt(nilaiAkhir),
        "Status": lulus,
      }
    })

    // 4. Buat Workbook Excel
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Set lebar kolom agar rapi
    const wscols = [
      { wch: 5 },  // No
      { wch: 30 }, // Nama
      { wch: 15 }, // NISN
      { wch: 12 }, // S1 KH
      { wch: 12 }, // S1 Kur
      { wch: 12 }, // S1 Tes
      { wch: 12 }, // Rata S1
      { wch: 12 }, // S2 KH
      { wch: 12 }, // S2 Kur
      { wch: 12 }, // S2 Tes
      { wch: 12 }, // Rata S2
      { wch: 12 }, // S3 KH
      { wch: 12 }, // S3 Kur
      { wch: 12 }, // S3 Tes
      { wch: 12 }, // Rata S3
      { wch: 15 }, // Rata Sumatif
      { wch: 12 }, // PAS
      { wch: 12 }, // Akhir
      { wch: 10 }, // Status
    ]
    ws['!cols'] = wscols

    XLSX.utils.book_append_sheet(wb, ws, "Rekap Nilai")

    // 5. Ubah ke Buffer dan return
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

    const fileName = `Rekap_Nilai_${pengampu.mataPelajaran.nama}_${pengampu.kelasFormal.namaKelas}.xlsx`.replace(/[^a-zA-Z0-9_.-]/g, '_')

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }
    })

  } catch (error: any) {
    console.error("Ekspor Error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
