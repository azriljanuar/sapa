import { getLoggedInGuru } from "@/lib/auth"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { 
  User, BookOpen, GraduationCap, Calendar, Phone, 
  MapPin, ShieldCheck, Mail, Briefcase, Award, ArrowLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProfilePhotoUploader } from "@/components/profile-photo-uploader"
import { uploadGuruProfilePhoto, deleteGuruProfilePhoto } from "@/app/guru/actions"

export const dynamic = 'force-dynamic'

export const metadata = {
  title: "Profil Guru - SAPA",
  description: "Biodata dan data kepegawaian tenaga pendidik",
}

export default async function GuruProfilPage() {
  const sessionGuru = await getLoggedInGuru()

  const fullGuru = await prisma.guru.findUnique({
    where: { id: sessionGuru.id },
    include: {
      jenjangs: true,
      waliKelas: {
        include: {
          jenjang: true,
          tahunAjaran: true,
          _count: { select: { anggota: true } }
        }
      },
      pengampu: {
        include: {
          mataPelajaran: true,
          kelasFormal: { include: { jenjang: true } },
          tahunAjaran: true
        }
      }
    }
  })

  if (!fullGuru) {
    return <div className="p-8 text-center text-muted-foreground">Data guru tidak ditemukan.</div>
  }

  const calculateAge = (birthDate: Date | null) => {
    if (!birthDate) return null
    const diff = Date.now() - new Date(birthDate).getTime()
    const ageDt = new Date(diff)
    return Math.abs(ageDt.getUTCFullYear() - 1970)
  }

  const age = calculateAge(fullGuru.tanggalLahir)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header Profil Banner */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-6 sm:p-8 border border-primary/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          
          {/* Avatar Guru dengan Uploader */}
          <div className="shrink-0 flex flex-col items-center">
            <ProfilePhotoUploader
              currentPhotoUrl={fullGuru.fotoWajah}
              userName={fullGuru.nama}
              onUpload={uploadGuruProfilePhoto}
              onDelete={deleteGuruProfilePhoto}
              size="lg"
            />
          </div>

          {/* Info Utama */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-primary/20 text-primary text-[11px] font-bold uppercase tracking-wider">
                Tenaga Pendidik
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-muted text-foreground text-[11px] font-semibold border border-border">
                {fullGuru.statusPegawai || "Aktif"}
              </span>
              {fullGuru.waliKelas.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-semibold border border-blue-500/20">
                  Wali Kelas {fullGuru.waliKelas.map(w => w.namaKelas).join(", ")}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {fullGuru.nama}
            </h1>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-xs text-muted-foreground">
              <span className="font-mono font-medium">NIP: <strong className="text-foreground">{fullGuru.nip || fullGuru.nuptk || "-"}</strong></span>
              <span>&middot;</span>
              <span>Email: <strong className="text-foreground">{fullGuru.email}</strong></span>
              {fullGuru.jenjangs.length > 0 && (
                <>
                  <span>&middot;</span>
                  <span>Unit {fullGuru.jenjangs.map(j => j.singkatan).join(", ")}</span>
                </>
              )}
            </div>
          </div>

          {/* Tombol Kembali ke Dashboard */}
          <div className="shrink-0">
            <Link href="/guru">
              <Button variant="outline" size="sm" className="gap-2 text-xs font-semibold shadow-2xs">
                <ArrowLeft className="w-3.5 h-3.5" /> Dashboard Guru
              </Button>
            </Link>
          </div>

        </div>
      </div>

      {/* Grid Informasi Biodata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Kolom 1: Data Identitas Pribadi */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Data Pribadi Pendidik</h3>
              <p className="text-[11px] text-muted-foreground">Identitas resmi dan nomor kependudukan</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Nama Lengkap & Gelar</span>
              <span className="font-semibold text-foreground text-right">{fullGuru.nama}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">NIP</span>
              <span className="font-mono font-semibold text-foreground text-right">{fullGuru.nip || "-"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">NUPTK</span>
              <span className="font-mono font-semibold text-foreground text-right">{fullGuru.nuptk || "-"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">NI-PPPK</span>
              <span className="font-mono font-semibold text-foreground text-right">{fullGuru.niPPPK || "-"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">NIK (KTP)</span>
              <span className="font-mono font-semibold text-foreground text-right">{fullGuru.nik || "-"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Jenis Kelamin</span>
              <span className="font-semibold text-foreground text-right">
                {fullGuru.jenisKelamin === 'L' ? 'Laki-laki' : fullGuru.jenisKelamin === 'P' ? 'Perempuan' : fullGuru.jenisKelamin || '-'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Tempat, Tanggal Lahir</span>
              <span className="font-semibold text-foreground text-right">
                {fullGuru.tempatLahir || "-"}, {fullGuru.tanggalLahir ? new Date(fullGuru.tanggalLahir).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                {age !== null && ` (${age} tahun)`}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Agama</span>
              <span className="font-semibold text-foreground text-right">{fullGuru.agama || "Islam"}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Nama Ibu Kandung</span>
              <span className="font-semibold text-foreground text-right">{fullGuru.namaIbuKandung || "-"}</span>
            </div>
          </div>
        </div>

        {/* Kolom 2: Kepegawaian & Pendidikan */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Kepegawaian & Kualifikasi</h3>
              <p className="text-[11px] text-muted-foreground">Status kepegawaian dan riwayat pendidikan</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Status Pegawai</span>
              <span className="font-semibold text-foreground text-right">{fullGuru.statusPegawai || "Pegawai Tetap"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Pendidikan Terakhir</span>
              <span className="font-semibold text-foreground text-right">{fullGuru.pendidikanTerakhir || "-"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Jurusan / Program Studi</span>
              <span className="font-semibold text-foreground text-right">{fullGuru.jurusan || "-"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">TMT (Tanggal Mulai Tugas)</span>
              <span className="font-semibold text-foreground text-right">
                {fullGuru.tmt ? new Date(fullGuru.tmt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Unit Jenjang Mengajar</span>
              <span className="font-semibold text-foreground text-right">
                {fullGuru.jenjangs.length > 0 
                  ? fullGuru.jenjangs.map(j => j.nama).join(", ") 
                  : "Semua Jenjang"}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Tugas Wali Kelas</span>
              <span className="font-semibold text-foreground text-right">
                {fullGuru.waliKelas.length > 0 
                  ? fullGuru.waliKelas.map(w => `Kelas ${w.namaKelas} (${w.jenjang?.singkatan})`).join(", ") 
                  : "Tidak Ada"}
              </span>
            </div>
          </div>
        </div>

        {/* Kolom 3: Kontak & Komunikasi */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Kontak & Domisili</h3>
              <p className="text-[11px] text-muted-foreground">Saluran komunikasi aktif dan alamat tempat tinggal</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Email Akun SAPA</span>
              <span className="font-semibold text-foreground text-right">{fullGuru.email}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Nomor Telepon / WhatsApp</span>
              <span className="font-semibold text-foreground text-right">{fullGuru.noTelepon || "-"}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Alamat Lengkap</span>
              <span className="font-medium text-foreground text-right max-w-xs">{fullGuru.alamatLengkap || "-"}</span>
            </div>
          </div>
        </div>

        {/* Kolom 4: Ringkasan Pengampu Mapel */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Pengampu Mata Pelajaran</h3>
                <p className="text-[11px] text-muted-foreground">{fullGuru.pengampu.length} penugasan kelas formal</p>
              </div>
            </div>
            <Link href="/guru/jadwal">
              <Button size="sm" variant="ghost" className="text-xs text-primary font-semibold h-7 px-2">
                Jadwal
              </Button>
            </Link>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
            {fullGuru.pengampu.length > 0 ? (
              fullGuru.pengampu.map(p => (
                <div key={p.id} className="p-2.5 rounded-xl bg-muted/40 border border-border/60 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground block">{p.mataPelajaran.nama}</span>
                    <span className="text-[10px] text-muted-foreground">
                      Kelas {p.kelasFormal.namaKelas} &middot; {p.kelasFormal.jenjang?.singkatan}
                    </span>
                  </div>
                  {p.kkm && (
                    <span className="px-2 py-0.5 rounded bg-background text-[10px] font-bold text-muted-foreground border border-border">
                      KKM {p.kkm}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground text-center py-6">
                Belum ada penugasan mata pelajaran formal.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  )
}
