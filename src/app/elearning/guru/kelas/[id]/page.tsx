import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, BookOpen, FileText, CheckSquare, Plus, FileVideo, File } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function KelasDetailGuru({ params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== "GURU") redirect("/login")

  const pengampuId = parseInt(params.id)
  
  const pengampu = await prisma.pengampuMataPelajaran.findUnique({
    where: { id: pengampuId, guruId: session.id },
    include: {
      mataPelajaran: { include: { jenjang: true } },
      kelasFormal: { include: { anggota: { include: { santri: true } } } },
      materiBelajar: { orderBy: { createdAt: 'desc' } },
      tugas: { orderBy: { createdAt: 'desc' }, include: { _count: { select: { pengumpulan: true } } } },
      jurnalMengajar: { orderBy: { tanggal: 'desc' }, include: { absensiMapel: true } }
    }
  })

  if (!pengampu) notFound()

  const totalSantri = pengampu.kelasFormal.anggota.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/elearning/guru" className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100 transition">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
              {pengampu.mataPelajaran.jenjang.singkatan}
            </span>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              {pengampu.kelasFormal.namaKelas}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            {pengampu.mataPelajaran.nama}
          </h1>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="jurnal" className="w-full">
        <TabsList className="bg-white border shadow-sm rounded-xl p-1 h-auto flex flex-wrap mb-6">
          <TabsTrigger value="jurnal" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white py-2.5 px-4"><CheckSquare className="w-4 h-4 mr-2" /> Jurnal & Absensi</TabsTrigger>
          <TabsTrigger value="materi" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white py-2.5 px-4"><BookOpen className="w-4 h-4 mr-2" /> Materi Belajar</TabsTrigger>
          <TabsTrigger value="tugas" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white py-2.5 px-4"><FileText className="w-4 h-4 mr-2" /> Penugasan</TabsTrigger>
        </TabsList>

        <TabsContent value="jurnal" className="space-y-6">
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div>
              <h3 className="font-bold text-lg text-slate-800">Jurnal Mengajar</h3>
              <p className="text-sm text-slate-500">Catat materi yang diajarkan dan absensi siswa per pertemuan.</p>
            </div>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center text-sm shadow-sm">
              <Plus className="w-4 h-4 mr-1"/> Buat Jurnal Baru
            </button>
          </div>

          {pengampu.jurnalMengajar.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500">
              Belum ada catatan jurnal mengajar.
            </div>
          ) : (
            <div className="space-y-4">
              {pengampu.jurnalMengajar.map(jurnal => {
                const hadir = jurnal.absensiMapel.filter(a => a.status === "HADIR").length
                const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
                return (
                  <div key={jurnal.id} className="bg-white p-5 rounded-xl border shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md inline-block">
                        {new Date(jurnal.tanggal).toLocaleDateString('id-ID', dateOptions)}
                      </div>
                      <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                        Hadir: {hadir}/{totalSantri} Santri
                      </div>
                    </div>
                    <h4 className="font-bold text-slate-800 text-lg">{jurnal.materi}</h4>
                    {jurnal.catatan && <p className="text-slate-600 text-sm mt-2">{jurnal.catatan}</p>}
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="materi" className="space-y-6">
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div>
              <h3 className="font-bold text-lg text-slate-800">Materi Belajar</h3>
              <p className="text-sm text-slate-500">Unggah modul, video, atau bahan bacaan untuk santri.</p>
            </div>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center text-sm shadow-sm">
              <Plus className="w-4 h-4 mr-1"/> Tambah Materi
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {pengampu.materiBelajar.map(m => (
              <div key={m.id} className="bg-white rounded-xl border shadow-sm p-5 flex gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                  m.tipe === "VIDEO" ? "bg-red-100 text-red-600" :
                  m.tipe === "DOKUMEN" ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"
                }`}>
                  {m.tipe === "VIDEO" ? <FileVideo className="h-6 w-6"/> : <File className="h-6 w-6"/>}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 line-clamp-1">{m.judul}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{m.deskripsi}</p>
                  <div className="text-[10px] text-slate-400 mt-3 font-medium">Diunggah: {m.createdAt.toLocaleDateString('id-ID')}</div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tugas" className="space-y-6">
           <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div>
              <h3 className="font-bold text-lg text-slate-800">Penugasan</h3>
              <p className="text-sm text-slate-500">Berikan tugas terstruktur dan pantau pengumpulan santri.</p>
            </div>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center text-sm shadow-sm">
              <Plus className="w-4 h-4 mr-1"/> Buat Tugas
            </button>
          </div>

          <div className="space-y-4">
            {pengampu.tugas.map(t => (
              <div key={t.id} className="bg-white p-5 rounded-xl border shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h4 className="font-bold text-slate-800 text-lg hover:text-indigo-600 cursor-pointer">{t.judul}</h4>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded">
                      Tenggat: {t.tenggatWaktu ? new Date(t.tenggatWaktu).toLocaleDateString('id-ID') : 'Tanpa Batas'}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      Terkumpul: <b className="text-slate-800">{t._count.pengumpulan}</b>/{totalSantri}
                    </span>
                  </div>
                </div>
                <button className="text-indigo-600 text-sm font-semibold hover:underline">
                  Lihat Pengumpulan
                </button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
