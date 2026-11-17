import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import { 
  BookOpen, Database, ArrowRight, LayoutDashboard, 
  GraduationCap, FileText, Calendar, 
  Users, User, CheckCircle2, AlertCircle, CheckSquare
} from "lucide-react"
import * as Icons from "lucide-react"
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
          roleData.jenjang = activeKelas.jenjang?.singkatan || ""
        }
      }
    }
  }

  const dashboardHref = session
    ? (session.role === "SUPER_ADMIN" || session.role === "ADMIN_JENJANG")
      ? "/admin"
      : session.role === "GURU"
      ? "/guru"
      : session.role === "SANTRI"
      ? "/santri"
      : "/"
    : "/login"

  let lpContent = await prisma.landingPageContent.findFirst()
  if (!lpContent) {
    // Default values if table is empty
    lpContent = {
      id: 1,
      heroData: { badge: "Sistem Akademik Pesantren Terpadu", title: "Digitalisasi Pesantren untuk", titleHighlight: "Masa Depan", desc: "SAPA mengintegrasikan manajemen data akademik dan pembelajaran elektronik dalam satu pintu.", btnLabel: "Masuk Sekarang", imageUrl: "/images/hero.jpg" },
      statsData: [ { angka: "1.200+", label: "Santri" }, { angka: "80+", label: "Guru" } ],
      featuresData: [ { iconName: "Clipboard", title: "Absensi QR Code", desc: "Rekam kehadiran santri & guru otomatis." } ],
      profileData: { namaPesantren: "Pesantren Al-Ittihaad", desc: "Membentuk generasi qur'ani.", tahunBerdiri: "2010", imageUrl: "/images/hero.jpg" },
      contactData: { alamat: "Jl. Pendidikan", telepon: "08123456789", email: "info@alittihaad.sch.id", mapsUrl: "", instagram: "", facebook: "" },
      footerData: { tagline: "Membangun peradaban Islam melalui teknologi.", copyright: `© ${new Date().getFullYear()} SAPA` },
      updatedAt: new Date()
    } as any
  }

  const hero = lpContent!.heroData as any
  const stats = lpContent!.statsData as any[]
  const features = lpContent!.featuresData as any[]
  const profile = lpContent!.profileData as any
  const contact = lpContent!.contactData as any
  const footer = lpContent!.footerData as any

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center shadow-sm">
              <span className="font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">SAPA</span>
          </div>
          <div className="flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-foreground hidden sm:inline-block bg-muted px-3 py-1.5 rounded-full">
                  Halo, {userName}
                </span>
                <Link href={dashboardHref}>
                  <Button size="sm" className="font-semibold shadow-xs">
                    Dashboard
                  </Button>
                </Link>
                <form action="/api/v1/elearning/auth/logout" method="POST">
                   <Button variant="outline" size="sm" type="submit" formAction={async () => {
                     "use server"
                     const { deleteSession } = await import("@/lib/auth")
                     await deleteSession()
                     const { redirect } = await import("next/navigation")
                     redirect("/login")
                   }} className="font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-border">
                     Logout
                   </Button>
                </form>
              </div>
            ) : (
              <Link href="/login">
                <Button className="font-semibold shadow-sm">Masuk ke Portal</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero / Portal Area */}
      <main className="flex-1">
        {/* State 1: TAMPILAN TAMU */}
        {!session && (
          <section className="relative overflow-hidden pt-16 pb-32 bg-gradient-to-br from-background via-card to-primary/5">
            <div className="container relative mx-auto px-4 flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
              <div className="flex-1 text-center lg:text-left z-10">
                <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary mb-6 shadow-sm">
                  <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                  {hero.badge}
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-6 leading-[1.15]">
                  {hero.title} <span className="text-primary">{hero.titleHighlight}</span>
                </h1>
                
                <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                  {hero.desc}
                </p>
    
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                  <Link href="/login">
                    <Button size="lg" className="h-14 px-8 text-lg font-bold rounded-full shadow-xl shadow-primary/20 transition-transform hover:-translate-y-0.5">
                      {hero.btnLabel} <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <a href="#manfaat">
                    <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold rounded-full border-border text-foreground hover:bg-muted transition-colors">
                      Pelajari Lebih Lanjut
                    </Button>
                  </a>
                </div>
              </div>
              <div className="flex-1 relative w-full max-w-2xl mx-auto lg:mx-0 animate-in fade-in zoom-in duration-700">
                <div className="aspect-[4/3] relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 border border-border">
                  <Image src={hero.imageUrl || "/images/hero.jpg"} alt={hero.badge} fill className="object-cover" priority />
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
                          <div className="bg-primary/20 border border-primary/40 text-primary-foreground px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold text-sm backdrop-blur-sm">
                            <CheckCircle2 className="h-5 w-5 text-primary-foreground" /> Absen Terisi — {roleData.kehadiran}
                          </div>
                        ) : (
                          <Link href="#" className="bg-card text-primary hover:bg-muted px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-md">
                            <AlertCircle className="h-4 w-4 text-amber-500" /> Isi Absensi Hari Ini
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
                  <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
                    Selamat Datang, <span className="text-primary">{userName}</span>
                  </h1>
                  <p className="text-lg text-muted-foreground font-medium">Silakan pilih aplikasi layanan SAPA yang ingin Anda akses.</p>
                </div>
              )}

              {/* GRID AKSES CEPAT (GURU) */}
              {session.role === "GURU" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/guru" className="bg-card p-6 rounded-3xl border border-border hover:border-primary/50 hover:shadow-lg transition-all group">
                    <div className="h-12 w-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <LayoutDashboard className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-foreground mb-1">Portal Guru</h3>
                    <p className="text-sm text-muted-foreground">Buka dashboard pengajar & pantau presensi Anda</p>
                  </Link>

                  <Link href="/guru/jadwal" className="bg-card p-6 rounded-3xl border border-border hover:border-primary/50 hover:shadow-lg transition-all group">
                    <div className="h-12 w-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-foreground mb-1">Jadwal Mengajar</h3>
                    <p className="text-sm text-muted-foreground">Lihat agenda mengajar dan mata pelajaran di kelas</p>
                  </Link>
                </div>
              )}

              {/* GRID AKSES CEPAT (SANTRI) */}
              {session.role === "SANTRI" && (
                <div className="max-w-md mx-auto">
                  <Link href="/santri" className="block bg-card p-6 rounded-3xl border border-border hover:border-primary/50 hover:shadow-lg transition-all group text-center">
                    <div className="h-16 w-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <GraduationCap className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Portal Santri</h3>
                    <p className="text-muted-foreground text-sm mb-5">
                      Lihat status kehadiran harian, informasi kelas, dan biodata santri Anda.
                    </p>
                    <div className="inline-flex items-center justify-center bg-primary text-primary-foreground font-semibold text-sm py-2.5 px-5 rounded-xl group-hover:bg-primary/90 transition-colors">
                      Buka Portal Santri <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </Link>
                </div>
              )}

              {/* KARTU PORTAL (ADMIN & SUPER_ADMIN) */}
              {(session.role === "ADMIN_JENJANG" || session.role === "SUPER_ADMIN") && (
                <div className="max-w-4xl mx-auto flex flex-col gap-6">
                  <div className="grid md:grid-cols-1 gap-6 max-w-2xl mx-auto w-full">
                    <Link href="/admin" className="group block h-full">
                      <div className="h-full bg-card rounded-3xl p-8 border border-border shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-1 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Database className="w-48 h-48 -mr-12 -mt-12 text-primary" /></div>
                        <div className="h-16 w-16 bg-primary/10 text-primary border border-primary/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner relative z-10"><Database className="h-8 w-8" /></div>
                        <h3 className="text-2xl font-bold text-foreground mb-3 relative z-10">Sistem Informasi (SIPD)</h3>
                        <p className="text-muted-foreground mb-8 leading-relaxed relative z-10">Kelola pangkalan data pesantren secara terpusat. Akses data santri, absensi, jadwal pelajaran, hingga penilaian.</p>
                        <div className="inline-flex items-center justify-center w-full bg-primary/10 text-primary font-bold py-3 px-4 rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors relative z-10">
                          Buka SIPD <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* STATS & FEATURES (Guests & Logged in, or just Guests? Let's show for guests) */}
        {!session && (
          <>
            {/* STATS */}
            {stats.length > 0 && (
              <section className="py-12 bg-primary text-primary-foreground relative z-20">
                <div className="container mx-auto px-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-primary-foreground/20">
                    {stats.map((s, i) => (
                      <div key={i} className="px-4">
                        <div className="text-4xl md:text-5xl font-extrabold mb-2">{s.angka}</div>
                        <div className="text-primary-foreground/80 font-medium uppercase tracking-wider text-sm">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* FEATURES */}
            {features.length > 0 && (
              <section id="manfaat" className="py-24 bg-card border-t border-border">
                <div className="container mx-auto px-4">
                  <div className="text-center mb-16 max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4 tracking-tight">Kenapa Memilih SAPA?</h2>
                    <p className="text-lg text-muted-foreground font-medium">Fitur unggulan untuk mendukung digitalisasi pesantren.</p>
                  </div>
      
                  <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {features.map((feat, i) => {
                      const IconComponent = (Icons as any)[feat.iconName || "Star"] || Icons.Star
                      return (
                        <div key={i} className="bg-muted/40 rounded-3xl p-8 text-center border border-border hover:border-primary/30 transition-colors duration-300 hover:shadow-lg hover:shadow-primary/5 group">
                          <div className="h-16 w-16 bg-card text-primary border border-border rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform">
                            <IconComponent className="h-8 w-8" />
                          </div>
                          <h3 className="text-xl font-bold text-foreground mb-3">{feat.title}</h3>
                          <p className="text-muted-foreground leading-relaxed text-sm font-medium">{feat.desc}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* PROFILE */}
            <section className="py-24 bg-background border-t border-border">
              <div className="container mx-auto px-4 max-w-5xl">
                <div className="bg-card rounded-3xl shadow-xl border border-border overflow-hidden flex flex-col md:flex-row">
                  <div className="md:w-2/5 relative h-64 md:h-auto">
                    <Image src={profile.imageUrl || "/images/hero.jpg"} alt={profile.namaPesantren} fill className="object-cover" />
                  </div>
                  <div className="md:w-3/5 p-10 md:p-14 flex flex-col justify-center">
                    <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4 w-max">
                      Berdiri sejak {profile.tahunBerdiri}
                    </div>
                    <h2 className="text-3xl font-extrabold text-foreground mb-6">{profile.namaPesantren}</h2>
                    <p className="text-muted-foreground leading-relaxed text-lg whitespace-pre-wrap">{profile.desc}</p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="bg-card pt-16 pb-8 border-t border-border text-muted-foreground">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center shadow-inner">
                  <span className="text-primary-foreground font-bold text-xl">S</span>
                </div>
                <span className="text-2xl font-bold text-foreground tracking-tight">SAPA</span>
              </div>
              <p className="text-muted-foreground max-w-sm mb-6">{footer.tagline}</p>
              <div className="flex gap-4">
                {contact.instagram && <a href={contact.instagram} target="_blank" className="hover:text-foreground transition"><Icons.Globe className="h-5 w-5"/></a>}
                {contact.facebook && <a href={contact.facebook} target="_blank" className="hover:text-foreground transition"><Icons.MessageCircle className="h-5 w-5"/></a>}
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-foreground font-bold text-lg mb-4">Hubungi Kami</h3>
              <div className="flex items-start gap-3">
                <Icons.MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>{contact.alamat}</span>
              </div>
              <div className="flex items-center gap-3">
                <Icons.Phone className="h-5 w-5 text-primary shrink-0" />
                <span>{contact.telepon}</span>
              </div>
              <div className="flex items-center gap-3">
                <Icons.Mail className="h-5 w-5 text-primary shrink-0" />
                <span>{contact.email}</span>
              </div>
            </div>
          </div>
          
          <div className="text-center pt-8 border-t border-border text-sm">
            <p>{footer.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

