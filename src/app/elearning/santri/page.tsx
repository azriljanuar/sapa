import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { redirect } from "next/navigation"
import { 
  BookOpen, FileText, ArrowRight, TrendingUp,
  GraduationCap, Star, Sparkles
} from "lucide-react"

export default async function SantriDashboard() {
  const session = await getSession()
  if (!session) redirect("/login")

  // Santri login: session.id = santri.id, session.email = santri.nisn
  const activeTA = await prisma.tahunAjaran.findFirst({ 
    orderBy: { nama: 'desc' }, 
    include: { semester: true } 
  })

  const riwayatKelas = await prisma.riwayatKelas.findFirst({
    where: { 
      santriId: session.id,        // session.id = santri.id untuk SANTRI login
      kelasFormal: {
        tahunAjaranId: activeTA?.id
      }
    },
    include: {
      kelasFormal: {
        include: {
          pengampu: {
            include: {
              mataPelajaran: true,
              guru: true,
              _count: {
                select: { materiBelajar: true, tugas: true }
              }
            }
          }
        }
      }
    }
  })

  // Ambil nama lengkap santri
  const santri = await prisma.santri.findUnique({ where: { id: session.id } })

  const kelas = riwayatKelas?.kelasFormal
  const pengampuList = kelas?.pengampu || []
  const totalMateri = pengampuList.reduce((a, p) => a + p._count.materiBelajar, 0)
  const totalTugas = pengampuList.reduce((a, p) => a + p._count.tugas, 0)

  const namaSantri = santri?.namaLengkap || session.email

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-8 md:p-10 text-white overflow-hidden shadow-xl">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -right-10 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/20 rounded-full blur-3xl" />
          <Sparkles className="absolute top-6 right-6 h-24 w-24 text-white/5" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
              <span className="text-emerald-200 text-sm font-medium">Semangat belajar hari ini!</span>
            </div>
            <h2 className="text-3xl font-extrabold mb-2">Halo, {namaSantri}! 🚀</h2>
            <p className="text-emerald-200/80 max-w-md">
              Kelas: <strong className="text-white">{kelas ? kelas.namaKelas : 'Belum ada kelas'}</strong>
              {" · "}TA: <strong className="text-white">{activeTA?.nama || '-'}</strong>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link 
              href="/elearning/santri/tugas" 
              className="bg-white text-emerald-700 hover:bg-emerald-50 px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-md"
            >
              <FileText className="h-4 w-4" />
              Tugas Saya ({totalTugas})
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Mata Pelajaran", value: pengampuList.length, icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Total Materi", value: totalMateri, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Tugas", value: totalTugas, icon: FileText, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Guru Pengajar", value: pengampuList.length, icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-50" },
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

      {/* Mata Pelajaran List */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-600" />
            Mata Pelajaran Kamu
          </h3>
          <span className="text-sm text-slate-400">{pengampuList.length} mapel</span>
        </div>

        {pengampuList.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center shadow-sm">
            <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Belum ada mata pelajaran di kelas kamu</p>
            <p className="text-slate-400 text-sm mt-1">Hubungi admin jika ini terjadi kesalahan</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pengampuList.map((p) => (
              <div key={p.id} className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex flex-col overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
                
                <div className="h-24 bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20">
                    <BookOpen className="absolute -bottom-4 -right-4 h-20 w-20 text-emerald-300" />
                  </div>
                  <div className="relative z-10 h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-md">
                    <BookOpen className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
                    Oleh: {p.guru.nama}
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-4 leading-tight group-hover:text-emerald-600 transition-colors">
                    {p.mataPelajaran.nama}
                  </h4>
                  
                  <div className="mt-auto grid grid-cols-2 gap-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="text-center">
                      <div className="text-xl font-extrabold text-slate-700">{p._count.materiBelajar}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">Materi</div>
                    </div>
                    <div className="text-center border-l border-slate-200">
                      <div className="text-xl font-extrabold text-orange-600">{p._count.tugas}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">Tugas</div>
                    </div>
                  </div>
                </div>

                <Link 
                  href={`/elearning/santri/kelas/${p.id}`} 
                  className="flex items-center justify-center gap-2 py-3.5 text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors border-t border-emerald-100"
                >
                  Lihat Materi <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
