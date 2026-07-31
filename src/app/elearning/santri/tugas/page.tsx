import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { FileText, Clock, CheckCircle2, AlertCircle, BookOpen } from "lucide-react"

export default async function SantriTugasListPage() {
  const session = await getSession()
  if (!session || session.role !== "SANTRI") redirect("/login")

  // Cari kelas aktif santri
  const activeTA = await prisma.tahunAjaran.findFirst({ orderBy: { nama: "desc" } })

  const riwayatKelas = await prisma.riwayatKelas.findFirst({
    where: {
      santriId: session.id,
      kelasFormal: { tahunAjaranId: activeTA?.id }
    },
    include: {
      kelasFormal: {
        include: {
          pengampu: {
            include: {
              mataPelajaran: true,
              tugas: {
                orderBy: { createdAt: "desc" },
                include: {
                  pengumpulan: {
                    where: { santriId: session.id }
                  }
                }
              }
            }
          }
        }
      }
    }
  })

  const allTugas = riwayatKelas?.kelasFormal.pengampu.flatMap(p =>
    p.tugas.map(t => ({ ...t, mapel: p.mataPelajaran.nama }))
  ) ?? []

  const belumDikerjakan = allTugas.filter(t => t.pengumpulan.length === 0)
  const sudahDikumpulkan = allTugas.filter(t => t.pengumpulan.length > 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FileText className="h-6 w-6 text-emerald-600" />
          Tugas Saya
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Semua tugas dari seluruh mata pelajaran kamu
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-center">
          <div className="text-3xl font-extrabold text-orange-600">{belumDikerjakan.length}</div>
          <div className="text-xs text-orange-500 font-semibold mt-1 uppercase tracking-wide">Belum Dikerjakan</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
          <div className="text-3xl font-extrabold text-emerald-600">{sudahDikumpulkan.length}</div>
          <div className="text-xs text-emerald-500 font-semibold mt-1 uppercase tracking-wide">Sudah Dikumpulkan</div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
          <div className="text-3xl font-extrabold text-blue-600">{allTugas.length}</div>
          <div className="text-xs text-blue-500 font-semibold mt-1 uppercase tracking-wide">Total Tugas</div>
        </div>
      </div>

      {allTugas.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Belum ada tugas yang diberikan</p>
          <p className="text-slate-400 text-sm mt-1">Tugas dari guru akan muncul di sini</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Belum dikerjakan */}
          {belumDikerjakan.length > 0 && (
            <div>
              <h3 className="text-base font-bold text-slate-700 flex items-center gap-2 mb-3">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                Perlu Dikerjakan ({belumDikerjakan.length})
              </h3>
              <div className="space-y-3">
                {belumDikerjakan.map(t => (
                  <div key={t.id} className="bg-white rounded-xl border border-orange-100 shadow-sm p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mb-2 inline-block">
                        <BookOpen className="h-3 w-3 inline mr-1" />{t.mapel}
                      </div>
                      <h4 className="font-bold text-slate-800">{t.judul}</h4>
                      {t.deskripsi && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{t.deskripsi}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="h-3.5 w-3.5 text-rose-500" />
                        <span className="text-xs font-semibold text-rose-600">
                          Tenggat: {t.tenggatWaktu ? new Date(t.tenggatWaktu).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Tanpa Batas'}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/elearning/santri/tugas/${t.id}`}
                      className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl transition shadow-sm text-sm"
                    >
                      Kumpulkan
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sudah dikumpulkan */}
          {sudahDikumpulkan.length > 0 && (
            <div>
              <h3 className="text-base font-bold text-slate-700 flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Sudah Dikumpulkan ({sudahDikumpulkan.length})
              </h3>
              <div className="space-y-3">
                {sudahDikumpulkan.map(t => {
                  const pengumpulan = t.pengumpulan[0]
                  return (
                    <div key={t.id} className="bg-white rounded-xl border border-emerald-100 shadow-sm p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 opacity-80">
                      <div>
                        <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mb-2 inline-block">
                          <BookOpen className="h-3 w-3 inline mr-1" />{t.mapel}
                        </div>
                        <h4 className="font-bold text-slate-700">{t.judul}</h4>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                            ✓ Dikumpulkan
                          </span>
                          {pengumpulan?.nilai != null && (
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              Nilai: {pengumpulan.nilai}
                            </span>
                          )}
                          {pengumpulan?.nilai == null && (
                            <span className="text-xs text-slate-400">Menunggu penilaian</span>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/elearning/santri/tugas/${t.id}`}
                        className="shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold px-5 py-2.5 rounded-xl transition text-sm"
                      >
                        Lihat Detail
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
