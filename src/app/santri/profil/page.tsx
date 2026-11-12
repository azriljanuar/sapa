import { getLoggedInSantri } from "@/lib/auth"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { 
  User, GraduationCap, Calendar, Phone, MapPin, 
  ShieldCheck, Home as HomeIcon, Award, Heart, BookOpen, 
  ArrowLeft, CheckCircle2, AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProfilePhotoUploader } from "@/components/profile-photo-uploader"
import { uploadSantriProfilePhoto, deleteSantriProfilePhoto } from "@/app/santri/actions"

export const dynamic = 'force-dynamic'

export const metadata = {
  title: "Profil Santri - SAPA",
  description: "Biodata dan informasi data pokok santri",
}

export default async function SantriProfilPage() {
  const sessionSantri = await getLoggedInSantri()

  const fullSantri = await prisma.santri.findUnique({
    where: { id: sessionSantri.id },
    include: {
      jenjangs: {
        include: {
          jenjang: true,
          tahunMasuk: true,
          tahunLulus: true
        }
      },
      riwayatKelas: {
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
      }
    }
  })

  if (!fullSantri) {
    return <div className="p-8 text-center text-muted-foreground">Data santri tidak ditemukan.</div>
  }

  const activeRiwayat = fullSantri.riwayatKelas[0]
  const activeKelas = activeRiwayat?.kelasFormal
  const activeJenjangInfo = fullSantri.jenjangs[0]

  const calculateAge = (birthDate: Date | null) => {
    if (!birthDate) return null
    const diff = Date.now() - new Date(birthDate).getTime()
    const ageDt = new Date(diff)
    return Math.abs(ageDt.getUTCFullYear() - 1970)
  }

  const age = calculateAge(fullSantri.tanggalLahir)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header Profil Banner */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-6 sm:p-8 border border-primary/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          
          {/* Avatar Santri dengan Uploader */}
          <div className="shrink-0 flex flex-col items-center">
            <ProfilePhotoUploader
              currentPhotoUrl={fullSantri.fotoWajah}
              userName={fullSantri.namaLengkap}
              onUpload={uploadSantriProfilePhoto}
              onDelete={deleteSantriProfilePhoto}
              size="lg"
            />
          </div>

          {/* Info Utama */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-primary/20 text-primary text-[11px] font-bold uppercase tracking-wider">
                Santri Aktif
              </span>
              {activeJenjangInfo?.statusMukim ? (
                <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-semibold border border-blue-500/20">
                  Santri Mukim (Asrama)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-md bg-muted text-muted-foreground text-[11px] font-semibold border border-border">
                  Non-Mukim (Pulang Pergi)
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {fullSantri.namaLengkap}
            </h1>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-xs text-muted-foreground">
              <span className="font-mono font-medium">NISN: <strong className="text-foreground">{fullSantri.nisn}</strong></span>
              {activeKelas && (
                <>
                  <span>&middot;</span>
                  <span>Kelas <strong className="text-foreground">{activeKelas.namaKelas}</strong> ({activeKelas.jenjang?.singkatan})</span>
                </>
              )}
            </div>
          </div>

          {/* Tombol Kembali ke Beranda */}
          <div className="shrink-0">
            <Link href="/santri">
              <Button variant="outline" size="sm" className="gap-2 text-xs font-semibold shadow-2xs">
                <ArrowLeft className="w-3.5 h-3.5" /> Beranda Santri
              </Button>
            </Link>
          </div>

        </div>
      </div>

      {/* Grid Informasi Biodata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Kolom 1: Data Identitas Diri */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Data Pribadi Santri</h3>
              <p className="text-[11px] text-muted-foreground">Identitas kependudukan dan catatan kesiswaan</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Nama Lengkap</span>
              <span className="font-semibold text-foreground text-right">{fullSantri.namaLengkap}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">NISN</span>
              <span className="font-mono font-semibold text-foreground text-right">{fullSantri.nisn}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">NIK Santri</span>
              <span className="font-mono font-semibold text-foreground text-right">{fullSantri.nik || "-"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Jenis Kelamin</span>
              <span className="font-semibold text-foreground text-right">
                {fullSantri.jenisKelamin === 'L' ? 'Laki-laki (Ikhwan)' : fullSantri.jenisKelamin === 'P' ? 'Perempuan (Akhwat)' : fullSantri.jenisKelamin || '-'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Tempat, Tanggal Lahir</span>
              <span className="font-semibold text-foreground text-right">
                {fullSantri.tempatLahir || "-"}, {fullSantri.tanggalLahir ? new Date(fullSantri.tanggalLahir).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                {age !== null && ` (${age} tahun)`}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Nomor HP / WhatsApp</span>
              <span className="font-semibold text-foreground text-right">{fullSantri.noTelepon || "-"}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Alamat Domisili</span>
              <span className="font-medium text-foreground text-right max-w-xs">{fullSantri.alamat || "-"}</span>
            </div>
          </div>
        </div>

        {/* Kolom 2: Status Akademik & Kelas */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Status Akademik</h3>
              <p className="text-[11px] text-muted-foreground">Penempatan kelas dan pembimbing akademik</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Jenjang Pendidikan</span>
              <span className="font-semibold text-foreground text-right">
                {activeJenjangInfo?.jenjang?.nama || activeKelas?.jenjang?.nama || "-"}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Kelas Formal Aktif</span>
              <span className="font-semibold text-foreground text-right">
                {activeKelas ? `Kelas ${activeKelas.namaKelas}` : "Belum Ditentukan"}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Wali Kelas</span>
              <span className="font-semibold text-foreground text-right">
                {activeKelas?.waliKelas?.nama || "Belum Ditentukan"}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Tahun Masuk / Angkatan</span>
              <span className="font-semibold text-foreground text-right">
                {activeJenjangInfo?.tahunMasuk?.nama || "-"}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Status Tempat Tinggal</span>
              <span className="font-semibold text-foreground text-right">
                {activeJenjangInfo?.statusMukim ? "Santri Mukim (Tinggal di Pesantren)" : "Non-Mukim (Pulang Pergi)"}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Status Kelulusan</span>
              <span className="font-semibold text-foreground text-right">
                {activeJenjangInfo?.isAlumni ? "Alumni" : "Santri Aktif"}
              </span>
            </div>
          </div>
        </div>

        {/* Kolom 3: Data Orang Tua / Wali */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Data Orang Tua / Wali</h3>
              <p className="text-[11px] text-muted-foreground">Informasi wali dan kontak keluarga santri</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Nama Ayah Kandung</span>
              <span className="font-semibold text-foreground text-right">{fullSantri.namaAyah || "-"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Nama Ibu Kandung</span>
              <span className="font-semibold text-foreground text-right">{fullSantri.namaIbu || "-"}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">No. KIP / PIP</span>
              <span className="font-mono font-semibold text-foreground text-right">{fullSantri.noKipPip || "-"}</span>
            </div>
          </div>
        </div>

        {/* Kolom 4: Catatan Khusus & Kesehatan */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Kesehatan & Kebutuhan Khusus</h3>
              <p className="text-[11px] text-muted-foreground">Informasi medis dan kebutuhan pembelajaran</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Kebutuhan Khusus</span>
              <span className="font-semibold text-foreground text-right">{fullSantri.kebutuhanKhusus || "Tidak Ada"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Disabilitas</span>
              <span className="font-semibold text-foreground text-right">{fullSantri.disabilitas || "Tidak Ada"}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Riwayat Kesehatan</span>
              <span className="font-medium text-foreground text-right max-w-xs">{fullSantri.riwayatKesehatan || "Normal"}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bagian Riwayat Perjalanan Kelas (Multi-Tahun) */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Jejak Riwayat Kelas & Kenaikan</h3>
              <p className="text-[11px] text-muted-foreground">Rekam jejak kelas dan wali kelas dari setiap tahun ajaran</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            Total {fullSantri.riwayatKelas.length} Periode Kelas
          </span>
        </div>

        <div className="divide-y divide-border/60">
          {fullSantri.riwayatKelas.length > 0 ? (
            fullSantri.riwayatKelas.map((rw: any) => {
              const k = rw.kelasFormal
              const isAktif = rw.statusKenaikan === "AKTIF"
              const isNaik = rw.statusKenaikan === "NAIK_KELAS"
              const isTinggal = rw.statusKenaikan === "TINGGAL_KELAS"
              const isLulus = rw.statusKenaikan === "LULUS"

              return (
                <div key={rw.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 px-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center font-bold text-sm text-foreground">
                      {k?.namaKelas?.split(" ")[0] || "KL"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{k?.namaKelas || "Kelas"}</span>
                        <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-mono text-muted-foreground border border-border">
                          TA {k?.tahunAjaran?.nama || "-"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Wali Kelas: <span className="font-medium text-foreground">{k?.waliKelas?.nama || "Belum Ditentukan"}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {isAktif && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Kelas Aktif
                      </span>
                    )}
                    {isNaik && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        Naik Kelas
                      </span>
                    )}
                    {isTinggal && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        Tinggal Kelas (Mengulang)
                      </span>
                    )}
                    {isLulus && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        Lulus (Alumni)
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-xs text-muted-foreground py-4 text-center">Belum ada riwayat kelas tercatat.</p>
          )}
        </div>
      </div>

    </div>
  )
}
