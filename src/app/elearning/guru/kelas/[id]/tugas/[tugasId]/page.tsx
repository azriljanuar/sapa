import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Clock } from "lucide-react"
import { NilaiForm } from "./client-components"

export default async function PenugasanDetail({ params }: { params: { id: string, tugasId: string } }) {
  const session = await getSession()
  if (!session || session.role !== "GURU") redirect("/login")

  const pengampuId = parseInt(params.id)
  const tugasId = parseInt(params.tugasId)
  
  const tugas = await prisma.tugas.findUnique({
    where: { id: tugasId, pengampuId },
    include: {
      pengampu: {
        include: {
          kelasFormal: {
            include: {
              anggota: {
                include: { santri: true }
              }
            }
          }
        }
      },
      pengumpulan: {
        include: { santri: true }
      }
    }
  })

  if (!tugas) notFound()

  // Gabungkan data santri dengan data pengumpulan
  const anggotaKelas = tugas.pengampu.kelasFormal.anggota
  const rekapan = anggotaKelas.map(a => {
    const pengumpulan = tugas.pengumpulan.find(p => p.santriId === a.santriId)
    return {
      santri: a.santri,
      pengumpulan: pengumpulan || null
    }
  }).sort((a, b) => a.santri.namaLengkap.localeCompare(b.santri.namaLengkap))

  const terkumpul = tugas.pengumpulan.length
  const total = anggotaKelas.length

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/elearning/guru/kelas/${pengampuId}`} className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100 transition">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{tugas.judul}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pengumpulan Tugas • Kelas {tugas.pengampu.kelasFormal.namaKelas}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border shadow-sm">
            <h3 className="font-semibold text-lg border-b border-slate-100 pb-3 mb-4">Daftar Pengumpulan</h3>
            
            <div className="space-y-4">
              {rekapan.map((item) => (
                <div key={item.santri.id} className={`p-4 rounded-xl border ${item.pengumpulan ? 'bg-slate-50 border-emerald-100' : 'bg-white border-slate-100'}`}>
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-800">{item.santri.namaLengkap}</h4>
                        {item.pengumpulan ? (
                          <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Mengumpulkan
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3 mr-1" /> Belum
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">NISN: {item.santri.nisn}</p>
                    </div>

                    {item.pengumpulan && (
                      <div className="text-right">
                        <div className="text-xs text-slate-500 mb-2">
                          Diserahkan: {new Date(item.pengumpulan.waktuKumpul).toLocaleString('id-ID')}
                        </div>
                        {item.pengumpulan.nilai !== null ? (
                          <div className="text-lg font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg inline-block border border-indigo-100">
                            Nilai: {item.pengumpulan.nilai}
                          </div>
                        ) : (
                          <NilaiForm pengumpulanId={item.pengumpulan.id} />
                        )}
                      </div>
                    )}
                  </div>
                  
                  {item.pengumpulan?.catatanSantri && (
                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Jawaban / Teks:</p>
                      <div className="bg-white p-3 rounded-lg text-sm text-slate-700 border shadow-inner whitespace-pre-wrap">
                        {item.pengumpulan.catatanSantri}
                      </div>
                    </div>
                  )}

                  {item.pengumpulan?.fileUrl && (
                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <p className="text-xs font-semibold text-slate-400 uppercase mb-2">File Lampiran:</p>
                      <a href={item.pengumpulan.fileUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-indigo-600 hover:underline">
                        Lihat Dokumen
                      </a>
                    </div>
                  )}
                  
                  {item.pengumpulan?.keteranganGuru && (
                    <div className="mt-4 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                      <p className="text-xs font-semibold text-indigo-800 mb-1">Komentar Guru:</p>
                      <p className="text-sm text-indigo-900">{item.pengumpulan.keteranganGuru}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border shadow-sm">
            <h3 className="font-semibold text-lg border-b border-slate-100 pb-3 mb-4">Statistik</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <p className="text-sm font-medium text-emerald-800 mb-1">Terkumpul</p>
                <p className="text-3xl font-bold text-emerald-700">{terkumpul}</p>
              </div>
              <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                <p className="text-sm font-medium text-rose-800 mb-1">Belum</p>
                <p className="text-3xl font-bold text-rose-700">{total - terkumpul}</p>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100">
              <p className="text-sm text-slate-500 mb-2">Total Santri di Kelas: <strong className="text-slate-800">{total}</strong></p>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${(terkumpul/total)*100}%` }}></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border shadow-sm">
            <h3 className="font-semibold text-lg border-b border-slate-100 pb-3 mb-4">Detail Tugas</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-slate-500">Tenggat Waktu</p>
                <p className="font-semibold text-slate-800">
                  {tugas.tenggatWaktu ? new Date(tugas.tenggatWaktu).toLocaleString('id-ID') : 'Tidak ada batas waktu'}
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-500">Instruksi</p>
                <p className="text-slate-700 mt-1 whitespace-pre-wrap">{tugas.deskripsi}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
