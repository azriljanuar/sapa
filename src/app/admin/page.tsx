import { getLoggedInAdmin } from "@/lib/auth"
import prisma from "@/lib/prisma"
import Image from "next/image"
import Link from "next/link"
import { Users, BookOpen, GraduationCap, ArrowRight, ClipboardCheck, CreditCard, Award, Shield, Settings, LayoutTemplate, Building } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
  const admin = await getLoggedInAdmin()
  const lembaga = admin.lembaga

  const sebutanSantri = lembaga?.sebutanSantri || "Santri"
  const sebutanGuru = lembaga?.sebutanGuru || "Guru"

  // Ambil statistik akurat langsung dari tabel (Single-Jenjang)
  const [jumlahGuru, jumlahSantriAktif, jumlahAlumni, jumlahMutasi, jumlahKelas, jumlahMapel] = await Promise.all([
    prisma.guru.count(),
    prisma.santri.count({ where: { status: "AKTIF" } }),
    prisma.santri.count({ where: { status: "ALUMNI" } }),
    prisma.santri.count({ where: { status: { in: ["MUTASI", "KELUAR"] } } }),
    prisma.kelasFormal.count(),
    prisma.mataPelajaran.count(),
  ])

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 xl:gap-8 items-start">
      
      {/* Kolom Utama */}
      <div className="space-y-6">
        
        {/* Header Dashboard */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-1">
            Dashboard Super Admin
          </h1>
          <p className="text-sm text-muted-foreground">
            Selamat datang di panel administrasi terpadu <span className="font-semibold text-foreground">{lembaga?.namaLembaga || "Lembaga"}</span>.
          </p>
        </div>

        {/* Statistik / Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Students */}
          <div className="bg-card rounded-xl p-5 border border-border shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground mb-4">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              Total {sebutanSantri} Aktif
            </div>
            <div className="flex items-end gap-3 mb-5">
              <span className="text-3xl md:text-4xl font-bold text-foreground">{jumlahSantriAktif}</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                Aktif
              </span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-border/60 pt-3">
              <div>
                <p className="text-muted-foreground">Mutasi / Keluar</p>
                <p className="font-semibold text-foreground text-sm mt-0.5">{jumlahMutasi}</p>
              </div>
              <div className="text-right">
                <Link href="/admin/alumni" className="hover:underline">
                  <p className="text-muted-foreground">Alumni / Lulus</p>
                  <p className="font-semibold text-primary text-sm mt-0.5">{jumlahAlumni}</p>
                </Link>
              </div>
            </div>
          </div>

          {/* Card 2: Staff */}
          <div className="bg-card rounded-xl p-5 border border-border shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground mb-4">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              Total {sebutanGuru} Terdaftar
            </div>
            <div className="flex items-end gap-3 mb-5">
              <span className="text-3xl md:text-4xl font-bold text-foreground">{jumlahGuru}</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                Pendidik
              </span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-border/60 pt-3">
              <div>
                <p className="text-muted-foreground">Total Kelas</p>
                <p className="font-semibold text-foreground text-sm mt-0.5">{jumlahKelas}</p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground">Mata Pelajaran</p>
                <p className="font-semibold text-foreground text-sm mt-0.5">{jumlahMapel}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Akses Cepat Presensi & Kartu */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/admin/rekap-kehadiran" className="group flex items-center justify-between bg-primary hover:bg-primary/90 text-primary-foreground p-4 md:p-5 rounded-xl shadow-xs transition-all">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center backdrop-blur-xs">
                <ClipboardCheck className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Rekap Kehadiran Presensi</h3>
                <p className="text-primary-foreground/80 text-xs mt-0.5">Monitoring kehadiran harian guru & {sebutanSantri.toLowerCase()}</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link href="/admin/kartu-identitas" className="group flex items-center justify-between bg-card hover:bg-muted/60 text-foreground border border-border p-4 md:p-5 rounded-xl shadow-xs transition-all">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Kartu Pintar & RFID</h3>
                <p className="text-muted-foreground text-xs mt-0.5">Cetak kartu pintar {sebutanSantri.toLowerCase()} & {sebutanGuru.toLowerCase()}</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
          </Link>
        </div>

        {/* Data Pokok Pendidikan Grid */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
            Data Pokok Akademik
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Kartu Guru */}
            <Link href="/admin/guru" className="group block bg-card rounded-xl overflow-hidden border border-border shadow-xs hover:border-primary/40 hover:shadow-sm transition-all flex flex-col">
              <div className="h-36 relative bg-muted w-full overflow-hidden p-2.5">
                <div className="relative w-full h-full rounded-lg overflow-hidden">
                  <Image src="/images/card_guru.png" alt="Guru" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">Data {sebutanGuru}</h3>
                  <p className="text-muted-foreground text-xs mt-0.5">Kelola direktori pendidik</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                    <Users className="w-3.5 h-3.5 text-primary" /> {jumlahGuru} Terdaftar
                  </span>
                  <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Kartu Santri */}
            <Link href="/admin/santri" className="group block bg-card rounded-xl overflow-hidden border border-border shadow-xs hover:border-primary/40 hover:shadow-sm transition-all flex flex-col">
              <div className="h-36 relative bg-muted w-full overflow-hidden p-2.5">
                <div className="relative w-full h-full rounded-lg overflow-hidden">
                  <Image src="/images/card_santri.png" alt="Santri" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">Data {sebutanSantri}</h3>
                  <p className="text-muted-foreground text-xs mt-0.5">Kelola rekapitulasi siswa aktif</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                    <GraduationCap className="w-3.5 h-3.5 text-primary" /> {jumlahSantriAktif} Aktif
                  </span>
                  <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Kartu Alumni */}
            <Link href="/admin/alumni" className="group block bg-card rounded-xl overflow-hidden border border-border shadow-xs hover:border-primary/40 hover:shadow-sm transition-all flex flex-col">
              <div className="h-36 relative bg-muted w-full overflow-hidden p-2.5 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <Award className="w-10 h-10" />
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">Data Alumni</h3>
                  <p className="text-muted-foreground text-xs mt-0.5">Rekam jejak kelulusan & SKL</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                    <Award className="w-3.5 h-3.5 text-indigo-600" /> {jumlahAlumni} Alumni
                  </span>
                  <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Kartu Kelas */}
            <Link href="/admin/kelas-formal" className="group block bg-card rounded-xl overflow-hidden border border-border shadow-xs hover:border-primary/40 hover:shadow-sm transition-all flex flex-col">
              <div className="h-36 relative bg-muted w-full overflow-hidden p-2.5">
                <div className="relative w-full h-full rounded-lg overflow-hidden">
                  <Image src="/images/card_kelas.png" alt="Kelas" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">Kelas Formal</h3>
                  <p className="text-muted-foreground text-xs mt-0.5">Atur pembagian rombel & kelas</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                    <BookOpen className="w-3.5 h-3.5 text-primary" /> {jumlahKelas} Kelas
                  </span>
                  <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Kartu Profil Lembaga */}
            <Link href="/admin/profil" className="group block bg-card rounded-xl overflow-hidden border border-border shadow-xs hover:border-primary/40 hover:shadow-sm transition-all flex flex-col">
              <div className="h-36 relative bg-muted w-full overflow-hidden p-2.5 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <Building className="w-10 h-10" />
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">Profil Lembaga</h3>
                  <p className="text-muted-foreground text-xs mt-0.5">Identitas, logo & kop surat</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                    <Building className="w-3.5 h-3.5 text-emerald-600" /> Konfigurasi
                  </span>
                  <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Kartu Landing Page */}
            <Link href="/admin/landing-page" className="group block bg-card rounded-xl overflow-hidden border border-border shadow-xs hover:border-primary/40 hover:shadow-sm transition-all flex flex-col">
              <div className="h-36 relative bg-muted w-full overflow-hidden p-2.5 flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <LayoutTemplate className="w-10 h-10" />
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">Landing Page</h3>
                  <p className="text-muted-foreground text-xs mt-0.5">Kelola konten website publik</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                    <LayoutTemplate className="w-3.5 h-3.5 text-amber-600" /> Web Publik
                  </span>
                  <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </Link>

          </div>
        </div>
      </div>

      {/* Kolom Kanan (Profil Admin & Ringkasan) */}
      <div className="space-y-4">
        
        {/* Profile Card */}
        <div className="bg-card rounded-xl p-5 border border-border shadow-xs flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border shadow-xs mb-3 bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={`https://api.dicebear.com/7.x/notionists/svg?seed=${admin.nama}`} 
              alt={admin.nama} 
              className="object-cover w-full h-full"
            />
          </div>
          <h3 className="text-base font-bold text-foreground">{admin.nama}</h3>
          <p className="text-muted-foreground font-medium text-xs mt-0.5">{admin.email}</p>
          
          <div className="w-full border-t border-border/60 mt-4 pt-4 flex justify-between px-2">
            <div className="text-center w-1/2 border-r border-border/60">
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Role</p>
              <p className="text-foreground font-semibold text-xs mt-0.5">Super Admin</p>
            </div>
            <div className="text-center w-1/2">
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Jenjang</p>
              <p className="text-foreground font-semibold text-xs mt-0.5 truncate">{lembaga?.tingkatJenjang || "MA"}</p>
            </div>
          </div>

          <div className="w-full mt-4 bg-primary rounded-lg p-3 text-primary-foreground flex justify-between items-center shadow-xs">
            <div className="text-left">
              <p className="text-primary-foreground/80 text-[10px] uppercase tracking-wider font-semibold">ID Administrator</p>
              <p className="font-bold text-base leading-none mt-0.5">#{admin.id}</p>
            </div>
            <div className="w-9 h-9 bg-primary-foreground/20 rounded-md flex items-center justify-center backdrop-blur-xs">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
