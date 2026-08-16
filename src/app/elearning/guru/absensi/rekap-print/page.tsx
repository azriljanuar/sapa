import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import Image from "next/image"
import PrintButton from "./print-button"

export default async function PrintRekapGuru({
  searchParams
}: {
  searchParams: { pengampuId?: string, semesterId?: string }
}) {
  const session = await getSession()
  if (!session || session.role !== "GURU") {
    redirect("/login")
  }

  const pengampuIdStr = searchParams.pengampuId
  const semesterIdStr = searchParams.semesterId

  if (!pengampuIdStr || !semesterIdStr) {
    return <div>Missing parameters</div>
  }

  const pengampuId = parseInt(pengampuIdStr)
  const semesterId = parseInt(semesterIdStr)

  const pengampu = await prisma.pengampuMataPelajaran.findUnique({
    where: { id: pengampuId, guruId: session.id },
    include: {
      mataPelajaran: true,
      kelasFormal: { include: { jenjang: true } },
      guru: true,
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
    return <div>Mata pelajaran tidak ditemukan atau Anda tidak memiliki akses</div>
  }

  const riwayatKelasList = await prisma.riwayatKelas.findMany({
    where: { kelasFormalId: pengampu.kelasFormalId },
    include: { santri: { select: { id: true, namaLengkap: true, nisn: true } } },
    orderBy: { santri: { namaLengkap: "asc" } }
  })

  const kkm = pengampu.kkm || 70

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

  const getRataSumatif = (santriId: number): number | null => {
    const r1 = hitungRataSumatifItem(
      hitungNilaiKehadiran(santriId, 1),
      pengampu.nilaiSumatif.find(n => n.santriId === santriId && n.sumatifKe === 1)?.nilaiKurikuler ?? null,
      pengampu.nilaiSumatif.find(n => n.santriId === santriId && n.sumatifKe === 1)?.nilaiTesSumatif ?? null
    )
    const r2 = hitungRataSumatifItem(
      hitungNilaiKehadiran(santriId, 2),
      pengampu.nilaiSumatif.find(n => n.santriId === santriId && n.sumatifKe === 2)?.nilaiKurikuler ?? null,
      pengampu.nilaiSumatif.find(n => n.santriId === santriId && n.sumatifKe === 2)?.nilaiTesSumatif ?? null
    )
    const r3 = hitungRataSumatifItem(
      hitungNilaiKehadiran(santriId, 3),
      pengampu.nilaiSumatif.find(n => n.santriId === santriId && n.sumatifKe === 3)?.nilaiKurikuler ?? null,
      pengampu.nilaiSumatif.find(n => n.santriId === santriId && n.sumatifKe === 3)?.nilaiTesSumatif ?? null
    )

    const validRata = [r1, r2, r3].filter(v => v !== null) as number[]
    if (validRata.length === 0) return null
    return validRata.reduce((a, b) => a + b, 0) / validRata.length
  }

  return (
    <div className="bg-white min-h-screen text-black p-8 font-serif" style={{ width: "210mm", minHeight: "297mm", margin: "0 auto" }}>
      {/* Header Kop Surat */}
      <div className="flex items-center justify-between border-b-4 border-black pb-4 mb-6">
        <div className="flex items-center gap-6">
          <Image src="/logo.png" alt="Logo" width={90} height={90} className="object-contain" />
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wider">YAYASAN PENDIDIKAN ISLAM</h1>
            <h2 className="text-3xl font-extrabold uppercase mt-1">PONDOK PESANTREN SAPA</h2>
            <p className="text-sm mt-2 font-medium">Jl. Pesantren No. 123, Desa Sapa, Kec. Sapa, Kabupaten Sapa 12345</p>
            <p className="text-xs">Telp: (021) 1234567 | Email: info@ppsapa.sch.id | Web: www.ppsapa.sch.id</p>
          </div>
        </div>
      </div>

      <div className="text-center mb-6">
        <h3 className="text-xl font-bold underline mb-1 uppercase">REKAPITULASI NILAI AKHIR</h3>
      </div>

      <div className="flex justify-between mb-6 text-sm">
        <table className="w-1/2">
          <tbody>
            <tr><td className="w-32 py-1">Mata Pelajaran</td><td className="w-4">:</td><td className="font-semibold">{pengampu.mataPelajaran.nama}</td></tr>
            <tr><td className="py-1">Kelas</td><td>:</td><td className="font-semibold">{pengampu.kelasFormal.namaKelas}</td></tr>
            <tr><td className="py-1">KKM</td><td>:</td><td className="font-semibold">{kkm}</td></tr>
          </tbody>
        </table>
        <table className="w-1/2">
          <tbody>
            <tr><td className="w-24 py-1">Guru</td><td className="w-4">:</td><td className="font-semibold">{pengampu.guru.nama}</td></tr>
          </tbody>
        </table>
      </div>

      <table className="w-full text-sm border-collapse border border-black mb-10">
        <thead>
          <tr className="bg-gray-100 print:bg-gray-100">
            <th className="border border-black px-2 py-2 w-10">No</th>
            <th className="border border-black px-3 py-2 text-left">Nama Santri</th>
            <th className="border border-black px-2 py-2">NISN</th>
            <th className="border border-black px-2 py-2">Rata<br/>Sumatif</th>
            <th className="border border-black px-2 py-2">PAS</th>
            <th className="border border-black px-2 py-2">Nilai<br/>Akhir</th>
            <th className="border border-black px-2 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {riwayatKelasList.map((rk, i) => {
            const rataSumatif = getRataSumatif(rk.santri.id)
            const pas = pengampu.nilaiPAS.find(n => n.santriId === rk.santri.id)?.nilai ?? null
            const nilaiAkhir = (rataSumatif === null && pas === null) ? null : ((rataSumatif ?? 0) * 0.6) + ((pas ?? 0) * 0.4)
            const lulus = nilaiAkhir !== null && nilaiAkhir >= kkm
            const fmt = (v: number | null) => v !== null ? v.toFixed(1) : "-"

            return (
              <tr key={rk.santri.id}>
                <td className="border border-black px-2 py-1.5 text-center">{i + 1}</td>
                <td className="border border-black px-3 py-1.5">{rk.santri.namaLengkap}</td>
                <td className="border border-black px-2 py-1.5 text-center">{rk.santri.nisn || "-"}</td>
                <td className="border border-black px-2 py-1.5 text-center">{fmt(rataSumatif)}</td>
                <td className="border border-black px-2 py-1.5 text-center">{fmt(pas)}</td>
                <td className="border border-black px-2 py-1.5 text-center font-bold">{fmt(nilaiAkhir)}</td>
                <td className="border border-black px-2 py-1.5 text-center">{nilaiAkhir !== null ? (lulus ? "Lulus" : "Belum") : "-"}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="flex justify-end mt-12 pr-12">
        <div className="text-center">
          <p className="mb-16">Sapa, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Guru Mata Pelajaran</p>
          <p className="font-bold underline">{pengampu.guru.nama}</p>
        </div>
      </div>

      <PrintButton />
    </div>
  )
}
