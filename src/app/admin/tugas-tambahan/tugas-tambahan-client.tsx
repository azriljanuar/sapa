"use client"

import { useState, useTransition } from "react"
import { 
  Award, 
  BookOpenCheck, 
  Users, 
  ShieldCheck, 
  UserCheck, 
  CalendarDays, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Plus, 
  Pencil, 
  Trash2, 
  Mail, 
  Phone, 
  Briefcase,
  GraduationCap
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { saveTugasTambahan, removeTugasTambahan } from "./actions"

export type PeranType = "KEPALA_SEKOLAH" | "KURIKULUM" | "KESISWAAN"

interface GuruData {
  id: number
  nama: string
  nip: string | null
  email: string
  noTelepon: string | null
  fotoWajah: string | null
  statusPegawai?: string | null
  pendidikanTerakhir?: string | null
}

interface AssignmentData {
  id: number
  guruId: number
  peran: PeranType
  skNomor: string | null
  keterangan: string | null
  guru: GuruData
}

interface TugasTambahanClientProps {
  initialAssignments: AssignmentData[]
  availableGurus: GuruData[]
  activeTA: { id: number; nama: string }
}

const ROLE_CONFIGS: Record<PeranType, {
  title: string
  subtitle: string
  icon: any
  badgeColor: string
  bgColor: string
  borderColor: string
  features: string[]
}> = {
  KEPALA_SEKOLAH: {
    title: "Kepala Madrasah / Sekolah",
    subtitle: "Pimpinan tertinggi satuan pendidikan, supervisi akademik, dan approval rapor",
    icon: Award,
    badgeColor: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    bgColor: "bg-amber-50/50 dark:bg-amber-950/10",
    borderColor: "border-amber-200 dark:border-amber-900/40",
    features: [
      "Dashboard Eksekutif & KPI Lembaga",
      "Rekap Presensi Guru & Santri Bulanan",
      "Monitoring & Approval Rilis Nilai Rapor",
      "Supervisi Jadwal KBM Seluruh Rombel",
      "Review Kalender Pendidikan (Kaldik Kemenag)",
      "Otomatis menjadi penandatangan Rapor & SKL",
    ],
  },
  KURIKULUM: {
    title: "Waka / Bidang Kurikulum",
    subtitle: "Pengelolaan struktur akademik, rombel kelas, jadwal pelajaran, dan penilaian",
    icon: BookOpenCheck,
    badgeColor: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
    bgColor: "bg-purple-50/50 dark:bg-purple-950/10",
    borderColor: "border-purple-200 dark:border-purple-900/40",
    features: [
      "Kalender Pendidikan (Kaldik Standar Kemenag)",
      "Penetapan Kelas Formal & Wali Kelas",
      "Mata Pelajaran & Penugasan Guru Pengampu",
      "Penyusunan & Pengelolaan Jadwal KBM Harian",
      "Monitoring Penilaian & Ketuntasan Rapor",
    ],
  },
  KESISWAAN: {
    title: "Waka / Bidang Kesiswaan",
    subtitle: "Pengelolaan kesiswaan, absensi santri terpadu, kenaikan kelas, alumni, dan piket",
    icon: GraduationCap,
    badgeColor: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
    bgColor: "bg-blue-50/50 dark:bg-blue-950/10",
    borderColor: "border-blue-200 dark:border-blue-900/40",
    features: [
      "Manajemen Data Santri & Mutasi",
      "Rekap Kehadiran Santri (Seluruh Kelas)",
      "Anggota Rombel, Kenaikan Kelas & Kelulusan",
      "Data Alumni & Pencetakan SKL",
      "Cetak Kartu Santri & Pairing RFID",
      "Monitoring & Supervisi Guru Piket",
    ],
  },
}

export function TugasTambahanClient({
  initialAssignments,
  availableGurus,
  activeTA,
}: TugasTambahanClientProps) {
  const [assignments, setAssignments] = useState<AssignmentData[]>(initialAssignments)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<PeranType | null>(null)
  const [selectedGuruId, setSelectedGuruId] = useState<string>("")
  const [skNomor, setSkNomor] = useState<string>("")
  const [keterangan, setKeterangan] = useState<string>("")
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [isPending, startTransition] = useTransition()

  const getAssignmentByRole = (peran: PeranType) => {
    return assignments.find((a) => a.peran === peran)
  }

  const handleOpenAssignModal = (peran: PeranType) => {
    const existing = getAssignmentByRole(peran)
    setSelectedRole(peran)
    setSelectedGuruId(existing ? String(existing.guruId) : "")
    setSkNomor(existing?.skNomor || "")
    setKeterangan(existing?.keterangan || "")
    setFeedback(null)
    setIsModalOpen(true)
  }

  const handleSave = () => {
    if (!selectedRole) return
    if (!selectedGuruId) {
      setFeedback({ type: "error", text: "Silakan pilih salah satu guru." })
      return
    }

    setFeedback(null)
    startTransition(async () => {
      const res = await saveTugasTambahan({
        peran: selectedRole,
        guruId: parseInt(selectedGuruId),
        skNomor: skNomor || null,
        keterangan: keterangan || null,
      })

      if (res.success) {
        setFeedback({ type: "success", text: res.message || "Penugasan berhasil disimpan." })
        // Update local state
        const assignedGuru = availableGurus.find((g) => g.id === parseInt(selectedGuruId))
        if (assignedGuru) {
          setAssignments((prev) => {
            const filtered = prev.filter((a) => a.peran !== selectedRole)
            return [
              ...filtered,
              {
                id: Date.now(), // temp id
                guruId: assignedGuru.id,
                peran: selectedRole,
                skNomor: skNomor || null,
                keterangan: keterangan || null,
                guru: assignedGuru,
              },
            ]
          })
        }
        setTimeout(() => setIsModalOpen(false), 800)
      } else {
        setFeedback({ type: "error", text: res.error || "Gagal menyimpan penugasan." })
      }
    })
  }

  const handleRemove = (assignment: AssignmentData) => {
    const config = ROLE_CONFIGS[assignment.peran]
    if (
      !confirm(
        `Konfirmasi: Cabut penugasan "${config.title}" dari ${assignment.guru.nama}?`
      )
    ) {
      return
    }

    startTransition(async () => {
      const res = await removeTugasTambahan(assignment.id)
      if (res.success) {
        setAssignments((prev) => prev.filter((a) => a.id !== assignment.id))
      } else {
        alert(res.error || "Gagal mencabut penugasan.")
      }
    })
  }

  const roles: PeranType[] = ["KEPALA_SEKOLAH", "KURIKULUM", "KESISWAAN"]

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-card p-5 rounded-2xl border border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Tugas Tambahan & Pejabat Madrasah
            </h1>
            <Badge variant="outline" className="text-xs font-semibold bg-primary/10 text-primary border-primary/20">
              T.A. {activeTA.nama}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Delegasikan wewenang manajemen akademik dan kesiswaan kepada guru yang memegang tugas struktural pada Tahun Ajaran aktif.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Badge variant="secondary" className="px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 bg-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>Hak Akses Terdelegasi Dinamis</span>
          </Badge>
        </div>
      </div>

      {/* Grid 3 Kartu Penugasan Struktural */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {roles.map((peran) => {
          const config = ROLE_CONFIGS[peran]
          const assignment = getAssignmentByRole(peran)
          const Icon = config.icon

          return (
            <Card
              key={peran}
              className={`flex flex-col justify-between overflow-hidden border ${config.borderColor} shadow-xs transition-all hover:shadow-sm`}
            >
              <div>
                {/* Header Card */}
                <div className={`p-4 border-b border-border/60 ${config.bgColor}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-card border border-border shadow-2xs flex items-center justify-center text-foreground shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-foreground leading-snug">
                          {config.title}
                        </h2>
                        <span className="text-[11px] text-muted-foreground block line-clamp-1">
                          {config.subtitle}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <CardContent className="p-5 space-y-5">
                  {/* Profil Pejabat Saat Ini */}
                  {assignment ? (
                    <div className="p-4 bg-card rounded-xl border border-border/80 shadow-2xs space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12 border border-border shrink-0">
                          {assignment.guru.fotoWajah && (
                            <AvatarImage
                              src={assignment.guru.fotoWajah}
                              alt={assignment.guru.nama}
                              className="object-cover"
                            />
                          )}
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                            {assignment.guru.nama
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm text-foreground truncate">
                            {assignment.guru.nama}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono truncate">
                            NIP: {assignment.guru.nip || "-"}
                          </div>
                          <Badge className={`mt-1 text-[10px] px-2 py-0.5 border ${config.badgeColor}`}>
                            Pejabat Aktif
                          </Badge>
                        </div>
                      </div>

                      {/* Detail Tambahan */}
                      <div className="text-xs space-y-1.5 pt-2 border-t border-border/60 text-muted-foreground">
                        {assignment.skNomor && (
                          <div className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">SK: <strong className="text-foreground">{assignment.skNomor}</strong></span>
                          </div>
                        )}
                        {assignment.guru.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{assignment.guru.email}</span>
                          </div>
                        )}
                        {assignment.guru.noTelepon && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span>{assignment.guru.noTelepon}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-muted/40 rounded-xl border border-dashed border-border text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-muted mx-auto flex items-center justify-center text-muted-foreground">
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="text-xs font-semibold text-foreground">
                        Belum Ada Pejabat Ditunjuk
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Klik tombol di bawah untuk menunjuk guru yang memegang tugas ini.
                      </p>
                    </div>
                  )}

                  {/* Daftar Fitur / Wewenang */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                      Hak Akses & Fitur Terbuka:
                    </div>
                    <ul className="space-y-1.5">
                      {config.features.map((feat, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-4 border-t border-border bg-muted/20 flex items-center gap-2">
                {assignment ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs gap-1.5 font-medium"
                      onClick={() => handleOpenAssignModal(peran)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Ganti Pejabat
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:border-red-900/40"
                      onClick={() => handleRemove(assignment)}
                      disabled={isPending}
                      title="Cabut Penugasan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    className="w-full text-xs gap-1.5 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => handleOpenAssignModal(peran)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tugaskan Guru
                  </Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* MODAL PENETAPAN / MUTASI TUGAS TAMBAHAN */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              <span>
                {selectedRole ? ROLE_CONFIGS[selectedRole].title : "Penugasan Guru"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tunjuk guru aktif pada tahun ajaran <strong>{activeTA.nama}</strong> untuk memegang wewenang tugas tambahan ini.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {feedback && (
              <div
                className={`p-3 rounded-lg flex items-center gap-2 text-xs ${
                  feedback.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                    : "bg-destructive/10 border border-destructive/20 text-destructive"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            {/* Pemilihan Guru */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Pilih Guru / Ustadz <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedGuruId} onValueChange={(val) => setSelectedGuruId(val || "")}>
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="-- Pilih Guru Terdaftar --" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {availableGurus.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)} className="text-xs">
                      {g.nama} {g.nip ? `(NIP: ${g.nip})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nomor SK Penugasan */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Nomor SK Penugasan (Opsional)
              </Label>
              <Input
                placeholder="Contoh: SK/014/YYS/VII/2026"
                value={skNomor}
                onChange={(e) => setSkNomor(e.target.value)}
                className="text-xs font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Digunakan sebagai referensi legalitas penugasan di madrasah/pesantren.
              </p>
            </div>

            {/* Keterangan / Catatan */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Keterangan / Catatan (Opsional)
              </Label>
              <Textarea
                placeholder="Catatan tambahan, masa jabatan, atau deskripsi penugasan..."
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                rows={2}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isPending}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isPending || !selectedGuruId}
              className="text-xs bg-primary text-primary-foreground font-semibold"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Penugasan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
