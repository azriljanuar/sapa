import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import { 
  BookOpen, Database, ArrowRight, LayoutDashboard, 
  GraduationCap, Camera, FileText, Calendar, 
  Users, User, CheckCircle2, AlertCircle, CheckSquare, ScanLine
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function Home() {
  const session = await getSession()
  let userName = session?.email || ""

  // Data tambahan untuk render per-role
  let roleData: any = {}

  if (session) {
    if (session.role === "SUPER_ADMIN" || session.role === "ADMIN_JENJANG") {
      const user = await prisma.user.findUnique({ where: { id: session.id } })
      if (user) userName = user.nama
    }
    else if (session.role === "GURU") {
      const user = await prisma.guru.findUnique({ where: { id: session.id } })
      if (user) userName = user.nama

      // Cek Absensi Hari Ini
      const todayStr = new Date().toISOString().split("T")[0]
      const kehadiranToday = await prisma.kehadiranGuru.findUnique({
        where: { guruId_tanggal: { guruId: session.id, tanggal: new Date(todayStr) } }
      })
      roleData.kehadiran = kehadiranToday?.status || null

      // Cek apakah wali kelas
      const activeTA = await prisma.tahunAjaran.findFirst({ where: { isActive: true } })
      let isWaliKelas = false
      if (activeTA) {
        const kelasWali = await prisma.kelasFormal.findFirst({
          where: { waliKelasId: session.id, tahunAjaranId: activeTA.id }
        })
        isWaliKelas = !!kelasWali
      }
      roleData.isWaliKelas = isWaliKelas
    }
    else if (session.role === "SANTRI") {
      const user = await prisma.santri.findUnique({ 
        where: { id: session.id },
        include: {
          riwayatKelas: {
            where: { kelasFormal: { tahunAjaran: { isActive: true } } },
            include: { kelasFormal: { include: { jenjang: true } } }
          }
        }
      })
      if (user) {
        userName = user.namaLengkap
        const activeKelas = user.riwayatKelas[0]?.kelasFormal
        if (activeKelas) {
          roleData.kelas = activeKelas.namaKelas
          roleData.jenjang = activeKelas.jenjang.singkatan
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">SAPA</span>
          </div>
          <div className="flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-slate-700 hidden sm:inline-block bg-slate-100 px-3 py-1.5 rounded-full">
                  Halo, {userName}
                </span>
                <form action="/api/v1/elearning/auth/logout" method="POST">
                   <Button variant="outline" size="sm" type="submit" formAction={async () => {
                     "use server"
                     const { deleteSession } = await import("@/lib/auth")
                     await deleteSession()
                     const { redirect } = await import("next/navigation")
                     redirect("/login")
                   }} className="font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 border-slate-200">
                     Logout
                   </Button>
                </form>
              </div>
            ) : (
              <Link href="/login">
                <Button className="bg-emerald-600 hover:bg-emerald-700 font-semibold shadow-sm">Masuk ke Portal</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero / Portal Area */}
      <main className="flex-1">
        {/* State 1: TAMPILAN TAMU */}
        {!session && (
          <section className="relative overflow-hidden pt-16 pb-32 bg-gradient-to-br from-white to-emerald-50/40">
            <div className="container relative mx-auto px-4 flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
              <div className="flex-1 text-center lg:text-left z-10">
                <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 mb-6 shadow-sm">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                  Sistem Akademik Pesantren Terpadu
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.15]">
                  Digitalisasi Pesantren untuk <span className="text-emerald-600">Masa Depan</span> Pendidikan Islam
                </h1>
                
                <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                  SAPA mengintegrasikan manajemen data akademik dan pembelajaran elektronik dalam satu pintu. Memudahkan pengurus, guru, dan santri.
                </p>
    
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                  <Link href="/login">
                    <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 h-14 px-8 text-lg font-bold rounded-full shadow-xl shadow-emerald-600/20 transition-transform hover:-translate-y-0.5">
                      Masuk Sekarang <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <a href="#manfaat">
                    <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold rounded-full border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
                      Pelajari Lebih Lanjut
                    </Button>
                  </a>
                </div>
              </div>
              <div className="flex-1 relative w-full max-w-2xl mx-auto lg:mx-0 animate-in fade-in zoom-in duration-700">
                <div className="aspect-[4/3] relative rounded-3xl overflow-hidden shadow-2xl shadow-emerald-900/10 border border-white/40">
                  <Image src="/images/hero.jpg" alt="SAPA Digitalisasi Pesantren" fill className="object-cover" priority />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* State 2: TAMPILAN SETELAH LOGIN */}
        {session && (
          <div className="py-8 px-4 relative z-10">
            <div className="container mx-auto max-w-6xl">
              
              {/* HEADER / WELCOME BANNER (GURU & SANTRI) */}
              {(session.role === "GURU" || session.role === "SANTRI") && (
                <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-3xl p-8 mb-8 text-white overflow-hidden shadow-xl">
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/20 rounded-full blur-3xl" />
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                      <p className="text-indigo-200 text-sm font-medium mb-1">Selamat datang kembali 👋</p>
                      <h2 className="text-3xl font-extrabold mb-2">{userName}</h2>
                      {session.role === "SANTRI" && roleData.kelas && (
                        <p className="text-indigo-200/80">Santri Kelas <strong className="text-white">{roleData.kelas}</strong> &middot; {roleData.jenjang}</p>
                      )}
                      {session.role === "GURU" && (
                        <p className="text-indigo-200/80">Guru Pengajar &middot; Akses layanan e-learning SAPA</p>
                      )}
                    </div>
                    {session.role === "GURU" && (
                      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        {roleData.kehadiran ? (
                          <div className="bg-emerald-400/20 border border-emerald-300/40 text-emerald-100 px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold text-sm backdrop-blur-sm">
                            <CheckCircle2 className="h-5 w-5 text-emerald-300" /> Absen Terisi — {roleData.kehadiran}
                          </div>
                        ) : (
                          <Link href="#" className="bg-white text-indigo-700 hover:bg-indigo-50 px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-md">
                            <AlertCircle className="h-4 w-4 text-orange-500" /> Isi Absensi Hari Ini
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* HEADER (ADMIN & SUPER_ADMIN) */}
              {(session.role === "ADMIN_JENJANG" || session.role === "SUPER_ADMIN") && (
                <div className="text-center max-w-3xl mx-auto mb-10 pt-4">
                  <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
                    Selamat Datang, <span className="text-emerald-600">{userName}</span>
                  </h1>
                  <p className="text-lg text-slate-600 font-medium">Silakan pilih aplikasi layanan SAPA yang ingin Anda akses.</p>
                </div>
              )}

              {/* GRID AKSES CEPAT (GURU) */}
              {session.role === "GURU" && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <Link href="#" className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all group">
                    <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><BookOpen className="h-6 w-6" /></div>
                    <h3 className="font-bold text-slate-900 mb-1">Ruang Kelas</h3>
                    <p className="text-sm text-slate-500">Materi & Penilaian</p>
                  </Link>
                  <Link href="#" className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all group">
                    <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><FileText className="h-6 w-6" /></div>
                    <h3 className="font-bold text-slate-900 mb-1">Hub Absensi</h3>
                    <p className="text-sm text-slate-500">Absen Kehadiran Anda</p>
                  </Link>
                  <Link href="#" className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-purple-300 hover:shadow-lg transition-all group">
                    <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Calendar className="h-6 w-6" /></div>
                    <h3 className="font-bold text-slate-900 mb-1">Jadwal Mengajar</h3>
                    <p className="text-sm text-slate-500">Lihat jadwal harian</p>
                  </Link>
                  <Link href="/scan-santri" className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-pink-300 hover:shadow-lg transition-all group">
                    <div className="h-12 w-12 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><ScanLine className="h-6 w-6" /></div>
                    <h3 className="font-bold text-slate-900 mb-1">Scan Kelas</h3>
                    <p className="text-sm text-slate-500">Absensi barcode santri</p>
                  </Link>
                  {roleData.isWaliKelas && (
                    <Link href="#" className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all group">
                      <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Users className="h-6 w-6" /></div>
                      <h3 className="font-bold text-slate-900 mb-1">Rekap Kelas</h3>
                      <p className="text-sm text-slate-500">Pantau absensi santri</p>
                    </Link>
                  )}
                  <Link href="#" className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-orange-300 hover:shadow-lg transition-all group">
                    <div className="h-12 w-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><User className="h-6 w-6" /></div>
                    <h3 className="font-bold text-slate-900 mb-1">Profil Saya</h3>
                    <p className="text-sm text-slate-500">Pengaturan akun</p>
                  </Link>
                </div>
              )}

              {/* GRID AKSES CEPAT (SANTRI) */}
              {session.role === "SANTRI" && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Link href="#" className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all group">
                    <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><LayoutDashboard className="h-6 w-6" /></div>
                    <h3 className="font-bold text-slate-900 mb-1">Ruang Belajar</h3>
                    <p className="text-sm text-slate-500">Materi dari guru</p>
                  </Link>
                  <Link href="#" className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-purple-300 hover:shadow-lg transition-all group">
                    <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><FileText className="h-6 w-6" /></div>
                    <h3 className="font-bold text-slate-900 mb-1">Tugas Saya</h3>
                    <p className="text-sm text-slate-500">Kumpulkan tugas online</p>
                  </Link>
                  <Link href="#" className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all group">
                    <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Calendar className="h-6 w-6" /></div>
                    <h3 className="font-bold text-slate-900 mb-1">Jadwal Pelajaran</h3>
                    <p className="text-sm text-slate-500">Lihat jadwal harian</p>
                  </Link>
                  <Link href="#" className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all group">
                    <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><CheckSquare className="h-6 w-6" /></div>
                    <h3 className="font-bold text-slate-900 mb-1">Kehadiran</h3>
                    <p className="text-sm text-slate-500">Cek rekap absensi harian</p>
                  </Link>
                  <Link href="#" className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-orange-300 hover:shadow-lg transition-all group">
                    <div className="h-12 w-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><User className="h-6 w-6" /></div>
                    <h3 className="font-bold text-slate-900 mb-1">Profil Saya</h3>
                    <p className="text-sm text-slate-500">Pengaturan akun</p>
                  </Link>
                </div>
              )}

              {/* KARTU PORTAL (ADMIN & SUPER_ADMIN) */}
              {(session.role === "ADMIN_JENJANG" || session.role === "SUPER_ADMIN") && (
                <div className="max-w-4xl mx-auto flex flex-col gap-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <Link href={session.role === "SUPER_ADMIN" ? "/super-admin" : "/admin-jenjang"} className="group block h-full">
                      <div className="h-full bg-white rounded-3xl p-8 border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/5 hover:border-blue-200 hover:-translate-y-1 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Database className="w-48 h-48 -mr-12 -mt-12 text-blue-600" /></div>
                        <div className="h-16 w-16 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner relative z-10"><Database className="h-8 w-8" /></div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-3 relative z-10">Sistem Informasi (SIPD)</h3>
                        <p className="text-slate-600 mb-8 leading-relaxed relative z-10">Kelola pangkalan data pesantren secara terpusat. Akses data santri, absensi, jadwal pelajaran, hingga penilaian.</p>
                        <div className="inline-flex items-center justify-center w-full bg-blue-50 text-blue-700 font-bold py-3 px-4 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors relative z-10">
                          Buka SIPD <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                      </div>
                    </Link>

                    {session.role === "ADMIN_JENJANG" && (
                      <Link href="#" className="group block h-full">
                        <div className="h-full bg-white rounded-3xl p-8 border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-purple-900/5 hover:border-purple-200 hover:-translate-y-1 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><GraduationCap className="w-48 h-48 -mr-12 -mt-12 text-purple-600" /></div>
                          <div className="h-16 w-16 bg-purple-50 text-purple-600 border border-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner relative z-10"><GraduationCap className="h-8 w-8" /></div>
                          <h3 className="text-2xl font-bold text-slate-900 mb-3 relative z-10">E-Learning (LMS)</h3>
                          <p className="text-slate-600 mb-8 leading-relaxed relative z-10">Platform pembelajaran elektronik. Pantau materi pelajaran, penugasan, serta ujian secara online.</p>
                          <div className="inline-flex items-center justify-center w-full bg-purple-50 text-purple-700 font-bold py-3 px-4 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors relative z-10">
                            Buka E-Learning <ArrowRight className="ml-2 h-4 w-4" />
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>

                  {session.role === "ADMIN_JENJANG" && (
                    <Link href="/scan-absensi" className="group block">
                      <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100 shadow-sm transition-all duration-300 hover:shadow-md hover:border-emerald-300 flex flex-col sm:flex-row items-center gap-6">
                        <div className="h-16 w-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform"><Camera className="h-8 w-8" /></div>
                        <div className="flex-1 text-center sm:text-left">
                          <h3 className="text-xl font-bold text-emerald-900 mb-1">Pindai Absensi Harian (Kiosk)</h3>
                          <p className="text-emerald-700 text-sm font-medium">Buka antarmuka kamera pintar untuk absensi otomatis santri menggunakan QR Code.</p>
                        </div>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-6 py-6 w-full sm:w-auto font-bold shadow-md">
                          Mulai Scan <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </Link>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

        {/* Benefits Section (Only for Guests) */}
        {!session && (
          <section id="manfaat" className="py-24 bg-white border-t border-slate-100">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16 max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Manfaat Digitalisasi Pesantren</h2>
                <p className="text-lg text-slate-600 font-medium">Mengapa transformasi digital sangat penting untuk sistem pondok pesantren di era modern saat ini.</p>
              </div>
  
              <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <div className="bg-slate-50 rounded-3xl p-8 text-center border border-slate-100 hover:border-emerald-200 transition-colors duration-300 hover:shadow-lg hover:shadow-emerald-900/5 group">
                  <div className="h-16 w-16 bg-white text-emerald-600 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform"><Database className="h-8 w-8" /></div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">Data Terpusat & Aman</h3>
                  <p className="text-slate-600 leading-relaxed text-sm font-medium">Tidak ada lagi data yang tercecer. Semua informasi santri, guru, dan rekap akademik tersimpan rapi, terpusat, dan di-backup secara otomatis.</p>
                </div>
                <div className="bg-slate-50 rounded-3xl p-8 text-center border border-slate-100 hover:border-emerald-200 transition-colors duration-300 hover:shadow-lg hover:shadow-emerald-900/5 group">
                  <div className="h-16 w-16 bg-white text-emerald-600 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform"><LayoutDashboard className="h-8 w-8" /></div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">Monitoring Real-time</h3>
                  <p className="text-slate-600 leading-relaxed text-sm font-medium">Pimpinan dan pengasuh dapat memantau perkembangan akademik, tingkat kehadiran (absensi), dan aktivitas pesantren langsung dari satu layar.</p>
                </div>
                <div className="bg-slate-50 rounded-3xl p-8 text-center border border-slate-100 hover:border-emerald-200 transition-colors duration-300 hover:shadow-lg hover:shadow-emerald-900/5 group">
                  <div className="h-16 w-16 bg-white text-emerald-600 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform"><BookOpen className="h-8 w-8" /></div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">Pembelajaran Interaktif</h3>
                  <p className="text-slate-600 leading-relaxed text-sm font-medium">Melalui portal E-Learning, santri dapat mengakses kembali materi, mengumpulkan tugas harian, dan mengikuti ujian evaluasi secara paperless.</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="bg-slate-900 py-12 text-center text-slate-400 border-t border-slate-800">
        <div className="container mx-auto px-4">
           <div className="h-10 w-10 bg-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-5 shadow-inner">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <p className="mb-2 font-medium text-slate-300">© {new Date().getFullYear()} SAPA (Sistem Akademik Pesantren Terpadu).</p>
          <p className="text-sm">Membangun peradaban Islam melalui teknologi.</p>
        </div>
      </footer>
    </div>
  )
}
