import { Metadata } from "next"
import Link from "next/link"
import { getLoggedInKepalaSekolah } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getSelectedTahunAjaran, getSelectedSemester } from "@/lib/ta-context"
import { getWibDate } from "@/lib/kaldik-utils"
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  CalendarDays, 
  BarChart2, 
  ClipboardList, 
  ShieldCheck, 
  Award,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Dashboard Eksekutif - Kepala Madrasah | SAPA",
  description: "Panel pimpinan satuan pendidikan dan ringkasan eksekutif",
}

export const dynamic = "force-dynamic"

export default async function KepalaSekolahDashboardPage() {
  const kepala = await getLoggedInKepalaSekolah()
  const activeTA = await getSelectedTahunAjaran()
  const activeSemester = await getSelectedSemester()

  // Ambil tanggal hari ini dalam WIB (format YYYY-MM-DD)
  const todayWib = getWibDate()
  const todayStr = todayWib.toISOString().split("T")[0]
  const todayDateObj = new Date(todayStr + "T00:00:00.000Z")

  // Query KPI Makro secara paralel
  const [
    jumlahSantriAktif,
    jumlahGuru,
    jumlahKelas,
    jumlahMapel,
    presensiSantriToday,
    presensiGuruToday,
    totalPengampu,
    pengampuDirilis,
  ] = await Promise.all([
    prisma.santri.count({
      where: {
        jenjangs: { some: { jenjangId: kepala.jenjangId, isAlumni: false, statusKeluar: null } },
      },
    }),
    prisma.guru.count({
      where: {
        jenjangs: { some: { id: kepala.jenjangId } },
      },
    }),
    prisma.kelasFormal.count({
      where: {
        jenjangId: kepala.jenjangId,
        ...(activeTA ? { tahunAjaranId: activeTA.id } : {}),
      },
    }),
    prisma.mataPelajaran.count({
      where: {
        jenjangId: kepala.jenjangId,
      },
    }),
    prisma.kehadiranHarianSantri.findMany({
      where: {
        tanggal: todayDateObj,
        santri: {
          jenjangs: { some: { jenjangId: kepala.jenjangId } },
        },
      },
      select: { status: true },
    }),
    prisma.kehadiranGuru.findMany({
      where: {
        tanggal: todayDateObj,
        guru: {
          jenjangs: { some: { id: kepala.jenjangId } },
        },
      },
      select: { status: true },
    }),
    prisma.pengampuMataPelajaran.count({
      where: {
        ...(activeTA ? { tahunAjaranId: activeTA.id } : {}),
        mataPelajaran: { jenjangId: kepala.jenjangId },
      },
    }),
    prisma.pengampuMataPelajaran.count({
      where: {
        ...(activeTA ? { tahunAjaranId: activeTA.id } : {}),
        mataPelajaran: { jenjangId: kepala.jenjangId },
        nilaiDirilis: true,
      },
    }),
  ])

  // Hitung agregasi absensi santri hari ini
  const santriHadir = presensiSantriToday.filter((p) => p.status === "HADIR").length
  const santriTerlambat = presensiSantriToday.filter((p) => p.status === "TERLAMBAT").length
  const santriIzin = presensiSantriToday.filter((p) => p.status === "IZIN").length
  const santriSakit = presensiSantriToday.filter((p) => p.status === "SAKIT").length
  const santriAlpa = presensiSantriToday.filter((p) => p.status === "ALPA").length

  // Hitung agregasi absensi guru hari ini
  const guruHadir = presensiGuruToday.filter((p) => p.status === "HADIR").length
  const guruTerlambat = presensiGuruToday.filter((p) => p.status === "TERLAMBAT").length
  const guruIzin = presensiGuruToday.filter((p) => p.status === "IZIN").length
  const guruSakit = presensiGuruToday.filter((p) => p.status === "SAKIT").length
  const guruAlpa = presensiGuruToday.filter((p) => p.status === "ALPA").length

  const persenSantri = jumlahSantriAktif > 0 ? Math.round(((santriHadir + santriTerlambat) / jumlahSantriAktif) * 100) : 0
  const persenGuru = jumlahGuru > 0 ? Math.round(((guruHadir + guruTerlambat) / jumlahGuru) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Banner Sambutan Kepala Madrasah */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 sm:p-6 rounded-2xl border border-amber-200 dark:border-amber-900/40 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </span>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Dashboard Eksekutif Kepala Madrasah
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Selamat datang, <strong className="text-foreground">{kepala.nama}</strong>. Berikut adalah ringkasan performa akademik dan operasional madrasah/pesantren hari ini.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTA && (
            <Badge variant="outline" className="text-xs bg-card font-semibold border-amber-500/30 text-amber-700 dark:text-amber-400">
              T.A. {activeTA.nama}
            </Badge>
          )}
          {activeSemester && (
            <Badge variant="outline" className="text-xs bg-card font-semibold">
              Semester {activeSemester.nama}
            </Badge>
          )}
        </div>
      </div>

      {/* Grid 4 Metrik Utama */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-xl border border-border shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Santri Aktif</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{jumlahSantriAktif}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Total santri terdaftar</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Tenaga Pendidik</span>
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{jumlahGuru}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Ustadz & Guru aktif</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Rombel Kelas</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{jumlahKelas}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Kelas formal aktif</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Mata Pelajaran</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <BarChart2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{jumlahMapel}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Kurikulum Kemenag/KBM</div>
        </div>
      </div>

      {/* Grid 2 Kolom: Kehadiran Hari Ini & Progres Penilaian */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom 1: Presensi Hari Ini */}
        <div className="bg-card p-5 rounded-2xl border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h2 className="text-base font-bold text-foreground">Kehadiran Hari Ini</h2>
              <span className="text-xs text-muted-foreground">
                Presensi RFID & Gerbang ({new Date().toLocaleDateString("id-ID", { dateStyle: "full" })})
              </span>
            </div>
            <Link href="/guru/kepala-sekolah/rekap-kehadiran">
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary">
                <span>Detail</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {/* Bar Santri */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                Presensi Santri
              </span>
              <span className="font-bold text-foreground">{persenSantri}% Hadir</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden flex">
              <div style={{ width: `${persenSantri}%` }} className="bg-primary h-full" />
            </div>
            <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground pt-1">
              <span>Hadir: <strong className="text-foreground">{santriHadir}</strong></span>
              <span>Terlambat: <strong className="text-amber-600">{santriTerlambat}</strong></span>
              <span>Izin: <strong className="text-blue-600">{santriIzin}</strong></span>
              <span>Sakit: <strong className="text-yellow-600">{santriSakit}</strong></span>
              <span>Alpa: <strong className="text-destructive">{santriAlpa}</strong></span>
            </div>
          </div>

          {/* Bar Guru */}
          <div className="space-y-2 pt-3 border-t border-border/60">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" />
                Presensi Guru
              </span>
              <span className="font-bold text-foreground">{persenGuru}% Hadir</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden flex">
              <div style={{ width: `${persenGuru}%` }} className="bg-primary h-full" />
            </div>
            <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground pt-1">
              <span>Hadir: <strong className="text-foreground">{guruHadir}</strong></span>
              <span>Terlambat: <strong className="text-amber-600">{guruTerlambat}</strong></span>
              <span>Izin: <strong className="text-blue-600">{guruIzin}</strong></span>
              <span>Sakit: <strong className="text-yellow-600">{guruSakit}</strong></span>
              <span>Alpa: <strong className="text-destructive">{guruAlpa}</strong></span>
            </div>
          </div>
        </div>

        {/* Kolom 2: Status Penilaian & Approval Rapor */}
        <div className="bg-card p-5 rounded-2xl border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h2 className="text-base font-bold text-foreground">Supervisi Rapor & Nilai</h2>
              <span className="text-xs text-muted-foreground">Progres penilaian semester aktif</span>
            </div>
            <Link href="/guru/kepala-sekolah/penilaian">
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary">
                <span>Kelola Rapor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-muted/40 rounded-xl border border-border/70 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground font-medium">Status Rilis Rapor</div>
                <div className="text-lg font-bold text-foreground mt-0.5">
                  {pengampuDirilis} / {totalPengampu} Mapel Dirilis
                </div>
              </div>
              <Badge className={pengampuDirilis === totalPengampu && totalPengampu > 0 ? "bg-primary/10 text-primary border-primary/20" : "bg-amber-500/15 text-amber-700 border-amber-500/30"}>
                {pengampuDirilis === totalPengampu && totalPengampu > 0 ? "Lengkap" : "Dalam Proses"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link href="/guru/kepala-sekolah/jadwal-pelajaran" className="p-3 bg-card hover:bg-muted/50 rounded-xl border border-border transition-colors flex items-center gap-2.5">
                <CalendarDays className="w-4 h-4 text-primary" />
                <div className="text-xs">
                  <div className="font-semibold text-foreground">Jadwal KBM</div>
                  <span className="text-muted-foreground text-[11px]">Supervisi kelas</span>
                </div>
              </Link>

              <Link href="/guru/kepala-sekolah/kalender-pendidikan" className="p-3 bg-card hover:bg-muted/50 rounded-xl border border-border transition-colors flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <div className="text-xs">
                  <div className="font-semibold text-foreground">Kaldik Kemenag</div>
                  <span className="text-muted-foreground text-[11px]">Agenda madrasah</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
