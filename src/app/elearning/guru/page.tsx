import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { redirect } from "next/navigation"
import { 
  BookOpen, ArrowRight, CheckCircle2, 
  FileText, BarChart3, ClipboardList,
  TrendingUp, Calendar, AlertCircle, Users
} from "lucide-react"

export default async function GuruDashboard() {
  const session = await getSession()
  if (!session) redirect("/login")

  // Guru login: session.id = guru.id, session.email = guru.email
  const activeTA = await prisma.tahunAjaran.findFirst({ 
    orderBy: { nama: 'desc' }, 
    include: { semester: true } 
  })

  const pengampu = await prisma.pengampuMataPelajaran.findMany({
    where: { 
      guruId: session.id,        // session.id IS guru.id (see login/actions.ts)
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

  const todayStr = new Date().toISOString().split("T")[0]
  const today = new Date(todayStr)
  const kehadiranToday = await prisma.kehadiranGuru.findUnique({
    where: {
      guruId_tanggal: {
        guruId: session.id,     // session.id IS guru.id
        tanggal: today
      }
    }
  })

  const totalMateri = pengampu.reduce((a, p) => a + p._count.materiBelajar, 0)
  const totalTugas = pengampu.reduce((a, p) => a + p._count.tugas, 0)
  const totalJurnal = pengampu.reduce((a, p) => a + p._count.jurnalMengajar, 0)

  // Ambil nama lengkap guru dari database
  const guru = await prisma.guru.findUnique({ where: { id: session.id } })
  const namaGuru = guru?.nama || session.email.split('@')[0]

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-3xl p-8 md:p-10 text-white overflow-hidden shadow-xl">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -right-10 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/20 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <p className="text-indigo-200 text-sm font-medium mb-2">Selamat datang kembali 👋</p>
            <h2 className="text-3xl font-extrabold mb-2">{namaGuru}</h2>
            <p className="text-indigo-200/80">
              Tahun Ajaran <strong className="text-white">{activeTA?.nama || '-'}</strong> &middot; {pengampu.length} Kelas Aktif
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {kehadiranToday ? (
              <div className="bg-emerald-400/20 border border-emerald-300/40 text-emerald-100 px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold text-sm backdrop-blur-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                Absen Terisi — {kehadiranToday.status}
              </div>
            ) : (
              <Link 
                href="/elearning/guru/absensi" 
                className="bg-white text-indigo-700 hover:bg-indigo-50 px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-md"
              >
                <AlertCircle className="h-4 w-4 text-orange-500" />
                Isi Absensi Hari Ini
              </Link>
            )}
            <Link 
              href="/elearning/guru/absensi" 
              className="bg-white/15 border border-white/25 backdrop-blur-sm text-white hover:bg-white/25 px-5 py-2.5 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Riwayat Absensi
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Kelas", value: pengampu.length, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Materi Dibuat", value: totalMateri, icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Tugas Diberikan", value: totalTugas, icon: FileText, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Entri Jurnal", value: totalJurnal, icon: ClipboardList, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all">
            <div className={`h-10 w-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="text-3xl font-extrabold text-slate-800">{stat.value}</div>
            <div className="text-sm text-slate-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Class List */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            Kelas Yang Anda Ampu
          </h3>
          <span className="text-sm text-slate-400">{pengampu.length} kelas ditemukan</span>
        </div>
        
        {pengampu.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center shadow-sm">
            <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Anda belum ditugaskan mengajar mata pelajaran apapun</p>
            <p className="text-slate-400 text-sm mt-1">di Tahun Ajaran {activeTA?.nama || 'ini'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pengampu.map((p) => (
              <div key={p.id} className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex flex-col overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
                
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                      {p.mataPelajaran.jenjang.singkatan}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {p.kelasFormal.namaKelas}
                    </span>
                  </div>
                  
                  <h4 className="text-lg font-bold text-slate-900 mb-4 leading-tight group-hover:text-indigo-600 transition-colors">
                    {p.mataPelajaran.nama}
                  </h4>
                  
                  <div className="mt-auto grid grid-cols-3 gap-1 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="text-center">
                      <div className="text-xl font-extrabold text-slate-700">{p._count.materiBelajar}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">Materi</div>
                    </div>
                    <div className="text-center border-l border-r border-slate-200">
                      <div className="text-xl font-extrabold text-slate-700">{p._count.tugas}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">Tugas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-extrabold text-slate-700">{p._count.jurnalMengajar}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">Jurnal</div>
                    </div>
                  </div>
                </div>
                
                <Link 
                  href={`/elearning/guru/kelas/${p.id}`} 
                  className="flex items-center justify-center gap-2 py-3.5 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors border-t border-indigo-100 group-hover:text-indigo-700"
                >
                  Masuk Kelas <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
