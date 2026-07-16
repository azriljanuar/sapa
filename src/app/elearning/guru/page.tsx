import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { BookOpen, Users, Clock, ArrowRight, CheckCircle2 } from "lucide-react"

export default async function GuruDashboard() {
  const session = await getSession()
  
  // Get active TA (the latest one since we removed isActive)
  const activeTA = await prisma.tahunAjaran.findFirst({ orderBy: { nama: 'desc' }, include: { semester: true } })
  const activeSem = activeTA?.semester[0] // just pick one or get the active one logically if needed

  // Get subjects taught by this guru
  const pengampu = await prisma.pengampuMataPelajaran.findMany({
    where: { 
      guruId: session?.id,
      tahunAjaranId: activeTA?.id
    },
    include: {
      mataPelajaran: {
        include: { jenjang: true }
      },
      kelasFormal: true,
      _count: {
        select: { jurnalMengajar: true, tugas: true, materiBelajar: true }
      }
    }
  })

  // Get today's attendance status
  const todayStr = new Date().toISOString().split("T")[0]
  const today = new Date(todayStr)
  const kehadiranToday = await prisma.kehadiranGuru.findUnique({
    where: {
      guruId_tanggal: {
        guruId: session?.id!,
        tanggal: today
      }
    }
  })

  return (
    <div className="space-y-8">
      {/* Welcome & Quick Actions */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Selamat datang, {session?.email}! 👋</h2>
          <p className="text-slate-500 mt-1">Ini adalah pusat aktivitas mengajar Anda untuk Tahun Ajaran {activeTA?.nama}.</p>
        </div>
        <div className="flex gap-3">
          {kehadiranToday ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-5 w-5" />
              Telah Mengisi Absen ({kehadiranToday.status})
            </div>
          ) : (
            <Link href="/elearning/guru/absensi" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition flex items-center shadow-sm">
              Isi Kehadiran Harian
            </Link>
          )}
        </div>
      </div>

      {/* Class List */}
      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-indigo-600" /> Kelas Yang Anda Ampu
        </h3>
        
        {pengampu.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-500">
            Anda belum ditugaskan mengajar mata pelajaran apa pun di Tahun Ajaran ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pengampu.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                      {p.mataPelajaran.jenjang.singkatan}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                      {p.kelasFormal.namaKelas}
                    </span>
                  </div>
                  
                  <h4 className="text-lg font-bold text-slate-900 mb-1 leading-tight group-hover:text-indigo-600 transition-colors">
                    {p.mataPelajaran.nama}
                  </h4>
                  
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-4 border-slate-100">
                    <div className="text-center">
                      <div className="text-lg font-bold text-slate-700">{p._count.materiBelajar}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Materi</div>
                    </div>
                    <div className="text-center border-l border-r border-slate-100">
                      <div className="text-lg font-bold text-slate-700">{p._count.tugas}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Tugas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-slate-700">{p._count.jurnalMengajar}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Jurnal</div>
                    </div>
                  </div>
                </div>
                
                <Link href={`/elearning/guru/kelas/${p.id}`} className="bg-slate-50 p-3 text-center text-sm font-semibold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center justify-center gap-1">
                  Masuk Kelas <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
