import { getLoggedInSantri } from "@/lib/auth"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { getSelectedSemester, getSelectedTahunAjaran } from "@/lib/ta-context"
import { JadwalView, JadwalItem } from "@/components/jadwal/jadwal-view"
import { 
  GraduationCap, Calendar, CheckCircle2, AlertCircle, 
  Clock, User, BookOpen, ShieldCheck, CalendarDays, ArrowRight
} from "lucide-react"
import { ProfilePhotoUploader } from "@/components/profile-photo-uploader"
import { uploadSantriProfilePhoto, deleteSantriProfilePhoto } from "./actions"

export const dynamic = 'force-dynamic'

export default async function SantriDashboardPage() {
  const sessionSantri = await getLoggedInSantri()
  const activeSemester = await getSelectedSemester()
  const activeTa = await getSelectedTahunAjaran()

  const [fullSantri, riwayatList] = await Promise.all([
    prisma.santri.findUnique({
      where: { id: sessionSantri.id },
      include: {
        jenjangs: {
          include: { jenjang: true, tahunMasuk: true }
        },
        kehadiranHarian: {
          orderBy: { tanggal: 'desc' },
          take: 7,
        }
      }
    }),
    prisma.riwayatKelas.findMany({
      where: { santriId: sessionSantri.id },
      include: {
        kelasFormal: {
          include: {
            jenjang: true,
            waliKelas: true,
            tahunAjaran: true
          }
        }
      },
      orderBy: { id: 'desc' }
    })
  ])

  // Presensi hari ini
  const todayStr = new Date().toISOString().split("T")[0]
  const todayDate = new Date(todayStr)

  const kehadiranToday = await prisma.kehadiranHarianSantri.findFirst({
    where: {
      santriId: sessionSantri.id,
      tanggal: todayDate
    }
  })

  // Rekap kehadiran total
  const rekapKehadiran = await prisma.kehadiranHarianSantri.groupBy({
    by: ['status'],
    where: { santriId: sessionSantri.id },
    _count: { status: true }
  })

  const countHadir = rekapKehadiran.find(r => r.status === 'HADIR')?._count.status || 0
  const countIzin = rekapKehadiran.find(r => r.status === 'IZIN')?._count.status || 0
  const countSakit = rekapKehadiran.find(r => r.status === 'SAKIT')?._count.status || 0
  const countAlpa = rekapKehadiran.find(r => r.status === 'ALPA')?._count.status || 0

  // Cari kelas aktif
  const activeRiwayat = (activeTa 
    ? riwayatList.find(r => r.kelasFormal.tahunAjaranId === activeTa.id) 
    : null) || riwayatList[0] || null

  const activeKelas = activeRiwayat?.kelasFormal || null
  const activeJenjangInfo = fullSantri?.jenjangs?.[0]

  // Ambil Jadwal Pelajaran untuk Kelas Santri
  let rawJadwalData: any[] = []
  if (activeKelas) {
    rawJadwalData = await prisma.jadwalPelajaran.findMany({
      where: {
        pengampu: {
          kelasFormalId: activeKelas.id,
          ...(activeSemester ? { tahunAjaranId: activeSemester.tahunAjaranId } : {})
        },
        ...(activeSemester ? { semesterId: activeSemester.id } : {})
      },
      include: {
        pengampu: {
          include: {
            mataPelajaran: true,
            guru: true,
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
    })

    if (rawJadwalData.length === 0) {
      rawJadwalData = await prisma.jadwalPelajaran.findMany({
        where: {
          pengampu: {
            kelasFormalId: activeKelas.id
          }
        },
        include: {
          pengampu: {
            include: {
              mataPelajaran: true,
              guru: true,
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
      })
    }
  }

  const jadwalList: JadwalItem[] = rawJadwalData.map((j) => ({
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
      guru: j.pengampu.guru ? {
        id: j.pengampu.guru.id,
        nama: j.pengampu.guru.nama,
        nip: j.pengampu.guru.nip
      } : null,
      kelasFormal: activeKelas ? {
        id: activeKelas.id,
        namaKelas: activeKelas.namaKelas,
        jenjang: activeKelas.jenjang ? {
          singkatan: activeKelas.jenjang.singkatan,
          nama: activeKelas.jenjang.nama
        } : null
      } : null
    }
  }))

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-6 sm:p-8 border border-primary/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
            <ProfilePhotoUploader
              currentPhotoUrl={sessionSantri.fotoWajah}
              userName={sessionSantri.nama}
              onUpload={uploadSantriProfilePhoto}
              onDelete={deleteSantriProfilePhoto}
              size="md"
            />
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md bg-primary/20 text-primary text-[11px] font-bold uppercase tracking-wider">
                  Santri / Siswa Aktif
                </span>
                {activeJenjangInfo?.statusMukim && (
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-semibold border border-blue-500/20">
                    Santri Mukim (Asrama)
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Ahlan wa Sahlan, {sessionSantri.nama}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                Selamat datang di portal santri SAPA. Pantau jadwal kegiatan belajar mengajar kelas, presensi harian, dan profil akademik Anda.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Link
              href="/santri/profil"
              className="inline-flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 font-semibold px-4 py-2.5 rounded-xl shadow-2xs transition-colors text-sm"
            >
              <User className="w-4 h-4" /> Profil Santri
            </Link>

            <Link
              href="/santri/jadwal"
              className="inline-flex items-center gap-2 bg-card hover:bg-muted text-foreground border border-border font-semibold px-4 py-2.5 rounded-xl shadow-2xs transition-colors text-sm"
            >
              <CalendarDays className="w-4 h-4 text-primary" /> Jadwal Lengkap
            </Link>

            <div className="bg-card px-4 py-2.5 rounded-xl border border-border shadow-2xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">NISN</div>
                <div className="text-xs font-bold text-foreground">{sessionSantri.nisn}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Status & Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Kelas Aktif */}
        <div className="bg-card rounded-xl p-5 border border-border shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Kelas Aktif</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-foreground">
              {activeKelas ? activeKelas.namaKelas : "Belum Ditentukan"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeKelas ? `Jenjang ${activeKelas.jenjang?.singkatan || ""}` : "Hubungi operator jenjang"}
            </p>
          </div>
        </div>

        {/* Card 2: Wali Kelas */}
        <div className="bg-card rounded-xl p-5 border border-border shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Wali Kelas</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-foreground truncate">
              {activeKelas?.waliKelas?.nama || "Belum Ditentukan"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pembimbing akademik kelas
            </p>
          </div>
        </div>

        {/* Card 3: Jadwal Pelajaran Kelas */}
        <div className="bg-card rounded-xl p-5 border border-border shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Jadwal Kelas</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">
              {jadwalList.length} <span className="text-xs font-normal text-muted-foreground">Sesi / Minggu</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Mata pelajaran terjadwal
            </p>
          </div>
        </div>

        {/* Card 4: Status Presensi Hari Ini */}
        <div className="bg-card rounded-xl p-5 border border-border shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Presensi Hari Ini</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-foreground">
              {kehadiranToday?.status || "Belum Presensi"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kehadiranToday ? `Status: ${kehadiranToday.status}` : "Pencatatan melalui scanner kelas"}
            </p>
          </div>
        </div>

      </div>

      {/* Bagian Jadwal Pelajaran Kelas (Sesuai Kelas Santri) */}
      <div className="bg-card rounded-2xl p-5 sm:p-6 border border-border shadow-2xs">
        <JadwalView 
          jadwalList={jadwalList} 
          mode="SANTRI" 
          title={activeKelas ? `Jadwal Pelajaran Kelas ${activeKelas.namaKelas}` : "Jadwal Pelajaran Kelas"} 
          subtitle="Jadwal waktu kegiatan belajar mengajar sesuai kelas formal Anda."
        />
      </div>

      {/* Konten Tambahan: Riwayat Kehadiran & Biodata Santri */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Riwayat Kehadiran */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card Rekap Presensi */}
          <div className="bg-card rounded-xl border border-border shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-foreground">Riwayat Kehadiran Harian</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Catatan presensi masuk kelas terbaru Anda</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                  H: {countHadir}
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                  I: {countIzin}
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                  S: {countSakit}
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold">
                  A: {countAlpa}
                </span>
              </div>
            </div>

            <div className="divide-y divide-border">
              {fullSantri?.kehadiranHarian && fullSantri.kehadiranHarian.length > 0 ? (
                fullSantri.kehadiranHarian.map((kh) => (
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
                          {kh.keterangan || "Presensi scan harian"}
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
                      ) : kh.status === "SAKIT" ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          Sakit
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
                  Belum ada rekaman riwayat presensi harian santri.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Kolom Kanan: Profil Santri */}
        <div className="space-y-6">
          
          <div className="bg-card rounded-xl p-5 border border-border shadow-2xs">
            <h3 className="font-bold text-sm text-foreground mb-4">Biodata Santri</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-muted-foreground">Nama Lengkap</span>
                <span className="font-semibold text-foreground truncate max-w-[180px]">{fullSantri?.namaLengkap}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-muted-foreground">NISN</span>
                <span className="font-semibold text-foreground">{fullSantri?.nisn}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-muted-foreground">NIK</span>
                <span className="font-semibold text-foreground">{fullSantri?.nik || "-"}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-muted-foreground">Jenis Kelamin</span>
                <span className="font-semibold text-foreground">{fullSantri?.jenisKelamin === 'L' ? 'Laki-laki' : fullSantri?.jenisKelamin === 'P' ? 'Perempuan' : fullSantri?.jenisKelamin || '-'}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-muted-foreground">Tempat, Tgl Lahir</span>
                <span className="font-semibold text-foreground text-right truncate max-w-[180px]">
                  {fullSantri?.tempatLahir || "-"}, {fullSantri?.tanggalLahir ? new Date(fullSantri.tanggalLahir).toLocaleDateString("id-ID") : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-muted-foreground">Nama Orang Tua</span>
                <span className="font-semibold text-foreground">{fullSantri?.namaAyah || fullSantri?.namaIbu || "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status Mukim</span>
                <span className="font-semibold text-foreground">
                  {activeJenjangInfo?.statusMukim ? "Mukim di Pesantren" : "Pulang Pergi (Non-Mukim)"}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/60">
              <Link href="/santri/profil" className="text-xs font-semibold text-primary hover:underline flex items-center justify-between">
                <span>Lihat Profil Lengkap Santri</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
