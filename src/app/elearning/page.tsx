import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { 
  BookOpen, GraduationCap, ArrowRight, ArrowLeft, 
  Users, FileText, CheckSquare, BarChart3, 
  ClipboardList, Layers, Star, Clock
} from "lucide-react"

export default async function ELearningPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  // Auto-redirect based on role
  if (session.role === "GURU") {
    redirect("/elearning/guru")
  }
  if (session.role === "SANTRI") {
    redirect("/elearning/santri")
  }

  // For SUPER_ADMIN and ADMIN_JENJANG: show overview page
  const features = [
    {
      icon: CheckSquare,
      title: "Absensi Harian",
      desc: "Rekam kehadiran guru & santri setiap hari secara digital, real-time, dan akurat.",
      color: "bg-blue-500",
      bgLight: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      icon: ClipboardList,
      title: "Jurnal Mengajar",
      desc: "Guru mencatat topik, metode, dan catatan per pertemuan sebagai laporan mengajar.",
      color: "bg-purple-500",
      bgLight: "bg-purple-50",
      textColor: "text-purple-600"
    },
    {
      icon: Layers,
      title: "Materi Belajar",
      desc: "Upload dan kelola materi pelajaran yang dapat diakses santri kapan saja.",
      color: "bg-emerald-500",
      bgLight: "bg-emerald-50",
      textColor: "text-emerald-600"
    },
    {
      icon: FileText,
      title: "Penugasan",
      desc: "Berikan tugas kepada santri dan kelola pengumpulan secara online.",
      color: "bg-orange-500",
      bgLight: "bg-orange-50",
      textColor: "text-orange-600"
    },
    {
      icon: BarChart3,
      title: "Penilaian",
      desc: "Input dan monitor nilai santri untuk setiap mata pelajaran dan evaluasi.",
      color: "bg-rose-500",
      bgLight: "bg-rose-50",
      textColor: "text-rose-600"
    },
    {
      icon: Users,
      title: "Absensi Mapel",
      desc: "Catat kehadiran santri per mata pelajaran dalam setiap sesi belajar.",
      color: "bg-teal-500",
      bgLight: "bg-teal-50",
      textColor: "text-teal-600"
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-400 hover:text-slate-700 transition-colors p-2 rounded-lg hover:bg-slate-100">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="h-9 w-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">SAPA E-Learning</h1>
              <p className="text-xs text-slate-400">Learning Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 hidden sm:block">Halo, <strong className="text-slate-700">{session.email}</strong></span>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {session.email.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-700 rounded-3xl overflow-hidden mb-14 shadow-2xl">
          {/* Decorative circles */}
          <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-10 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 p-10 md:p-16 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-white/20 text-white/90 text-sm font-medium px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm border border-white/20">
                <Star className="h-4 w-4 text-yellow-300" />
                Platform Belajar Pesantren Modern
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 leading-tight">
                Belajar Lebih Cerdas,<br />
                <span className="text-indigo-200">Mengajar Lebih Efektif</span>
              </h2>
              <p className="text-indigo-100/80 text-lg mb-8 max-w-lg leading-relaxed">
                E-Learning SAPA menyatukan absensi, jurnal mengajar, materi, tugas, dan penilaian dalam satu platform yang mudah digunakan oleh guru dan santri.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/elearning/guru" 
                  className="group inline-flex items-center gap-2 bg-white text-indigo-700 px-7 py-3.5 rounded-2xl font-bold shadow-lg hover:bg-indigo-50 transition-all duration-200 hover:-translate-y-0.5"
                >
                  <GraduationCap className="h-5 w-5" />
                  Portal Guru
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  href="/elearning/santri" 
                  className="group inline-flex items-center gap-2 bg-white/20 text-white border border-white/30 backdrop-blur-sm px-7 py-3.5 rounded-2xl font-bold hover:bg-white/30 transition-all duration-200 hover:-translate-y-0.5"
                >
                  <BookOpen className="h-5 w-5" />
                  Portal Santri
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Stats card */}
            <div className="shrink-0 bg-white/15 backdrop-blur-md rounded-3xl border border-white/20 p-6 grid grid-cols-2 gap-5 w-full max-w-xs shadow-xl">
              {[
                { label: "Mata Pelajaran", value: "30+", icon: BookOpen },
                { label: "Guru Aktif", value: "50+", icon: GraduationCap },
                { label: "Santri", value: "500+", icon: Users },
                { label: "Jam Belajar", value: "∞", icon: Clock },
              ].map((stat, i) => (
                <div key={i} className="text-center p-3 bg-white/10 rounded-2xl">
                  <stat.icon className="h-5 w-5 text-indigo-200 mx-auto mb-2" />
                  <div className="text-2xl font-extrabold text-white">{stat.value}</div>
                  <div className="text-xs text-indigo-200/70 mt-0.5 leading-tight">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-12">
          <div className="text-center mb-10">
            <h3 className="text-3xl font-bold text-slate-900 mb-3">Fitur Unggulan E-Learning</h3>
            <p className="text-slate-500 max-w-xl mx-auto">Semua kebutuhan akademik digital tersedia lengkap dalam satu sistem yang terintegrasi.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <div 
                key={i} 
                className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className={`h-12 w-12 ${feat.bgLight} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <feat.icon className={`h-6 w-6 ${feat.textColor}`} />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">{feat.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Access Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/elearning/guru" className="group block">
            <div className="relative bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <div className="h-14 w-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-5 border border-white/20 group-hover:scale-110 transition-transform">
                  <GraduationCap className="h-7 w-7 text-white" />
                </div>
                <h4 className="text-2xl font-bold mb-2">Portal Guru</h4>
                <p className="text-indigo-200/80 mb-6">Kelola kelas, isi jurnal, upload materi, berikan tugas, dan input nilai santri dengan mudah.</p>
                <div className="flex items-center gap-2 font-semibold text-sm bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl w-fit transition-all">
                  Masuk Sekarang <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          <Link href="/elearning/santri" className="group block">
            <div className="relative bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 text-white overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <div className="h-14 w-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-5 border border-white/20 group-hover:scale-110 transition-transform">
                  <BookOpen className="h-7 w-7 text-white" />
                </div>
                <h4 className="text-2xl font-bold mb-2">Portal Santri</h4>
                <p className="text-emerald-100/80 mb-6">Akses materi pelajaran, kerjakan tugas dari guru, dan pantau perkembangan belajarmu.</p>
                <div className="flex items-center gap-2 font-semibold text-sm bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl w-fit transition-all">
                  Masuk Sekarang <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-slate-200 text-center text-sm text-slate-400">
        <p>© {new Date().getFullYear()} SAPA E-Learning — Sistem Akademik Pesantren Al-Ittihaad</p>
      </footer>
    </div>
  )
}
