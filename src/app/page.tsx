import { getSession } from "@/lib/auth"
import Link from "next/link"
import { BookOpen, Database, ArrowRight, LayoutDashboard, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function Home() {
  const session = await getSession()

  // Tentukan rute dashboard SIPD berdasarkan role
  let sipdRoute = "/login"
  if (session) {
    if (session.role === "SUPER_ADMIN") sipdRoute = "/super-admin"
    else if (session.role === "ADMIN_JENJANG") sipdRoute = "/admin-jenjang"
    else if (session.role === "GURU") sipdRoute = "/guru"
    else if (session.role === "SANTRI") sipdRoute = "/santri"
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">SAPA</span>
          </div>
          <div className="flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-600 hidden sm:inline-block">
                  Halo, {session.email}
                </span>
                <form action="/api/v1/elearning/auth/logout" method="POST">
                   {/* We might need a proper logout route, but let's use a standard logout approach */}
                   <Button variant="outline" size="sm" type="submit" formAction={async () => {
                     "use server"
                     const { deleteSession } = await import("@/lib/auth")
                     await deleteSession()
                     const { redirect } = await import("next/navigation")
                     redirect("/")
                   }}>
                     Logout
                   </Button>
                </form>
              </div>
            ) : (
              <Link href="/login">
                <Button className="bg-emerald-600 hover:bg-emerald-700">Masuk ke Portal</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden bg-white pt-16 pb-32">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          
          <div className="container relative mx-auto px-4 text-center">
            <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800 mb-8">
              <span className="flex h-2 w-2 rounded-full bg-emerald-600 mr-2 animate-pulse"></span>
              Sistem Akademik Pesantren Terpadu
            </div>
            
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 max-w-4xl mx-auto leading-tight">
              Digitalisasi Pesantren untuk <span className="text-emerald-600">Masa Depan</span> Pendidikan Islam
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              SAPA (Sistem Akademik Pesantren) mengintegrasikan manajemen data akademik dan pembelajaran elektronik dalam satu pintu. Memudahkan pengurus, guru, dan santri.
            </p>

            {!session && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/login">
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 h-14 px-8 text-lg rounded-full shadow-lg shadow-emerald-200">
                    Masuk Sekarang <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full">
                  Pelajari Lebih Lanjut
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Portal Menu Section (Only shown if logged in) */}
        {session && (
          <section className="py-20 bg-slate-50 -mt-16 relative z-10">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900">Pilih Layanan</h2>
                <p className="text-slate-600 mt-2">Silakan pilih aplikasi yang ingin Anda akses</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* SIPD Card */}
                <Link href={sipdRoute} className="group block">
                  <div className="h-full bg-white rounded-3xl p-8 border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-emerald-200 hover:-translate-y-1">
                    <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Database className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">SIPD</h3>
                    <p className="text-slate-600 mb-6 line-clamp-2">
                      Sistem Informasi Pangkalan Data. Kelola data santri, guru, jadwal pelajaran, hingga penilaian secara terpusat.
                    </p>
                    <div className="flex items-center text-blue-600 font-medium">
                      Akses SIPD <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>

                {/* E-Learning Card */}
                <Link href="/elearning" className="group block">
                  <div className="h-full bg-white rounded-3xl p-8 border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-emerald-200 hover:-translate-y-1">
                    <div className="h-16 w-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <GraduationCap className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">E-Learning</h3>
                    <p className="text-slate-600 mb-6 line-clamp-2">
                      Learning Management System (LMS). Akses materi pelajaran, tugas, dan ujian online untuk santri dan guru.
                    </p>
                    <div className="flex items-center text-purple-600 font-medium">
                      Akses E-Learning <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Benefits Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Manfaat Digitalisasi Pesantren</h2>
              <p className="text-lg text-slate-600">Mengapa transformasi digital sangat penting untuk pondok pesantren di era modern.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
              <div className="bg-slate-50 rounded-2xl p-8 text-center hover:bg-emerald-50 transition-colors duration-300">
                <div className="h-14 w-14 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <Database className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Data Terpusat & Aman</h3>
                <p className="text-slate-600 leading-relaxed">
                  Tidak ada lagi data yang tercecer. Semua informasi santri, guru, dan akademik tersimpan rapi, terpusat, dan di-backup secara berkala.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-8 text-center hover:bg-emerald-50 transition-colors duration-300">
                <div className="h-14 w-14 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <LayoutDashboard className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Monitoring Real-time</h3>
                <p className="text-slate-600 leading-relaxed">
                  Pimpinan dan pengasuh dapat memantau perkembangan akademik, kehadiran, dan aktivitas pesantren secara langsung dari dashboard.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-8 text-center hover:bg-emerald-50 transition-colors duration-300">
                <div className="h-14 w-14 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Pembelajaran Interaktif</h3>
                <p className="text-slate-600 leading-relaxed">
                  Melalui E-Learning, santri dapat mengakses materi berulang kali, mengumpulkan tugas secara digital, dan mengikuti ujian online.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 text-center text-slate-400">
        <div className="container mx-auto px-4">
           <div className="h-10 w-10 bg-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <p className="mb-2">© {new Date().getFullYear()} SAPA (Sistem Akademik Pesantren).</p>
          <p className="text-sm">Membangun peradaban Islam melalui teknologi.</p>
        </div>
      </footer>
    </div>
  )
}
