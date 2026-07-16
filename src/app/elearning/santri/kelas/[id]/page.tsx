import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, BookOpen, FileText, DownloadCloud, FileVideo, File } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function KelasDetailSantri({ params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== "SANTRI") redirect("/login")

  const pengampuId = parseInt(params.id)
  
  const pengampu = await prisma.pengampuMataPelajaran.findUnique({
    where: { id: pengampuId },
    include: {
      mataPelajaran: { include: { jenjang: true } },
      guru: true,
      kelasFormal: true,
      materiBelajar: { orderBy: { createdAt: 'desc' } },
      tugas: { 
        orderBy: { createdAt: 'desc' },
        include: {
          pengumpulan: {
            where: { santriId: session.id }
          }
        }
      }
    }
  })

  if (!pengampu) notFound()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/elearning/santri" className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100 transition">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              Oleh: {pengampu.guru.nama}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            {pengampu.mataPelajaran.nama}
          </h1>
        </div>
      </div>

      <Tabs defaultValue="materi" className="w-full">
        <TabsList className="bg-white border shadow-sm rounded-xl p-1 h-auto flex flex-wrap mb-6">
          <TabsTrigger value="materi" className="rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white py-2.5 px-4"><BookOpen className="w-4 h-4 mr-2" /> Materi Pelajaran</TabsTrigger>
          <TabsTrigger value="tugas" className="rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white py-2.5 px-4"><FileText className="w-4 h-4 mr-2" /> Tugas & Latihan</TabsTrigger>
        </TabsList>

        <TabsContent value="materi" className="space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-lg text-slate-800">Daftar Materi</h3>
            <p className="text-sm text-slate-500">Pelajari materi yang telah diberikan oleh ustadz/ustadzah.</p>
          </div>

          {pengampu.materiBelajar.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500">
              Belum ada materi yang dibagikan.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {pengampu.materiBelajar.map(m => (
                <div key={m.id} className="bg-white rounded-xl border shadow-sm p-5 flex flex-col justify-between group hover:shadow-md transition">
                  <div className="flex gap-4 mb-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                      m.tipe === "VIDEO" ? "bg-red-100 text-red-600" :
                      m.tipe === "DOKUMEN" ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"
                    }`}>
                      {m.tipe === "VIDEO" ? <FileVideo className="h-6 w-6"/> : <File className="h-6 w-6"/>}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 line-clamp-2 leading-tight">{m.judul}</h4>
                      <div className="text-[10px] text-slate-400 mt-1 font-medium bg-slate-100 px-2 py-0.5 rounded inline-block">
                        Diunggah: {m.createdAt.toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-4 line-clamp-3">{m.deskripsi}</p>
                  
                  <button className="w-full bg-slate-50 hover:bg-emerald-50 text-emerald-600 border border-slate-100 hover:border-emerald-200 font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition">
                    <DownloadCloud className="w-4 h-4" /> Buka Materi
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tugas" className="space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-lg text-slate-800">Tugas yang harus dikerjakan</h3>
          </div>

          <div className="space-y-4">
            {pengampu.tugas.length === 0 ? (
               <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500">
                Belum ada penugasan dari guru.
              </div>
            ) : (
              pengampu.tugas.map(t => {
                const isSubmitted = t.pengumpulan.length > 0
                const pengumpulan = isSubmitted ? t.pengumpulan[0] : null
                
                return (
                  <div key={t.id} className="bg-white p-5 rounded-xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">{t.judul}</h4>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">{t.deskripsi}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded">
                          Tenggat: {t.tenggatWaktu ? new Date(t.tenggatWaktu).toLocaleDateString('id-ID') : 'Tanpa Batas'}
                        </span>
                        {isSubmitted ? (
                          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                            Telah Dikumpulkan
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                            Belum Dikerjakan
                          </span>
                        )}
                        {pengumpulan?.nilai != null && (
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            Nilai: {pengumpulan.nilai}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link href={`/elearning/santri/tugas/${t.id}`} className="shrink-0">
                      <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg transition text-sm">
                        {isSubmitted ? "Lihat Penilaian" : "Kumpulkan Tugas"}
                      </button>
                    </Link>
                  </div>
                )
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
