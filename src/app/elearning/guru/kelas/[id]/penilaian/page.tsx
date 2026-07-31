import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, BarChart3, AlertCircle } from "lucide-react"

export default async function PenilaianPage({ params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== "GURU") redirect("/login")

  const pengampuId = parseInt(params.id)
  
  const pengampu = await prisma.pengampuMataPelajaran.findUnique({
    where: { id: pengampuId, guruId: session.id },
    include: {
      mataPelajaran: { include: { jenjang: true } },
      kelasFormal: { include: { anggota: { include: { santri: true } } } },
    }
  })

  if (!pengampu) notFound()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/elearning/guru/kelas/${pengampuId}`} className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100 transition">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
              Penilaian Akhir
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            {pengampu.mataPelajaran.nama}
          </h1>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
        <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-amber-800 text-lg">Halaman Penilaian Masih Dalam Tahap Diskusi</h3>
          <p className="text-amber-700 mt-1 text-sm">
            Saat ini antarmuka halaman sudah disiapkan, namun sistem dan skema penilaian (contoh: perhitungan persentase harian, UTS, UAS, dll) belum diaktifkan. Harap diskusikan skema yang diinginkan terlebih dahulu dengan developer.
          </p>
        </div>
      </div>

      {/* Mock Table UI */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden opacity-60 pointer-events-none select-none">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Rekap Nilai Santri
          </h3>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
            Simpan Nilai
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Nama Santri</th>
                <th className="px-6 py-4 font-semibold text-center w-28">Nilai Tugas</th>
                <th className="px-6 py-4 font-semibold text-center w-28">Nilai UTS</th>
                <th className="px-6 py-4 font-semibold text-center w-28">Nilai UAS</th>
                <th className="px-6 py-4 font-semibold text-center w-28">Nilai Akhir</th>
              </tr>
            </thead>
            <tbody>
              {pengampu.kelasFormal.anggota.slice(0, 5).map((a, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-800">{a.santri.namaLengkap}</td>
                  <td className="px-6 py-3">
                    <input type="text" disabled className="w-full h-9 bg-slate-100 border border-slate-200 rounded-md text-center" placeholder="-" />
                  </td>
                  <td className="px-6 py-3">
                    <input type="text" disabled className="w-full h-9 bg-slate-100 border border-slate-200 rounded-md text-center" placeholder="-" />
                  </td>
                  <td className="px-6 py-3">
                    <input type="text" disabled className="w-full h-9 bg-slate-100 border border-slate-200 rounded-md text-center" placeholder="-" />
                  </td>
                  <td className="px-6 py-3 text-center font-bold text-slate-400">
                    -
                  </td>
                </tr>
              ))}
              {pengampu.kelasFormal.anggota.length > 5 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-slate-400 text-xs italic">
                    ... dan {pengampu.kelasFormal.anggota.length - 5} santri lainnya
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
