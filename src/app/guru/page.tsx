import { getLoggedInGuru } from "@/lib/auth"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { getSelectedSemester } from "@/lib/ta-context"
import { JadwalView, JadwalItem } from "@/components/jadwal/jadwal-view"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { GuruCheckoutButton } from "./guru-checkout-button"
import { isHariLibur } from "@/lib/holiday-utils"
import { ProfilePhotoUploader } from "@/components/profile-photo-uploader"
import { uploadGuruProfilePhoto, deleteGuruProfilePhoto } from "./actions"
import { 
  CheckCircle2, AlertCircle, Clock, BookOpen, 
  Users, Calendar, ArrowRight, ShieldCheck, 
  CalendarDays, ClipboardCheck, User, BarChart2,
  UserCheck, ClipboardList, IdCard
} from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function GuruDashboardPage() {
  const guru = await getLoggedInGuru()
  const activeSemester = await getSelectedSemester()

  // Ambil kehadiran hari ini (sesuai zona waktu WIB)
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const nowWib = new Date(utc + 7 * 3600000)
  const todayStr = nowWib.toISOString().split("T")[0]
  const todayDate = new Date(todayStr)
  
  const [kehadiranToday, recentKehadiran, waliKelasList, mapelList, fullGuru, rawJadwalData, holidayToday, piketAssignments] = await Promise.all([
    prisma.kehadiranGuru.findUnique({
      where: {
        guruId_tanggal: {
          guruId: guru.id,
          tanggal: todayDate,
        }
      }
    }),
    prisma.kehadiranGuru.findMany({
      where: { guruId: guru.id },
      orderBy: { tanggal: 'desc' },
      take: 7,
    }),
    prisma.kelasFormal.findMany({
      where: { waliKelasId: guru.id },
      include: {
        jenjang: true,
        tahunAjaran: true,
        _count: { select: { anggota: true } }
      }
    }),
    prisma.pengampuMataPelajaran.findMany({
      where: { guruId: guru.id },
      include: {
        mataPelajaran: true,
        kelasFormal: { include: { jenjang: true } },
        tahunAjaran: true
      },
      take: 8
    }),
    prisma.guru.findUnique({
      where: { id: guru.id },
      select: {
        nuptk: true,
        noTelepon: true,
        alamatLengkap: true,
        pendidikanTerakhir: true,
        statusPegawai: true
      }
    }),
    prisma.jadwalPelajaran.findMany({
      where: {
        pengampu: {
          guruId: guru.id,
          ...(activeSemester ? { tahunAjaranId: activeSemester.tahunAjaranId } : {})
        },
        ...(activeSemester ? { semesterId: activeSemester.id } : {})
      },
      include: {
        pengampu: {
          include: {
            mataPelajaran: true,
            kelasFormal: {
              include: { jenjang: true }
            }
          }
        },
        semester: {
          include: { tahunAjaran: true }
        }
      },
      orderBy: [
        { jamMulai: 'asc' }
      ]
    }),
    isHariLibur(todayStr),
    prisma.guruPiket.findMany({
      where: {
        guruId: guru.id,
        ...(activeSemester ? { tahunAjaranId: activeSemester.tahunAjaranId } : {})
      }
    }),
  ])

  const isGuruPiket = piketAssignments.length > 0
  const piketHariList = piketAssignments.map(p => p.hari)
  const mapDayIdxToHari: Record<number, string> = {
    0: "MINGGU",
    1: "SENIN",
    2: "SELASA",
    3: "RABU",
    4: "KAMIS",
    5: "JUMAT",
    6: "SABTU",
  }
  const todayHariKey = mapDayIdxToHari[nowWib.getDay()]
  const isPiketToday = piketHariList.includes(todayHariKey as any)

  const finalRawJadwal = rawJadwalData

  const jadwalList: JadwalItem[] = finalRawJadwal.map((j) => ({
    id: j.id,
    hari: j.hari as any,
    jamMulai: j.jamMulai,
    jamSelesai: j.jamSelesai,
    semester: j.semester ? {
      nama: j.semester.nama,
      tahunAjaran: j.semester.tahunAjaran ? { nama: j.semester.tahunAjaran.nama } : undefined
    } : null,
    pengampu: {
      mataPelajaran: {
        id: j.pengampu.mataPelajaran.id,
        nama: j.pengampu.mataPelajaran.nama,
        kode: j.pengampu.mataPelajaran.kode
      },
      kelasFormal: j.pengampu.kelasFormal ? {
        id: j.pengampu.kelasFormal.id,
        namaKelas: j.pengampu.kelasFormal.namaKelas,
        jenjang: j.pengampu.kelasFormal.jenjang ? {
          singkatan: j.pengampu.kelasFormal.jenjang.singkatan,
          nama: j.pengampu.kelasFormal.jenjang.nama
        } : null
      } : null
    }
  }))

  // Cek apakah guru adalah wali kelas
  const isWaliKelas = waliKelasList.length > 0
  let waliKelasData = null

  if (isWaliKelas) {
    const primaryWaliKelas = waliKelasList[0]
    const riwayatAnggota = await prisma.riwayatKelas.findMany({
      where: { kelasFormalId: primaryWaliKelas.id },
      include: {
        santri: {
          include: {
            kehadiranHarian: {
              where: { tanggal: todayDate }
            }
          }
        }
      },
      orderBy: { santri: { namaLengkap: 'asc' } }
    })

    const summary = {
      total: riwayatAnggota.length,
      hadir: 0,
      sakit: 0,
      izin: 0,
      alpa: 0,
      belumAbsen: 0
    }

    const absentList: { id: number; nama: string; nisn: string; status: string; keterangan: string | null }[] = []

    riwayatAnggota.forEach(r => {
      const k = r.santri.kehadiranHarian[0]
      const status = k?.status || null
      if (status === 'HADIR') summary.hadir++
      else if (status === 'SAKIT') {
        summary.sakit++
        absentList.push({ id: r.santri.id, nama: r.santri.namaLengkap, nisn: r.santri.nisn, status: 'SAKIT', keterangan: k?.keterangan || null })
      }
      else if (status === 'IZIN') {
        summary.izin++
        absentList.push({ id: r.santri.id, nama: r.santri.namaLengkap, nisn: r.santri.nisn, status: 'IZIN', keterangan: k?.keterangan || null })
      }
      else if (status === 'ALPA') {
        summary.alpa++
        absentList.push({ id: r.santri.id, nama: r.santri.namaLengkap, nisn: r.santri.nisn, status: 'ALPA', keterangan: k?.keterangan || null })
      }
      else {
        summary.belumAbsen++
      }
    })

    const persentaseHadir = summary.total > 0 ? Math.round((summary.hadir / summary.total) * 100) : 0

    waliKelasData = {
      kelas: primaryWaliKelas,
      summary,
      absentList,
      persentaseHadir
    }
  }

  const statusKehadiranBadge = () => {
    if (!kehadiranToday) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <AlertCircle className="w-3.5 h-3.5" /> Belum Presensi
        </span>
      )
    }

    switch (kehadiranToday.status) {
      case "HADIR":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Hadir Hari Ini
          </span>
        )
      case "IZIN":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Clock className="w-3.5 h-3.5" /> Izin
          </span>
        )
      case "SAKIT":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> Sakit
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> {kehadiranToday.status}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-6 sm:p-8 border border-primary/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
            <ProfilePhotoUploader
              currentPhotoUrl={guru.fotoWajah}
              userName={guru.nama}
              onUpload={uploadGuruProfilePhoto}
              onDelete={deleteGuruProfilePhoto}
              size="md"
            />
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md bg-primary/20 text-primary text-[11px] font-bold uppercase tracking-wider">
                  Tenaga Pendidik
                </span>
                {isWaliKelas && (
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-bold border border-blue-500/20 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Wali Kelas {waliKelasList[0]?.namaKelas}
                  </span>
                )}
                {isGuruPiket && (
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-md text-[11px] font-bold border flex items-center gap-1",
                    isPiketToday
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                      : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                  )}>
                    <UserCheck className="w-3.5 h-3.5" /> 
                    Guru Piket {isPiketToday ? "(Bertugas Hari Ini)" : `(${piketHariList.map(h => h.charAt(0) + h.slice(1).toLowerCase()).join(", ")})`}
                  </span>
                )}
                {statusKehadiranBadge()}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Ahlan wa Sahlan, {guru.nama}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                Selamat datang di portal akademik guru SAPA. Pantau jadwal mengajar harian, absensi santri binaan, dan status presensi Anda.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {isWaliKelas && (
              <Link
                href="/guru/rekap-kehadiran"
                className="inline-flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 font-semibold px-4 py-2.5 rounded-xl shadow-2xs transition-colors text-sm"
              >
                <ClipboardCheck className="w-4 h-4" /> Rekap Siswa Binaan
              </Link>
            )}
            <Link
              href="/guru/profil"
              className="inline-flex items-center gap-2 bg-card hover:bg-muted text-foreground border border-border font-semibold px-4 py-2.5 rounded-xl shadow-2xs transition-colors text-sm"
            >
              <User className="w-4 h-4 text-primary" /> Profil Guru
            </Link>
            <Link
              href="/guru/jadwal"
              className="inline-flex items-center gap-2 bg-card hover:bg-muted text-foreground border border-border font-semibold px-4 py-2.5 rounded-xl shadow-2xs transition-colors text-sm"
            >
              <CalendarDays className="w-4 h-4 text-primary" /> Jadwal Mengajar
            </Link>
            <Link
              href="/guru/penilaian"
              className="inline-flex items-center gap-2 bg-card hover:bg-muted text-foreground border border-border font-semibold px-4 py-2.5 rounded-xl shadow-2xs transition-colors text-sm"
            >
              <BarChart2 className="w-4 h-4 text-primary" /> Penilaian
            </Link>
            {waliKelasList.length > 0 && (
              <Link
                href="/guru/rekap-kehadiran"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors text-sm"
              >
                <ClipboardCheck className="w-4 h-4" /> Rekap Kehadiran
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Kartu Khusus Guru Piket */}
      {isGuruPiket && (
        <div className={cn(
          "rounded-2xl p-5 border relative overflow-hidden transition-all shadow-xs",
          isPiketToday
            ? "bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/30"
            : "bg-card border-border"
        )}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs",
                isPiketToday
                  ? "bg-emerald-600 text-white"
                  : "bg-primary/10 text-primary"
              )}>
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-base text-foreground">
                    Penugasan Guru Piket
                  </h3>
                  {isPiketToday ? (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white">
                      Hari Ini Bertugas
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">
                      Jadwal: {piketHariList.map((h) => h.charAt(0) + h.slice(1).toLowerCase()).join(", ")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Akses menu piket untuk memonitor jadwal seluruh kelas, mencatat absensi santri manual, dan mencetak kartu identitas.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <Link
                href="/guru/piket/jadwal"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-card hover:bg-muted text-foreground border border-border shadow-xs transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Jadwal Sekolah
              </Link>
              <Link
                href="/guru/piket/rekap-kehadiran"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-card hover:bg-muted text-foreground border border-border shadow-xs transition-colors"
              >
                <ClipboardList className="w-3.5 h-3.5 text-primary" />
                Rekap Kehadiran
              </Link>
              <Link
                href="/guru/piket/kartu-identitas"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-card hover:bg-muted text-foreground border border-border shadow-xs transition-colors"
              >
                <IdCard className="w-3.5 h-3.5 text-primary" />
                Kartu Identitas
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Banner Peringatan Hari Libur jika hari ini libur */}
      {holidayToday.isLibur && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Hari Ini Libur: {holidayToday.namaLibur}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-amber-500/20 text-amber-800 dark:text-amber-300">
                {holidayToday.tipeLibur === "MINGGUAN" ? "Libur Rutin" : holidayToday.tipeLibur === "SEMESTER" ? "Libur Semester" : "Libur Nasional"}
              </span>
            </div>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
              {holidayToday.tipeLibur === "SEMESTER"
                ? "Libur Semester — Presensi kehadiran mesin RFID tetap aktif jika Anda bertugas atau memiliki kegiatan di madrasah."
                : "Tidak ada jam tatap muka KBM reguler hari ini. Selamat beristirahat bersama keluarga!"}
            </p>
          </div>
        </div>
      )}

      {/* Check Out Mandiri Guru */}
      <GuruCheckoutButton
        hasCheckedIn={!!kehadiranToday}
        jamMasuk={kehadiranToday?.jamMasuk ? kehadiranToday.jamMasuk.toISOString() : null}
        jamPulang={kehadiranToday?.jamPulang ? kehadiranToday.jamPulang.toISOString() : null}
      />

      {/* Grid Statistik / Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Status Kehadiran Guru Hari Ini */}
        <div className="bg-card rounded-xl p-5 border border-border shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Presensi Anda Hari Ini</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-foreground">
              {kehadiranToday?.status || "Belum Terisi"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kehadiranToday 
                ? `Masuk: ${kehadiranToday.jamMasuk ? new Date(kehadiranToday.jamMasuk).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"} WIB${kehadiranToday.jamPulang ? ` • Pulang: ${new Date(kehadiranToday.jamPulang).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB` : ""}`
                : "Gunakan mesin scan RFID atau hubungi admin"}
            </p>
          </div>
        </div>

        {/* Card 2: Kelas Wali */}
        <div className="bg-card rounded-xl p-5 border border-border shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Status Wali Kelas</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-foreground">
              {waliKelasList.length > 0 ? waliKelasList.map(w => w.namaKelas).join(", ") : "Bukan Wali Kelas"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {waliKelasList.length > 0 
                ? `${waliKelasList.reduce((acc, curr) => acc + curr._count.anggota, 0)} Santri bimbingan` 
                : "Tugas mengajar reguler"}
            </p>
          </div>
          {isWaliKelas && (
            <div className="mt-3 pt-2.5 border-t border-border/60">
              <Link href="/guru/rekap-kehadiran" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                Kelola Presensi Siswa <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Card 3: Jadwal Mengajar */}
        <div className="bg-card rounded-xl p-5 border border-border shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Jadwal Mengajar</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">
              {jadwalList.length} <span className="text-xs font-normal text-muted-foreground">Sesi / Minggu</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {mapelList.length} Mata Pelajaran Diampu
            </p>
          </div>
        </div>

        {/* Card 4: Jenjang Mengajar */}
        <div className="bg-card rounded-xl p-5 border border-border shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Unit Jenjang</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-foreground truncate">
              {guru.jenjangs && guru.jenjangs.length > 0 
                ? guru.jenjangs.map((j: any) => j.singkatan || j.nama).join(", ") 
                : "Semua Jenjang"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pondok Pesantren
            </p>
          </div>
        </div>

      </div>

      {/* SECTION KHUSUS WALI KELAS: REKAP KEHADIRAN SISWA HARI INI */}
      {isWaliKelas && waliKelasData && (
        <div className="bg-card rounded-2xl p-5 sm:p-6 border border-border shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Tugas Wali Kelas
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Kelas {waliKelasData.kelas.namaKelas} &middot; {waliKelasData.kelas.jenjang?.singkatan}
                </span>
              </div>
              <h2 className="text-lg font-bold text-foreground">
                Rekap Kehadiran Siswa Hari Ini
              </h2>
              <p className="text-xs text-muted-foreground">
                Ringkasan absensi harian santri kelas binaan Anda per {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}.
              </p>
            </div>

            <Link href="/guru/rekap-kehadiran">
              <Button size="sm" variant="outline" className="gap-2 text-xs font-semibold shadow-2xs">
                <ClipboardCheck className="w-4 h-4 text-primary" /> Buka Rekap & Presensi Lengkap <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {/* Mini Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            <div className="bg-muted/40 p-3 rounded-xl border border-border/60">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Total Siswa</span>
              <p className="text-xl font-bold text-foreground mt-0.5">{waliKelasData.summary.total}</p>
            </div>
            <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Hadir</span>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{waliKelasData.summary.hadir}</p>
            </div>
            <div className="bg-orange-500/10 p-3 rounded-xl border border-orange-500/20">
              <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 uppercase">Sakit</span>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400 mt-0.5">{waliKelasData.summary.sakit}</p>
            </div>
            <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase">Izin</span>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">{waliKelasData.summary.izin}</p>
            </div>
            <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
              <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 uppercase">Alpa</span>
              <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">{waliKelasData.summary.alpa}</p>
            </div>
            <div className="bg-muted/40 p-3 rounded-xl border border-border/60">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Belum Absen</span>
              <p className="text-xl font-bold text-muted-foreground mt-0.5">{waliKelasData.summary.belumAbsen}</p>
            </div>
          </div>

          {/* Santri yang absen hari ini jika ada */}
          {waliKelasData.absentList.length > 0 ? (
            <div className="mt-2 p-3.5 bg-muted/30 rounded-xl border border-border/60">
              <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Santri yang Tidak Hadir Hari Ini ({waliKelasData.absentList.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {waliKelasData.absentList.map(a => (
                  <div key={a.id} className="p-2 rounded-lg bg-card border border-border text-xs flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-foreground block">{a.nama}</span>
                      <span className="text-[10px] text-muted-foreground">{a.keterangan || a.nisn}</span>
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      a.status === 'SAKIT' && "bg-orange-500/10 text-orange-600 dark:text-orange-400",
                      a.status === 'IZIN' && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                      a.status === 'ALPA' && "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    )}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            waliKelasData.summary.belumAbsen === 0 && (
              <div className="mt-1 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4" /> MasyaAllah, seluruh santri kelas binaan Anda hadir lengkap hari ini (100% Hadir).
              </div>
            )
          )}
        </div>
      )}

      {/* Bagian Jadwal Pelajaran Utama (Sesuai Mapel Diampu Guru) */}
      <div className="bg-card rounded-2xl p-5 sm:p-6 border border-border shadow-2xs">
        <JadwalView 
          jadwalList={jadwalList} 
          mode="GURU" 
          title="Jadwal Mengajar Anda" 
          subtitle="Jadwal waktu mengajar berdasarkan pelajaran dan kelas yang Anda ampu."
        />
      </div>

      {/* Akses Cepat & Riwayat Kehadiran Guru */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Pintasan Aksi & Riwayat Kehadiran */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Action Cards */}
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Layanan & Alat Bantu Cepat
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <Link 
                href="/guru/jadwal" 
                className="group p-5 bg-card hover:bg-accent/40 rounded-xl border border-border hover:border-primary/40 shadow-2xs transition-all flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                      Jadwal Mengajar
                    </h3>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    Lihat agenda jadwal mengajar mingguan dan pembagian jam tatap muka kelas.
                  </p>
                </div>
              </Link>

              <Link 
                href="/guru/penilaian" 
                className="group p-5 bg-card hover:bg-accent/40 rounded-xl border border-border hover:border-primary/40 shadow-2xs transition-all flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <BarChart2 className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                      Penilaian Siswa
                    </h3>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    Input nilai kurikuler, tes sumatif, dan nilai akhir siswa per mata pelajaran.
                  </p>
                </div>
              </Link>

            </div>
          </div>

          {/* Tabel Riwayat Kehadiran Terakhir */}
          <div className="bg-card rounded-xl border border-border shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-foreground">Riwayat Presensi Guru</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Catatan kehadiran terbaru Anda di sistem</p>
              </div>
            </div>

            <div className="divide-y divide-border">
              {recentKehadiran.length > 0 ? (
                recentKehadiran.map((kh) => (
                  <div key={kh.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs font-semibold">
                        {new Date(kh.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-foreground">
                          {new Date(kh.tanggal).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Jam scan: {new Date(kh.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                        </div>
                      </div>
                    </div>

                    <div>
                      {kh.status === "HADIR" ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          Hadir
                        </span>
                      ) : kh.status === "IZIN" ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          Izin
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          {kh.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  Belum ada rekaman riwayat presensi terbaru.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Kolom Kanan: Profil Biodata & Daftar Pengampu Mapel */}
        <div className="space-y-6">
          
          {/* Biodata Ringkas */}
          <div className="bg-card rounded-xl p-5 border border-border shadow-2xs">
            <h3 className="font-bold text-sm text-foreground mb-4">Biodata Pendidik</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-muted-foreground">NIP / NUPTK</span>
                <span className="font-semibold text-foreground">{guru.nip || fullGuru?.nuptk || "-"}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-muted-foreground">Email Akun</span>
                <span className="font-semibold text-foreground truncate max-w-[180px]">{guru.email}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-muted-foreground">Status Pegawai</span>
                <span className="font-semibold text-foreground">{fullGuru?.statusPegawai || "Aktif"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pendidikan</span>
                <span className="font-semibold text-foreground">{fullGuru?.pendidikanTerakhir || "-"}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/60">
              <Link href="/guru/profil" className="text-xs font-semibold text-primary hover:underline flex items-center justify-between">
                <span>Lihat Profil Lengkap Guru</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Daftar Mata Pelajaran */}
          <div className="bg-card rounded-xl p-5 border border-border shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-foreground">Daftar Pengampu</h3>
              <span className="text-[11px] text-muted-foreground">{mapelList.length} Mapel</span>
            </div>
            
            <div className="space-y-2.5">
              {mapelList.length > 0 ? (
                mapelList.map((m) => (
                  <Link 
                    key={m.id} 
                    href={`/guru/penilaian/${m.id}`}
                    className="p-2.5 rounded-lg bg-muted/40 border border-border/50 text-xs flex items-center justify-between hover:bg-muted/70 transition-colors group block"
                  >
                    <div>
                      <div className="font-semibold text-foreground group-hover:text-primary transition-colors">{m.mataPelajaran.nama}</div>
                      <div className="text-[10px] text-muted-foreground">
                        Kelas {m.kelasFormal.namaKelas} &middot; {m.kelasFormal.jenjang.singkatan}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {m.kkm && (
                        <span className="px-2 py-0.5 rounded bg-background text-[10px] font-bold text-muted-foreground border border-border">
                          KKM {m.kkm}
                        </span>
                      )}
                      <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-xs text-muted-foreground text-center py-4">
                  Belum ada penugasan mata pelajaran formal.
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-border/60">
              <Link href="/guru/penilaian" className="text-xs font-semibold text-primary hover:underline flex items-center justify-between">
                <span>Kelola Semua Penilaian Santri</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
