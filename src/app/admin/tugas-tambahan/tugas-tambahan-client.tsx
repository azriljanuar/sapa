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
  GraduationCap,
  BookOpen,
  Search,
  UserX,
  Clock
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { cn } from "@/lib/utils"
import { saveTugasTambahan, removeTugasTambahan, assignWaliKelas } from "./actions"
import { GuruPiketClient } from "@/app/admin/guru-piket/guru-piket-client"

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

export interface KelasItem {
  id: number
  namaKelas: string
  waliKelasId: number | null
  waliKelas: {
    id: number
    nama: string
    nip: string | null
    fotoWajah: string | null
    email: string
    noTelepon: string | null
  } | null
  _count?: {
    anggota: number
  }
}

interface TugasTambahanClientProps {
  initialAssignments: AssignmentData[]
  availableGurus: GuruData[]
  activeTA: { id: number; nama: string }
  kelasList: KelasItem[]
  piketList: any[]
  initialTab?: "struktural" | "wali-kelas" | "piket"
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
  kelasList: initialKelasList,
  piketList,
  initialTab = "struktural",
}: TugasTambahanClientProps) {
  // Tab State
  const [activeTab, setActiveTab] = useState<"struktural" | "wali-kelas" | "piket">(initialTab)

  // Struktural State
  const [assignments, setAssignments] = useState<AssignmentData[]>(initialAssignments)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<PeranType | null>(null)
  const [selectedGuruId, setSelectedGuruId] = useState<string>("")
  const [skNomor, setSkNomor] = useState<string>("")
  const [keterangan, setKeterangan] = useState<string>("")
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  // Wali Kelas State
  const [kelasList, setKelasList] = useState<KelasItem[]>(initialKelasList)
  const [waliSearch, setWaliSearch] = useState("")
  const [waliFilter, setWaliFilter] = useState<"ALL" | "ASSIGNED" | "UNASSIGNED">("ALL")
  const [isWaliModalOpen, setIsWaliModalOpen] = useState(false)
  const [selectedKelasForWali, setSelectedKelasForWali] = useState<KelasItem | null>(null)
  const [selectedWaliGuruId, setSelectedWaliGuruId] = useState<string>("")
  const [waliFeedback, setWaliFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isWaliPending, startWaliTransition] = useTransition()

  // --- Handlers Struktural ---
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

  const handleSaveStruktural = () => {
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
        const assignedGuru = availableGurus.find((g) => g.id === parseInt(selectedGuruId))
        if (assignedGuru) {
          setAssignments((prev) => {
            const filtered = prev.filter((a) => a.peran !== selectedRole)
            return [
              ...filtered,
              {
                id: Date.now(),
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

  const handleRemoveStruktural = (assignment: AssignmentData) => {
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

  // --- Handlers Wali Kelas ---
  const handleOpenWaliModal = (kelas: KelasItem) => {
    setSelectedKelasForWali(kelas)
    setSelectedWaliGuruId(kelas.waliKelasId ? String(kelas.waliKelasId) : "")
    setWaliFeedback(null)
    setIsWaliModalOpen(true)
  }

  const handleSaveWaliKelas = () => {
    if (!selectedKelasForWali) return

    setWaliFeedback(null)
    startWaliTransition(async () => {
      const newGuruId = selectedWaliGuruId ? parseInt(selectedWaliGuruId) : null
      const res = await assignWaliKelas({
        kelasId: selectedKelasForWali.id,
        waliKelasId: newGuruId,
      })

      if (res.success) {
        setWaliFeedback({ type: "success", text: res.message || "Wali kelas berhasil diperbarui." })
        const assignedGuru = availableGurus.find((g) => g.id === newGuruId) || null
        setKelasList((prev) =>
          prev.map((k) =>
            k.id === selectedKelasForWali.id
              ? {
                  ...k,
                  waliKelasId: newGuruId,
                  waliKelas: assignedGuru
                    ? {
                        id: assignedGuru.id,
                        nama: assignedGuru.nama,
                        nip: assignedGuru.nip,
                        fotoWajah: assignedGuru.fotoWajah,
                        email: assignedGuru.email,
                        noTelepon: assignedGuru.noTelepon,
                      }
                    : null,
                }
              : k
          )
        )
        setTimeout(() => setIsWaliModalOpen(false), 700)
      } else {
        setWaliFeedback({ type: "error", text: res.error || "Gagal memperbarui wali kelas." })
      }
    })
  }

  const handleRemoveWaliKelas = (kelas: KelasItem) => {
    if (!kelas.waliKelas) return
    if (!confirm(`Konfirmasi: Lepaskan tugas Wali Kelas "${kelas.namaKelas}" dari ${kelas.waliKelas.nama}?`)) {
      return
    }

    startWaliTransition(async () => {
      const res = await assignWaliKelas({
        kelasId: kelas.id,
        waliKelasId: null,
      })

      if (res.success) {
        setKelasList((prev) =>
          prev.map((k) => (k.id === kelas.id ? { ...k, waliKelasId: null, waliKelas: null } : k))
        )
      } else {
        alert(res.error || "Gagal melepaskan wali kelas.")
      }
    })
  }

  // Wali Kelas Statistics
  const totalKelas = kelasList.length
  const kelasWithWali = kelasList.filter((k) => k.waliKelasId !== null).length
  const kelasWithoutWali = totalKelas - kelasWithWali

  // Filtered Kelas List
  const filteredKelasList = kelasList.filter((k) => {
    const matchSearch =
      k.namaKelas.toLowerCase().includes(waliSearch.toLowerCase()) ||
      (k.waliKelas?.nama && k.waliKelas.nama.toLowerCase().includes(waliSearch.toLowerCase())) ||
      (k.waliKelas?.nip && k.waliKelas.nip.includes(waliSearch))

    if (waliFilter === "ASSIGNED") return matchSearch && k.waliKelasId !== null
    if (waliFilter === "UNASSIGNED") return matchSearch && k.waliKelasId === null
    return matchSearch
  })

  // Helper check if guru is already wali elsewhere
  const getGuruWaliElsewhere = (guruId: number, currentKelasId: number) => {
    const found = kelasList.find((k) => k.waliKelasId === guruId && k.id !== currentKelasId)
    return found ? found.namaKelas : null
  }

  const roles: PeranType[] = ["KEPALA_SEKOLAH", "KURIKULUM", "KESISWAAN"]

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-card p-5 rounded-2xl border border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Manajemen Tugas Tambahan Guru
            </h1>
            <Badge variant="outline" className="text-xs font-semibold bg-primary/10 text-primary border-primary/20">
              T.A. {activeTA.nama}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Pusat penetapan tugas tambahan guru: Pimpinan & Waka, Wali Kelas Rombel, dan Guru Piket Harian.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Badge variant="secondary" className="px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 bg-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>Hak Akses Terdelegasi Dinamis</span>
          </Badge>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("struktural")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px cursor-pointer",
            activeTab === "struktural"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Award className="w-4 h-4" />
          <span>Pimpinan & Waka</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
            3 Jabatan
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab("wali-kelas")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px cursor-pointer",
            activeTab === "wali-kelas"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <BookOpen className="w-4 h-4" />
          <span>Wali Kelas</span>
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] px-1.5 py-0 h-4",
              kelasWithoutWali > 0
                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 font-bold"
                : ""
            )}
          >
            {kelasWithWali}/{totalKelas}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab("piket")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px cursor-pointer",
            activeTab === "piket"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <UserCheck className="w-4 h-4" />
          <span>Guru Piket</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
            {piketList.length} Petugas
          </Badge>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: PIMPINAN & WAKA (STRUKTURAL)                             */}
      {/* ============================================================== */}
      {activeTab === "struktural" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-foreground">Pejabat Struktural Lembaga</h2>
              <p className="text-xs text-muted-foreground">
                Guru yang ditunjuk sebagai pimpinan berhak mengakses dashboard dan fungsi manajerial di portal Guru.
              </p>
            </div>
          </div>

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
                            <h3 className="text-base font-bold text-foreground leading-snug">
                              {config.title}
                            </h3>
                            <span className="text-[11px] text-muted-foreground block line-clamp-1">
                              {config.subtitle}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold uppercase tracking-wider shrink-0 ${
                            assignment
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {assignment ? "Terisi" : "Kosong"}
                        </Badge>
                      </div>
                    </div>

                    {/* Body Card */}
                    <CardContent className="p-4 space-y-4">
                      {assignment ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border/50">
                            <Avatar className="w-12 h-12 rounded-xl border border-border shrink-0">
                              <AvatarImage
                                src={assignment.guru.fotoWajah || ""}
                                alt={assignment.guru.nama}
                                className="object-cover"
                              />
                              <AvatarFallback className="rounded-xl font-bold bg-primary/10 text-primary">
                                {assignment.guru.nama
                                  .split(" ")
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-foreground truncate">
                                {assignment.guru.nama}
                              </h4>
                              <p className="text-xs text-muted-foreground truncate">
                                {assignment.guru.nip ? `NIP: ${assignment.guru.nip}` : "NIP: -"}
                              </p>
                              {assignment.guru.email && (
                                <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                                  <Mail className="w-3 h-3" />
                                  <span>{assignment.guru.email}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Informasi SK */}
                          <div className="space-y-1 text-xs text-muted-foreground bg-card p-2.5 rounded-lg border border-border/40">
                            <div className="flex justify-between items-center py-0.5">
                              <span className="text-[11px] font-medium">Nomor SK:</span>
                              <span className="font-semibold text-foreground text-[11px] truncate max-w-[180px]">
                                {assignment.skNomor || "-"}
                              </span>
                            </div>
                            {assignment.keterangan && (
                              <div className="pt-1 border-t border-border/40 text-[11px]">
                                <span className="font-medium text-foreground">Catatan: </span>
                                <span>{assignment.keterangan}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="py-6 text-center space-y-2 border border-dashed border-border rounded-xl bg-muted/20">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                            <Icon className="w-5 h-5 opacity-40" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground">
                              Belum ada guru yang ditugaskan
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Pilih salah satu guru untuk mengemban amanah ini
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Fitur yang diakses */}
                      <div className="pt-2">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                          Hak Akses & Wewenang:
                        </span>
                        <ul className="space-y-1.5 text-xs text-foreground">
                          {config.features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                              <span className="leading-tight">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </div>

                  {/* Footer Card */}
                  <div className="p-4 pt-0">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleOpenAssignModal(peran)}
                        size="sm"
                        className="flex-1 text-xs gap-1.5 cursor-pointer"
                        variant={assignment ? "outline" : "default"}
                      >
                        {assignment ? (
                          <>
                            <Pencil className="w-3.5 h-3.5" />
                            Ganti Pejabat
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            Tugaskan Guru
                          </>
                        )}
                      </Button>

                      {assignment && (
                        <Button
                          onClick={() => handleRemoveStruktural(assignment)}
                          size="sm"
                          variant="ghost"
                          className="text-xs text-destructive hover:bg-destructive/10 px-2.5 cursor-pointer"
                          title="Cabut Penugasan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: WALI KELAS (ROMBONGAN BELAJAR)                           */}
      {/* ============================================================== */}
      {activeTab === "wali-kelas" && (
        <div className="space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 border border-border shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Rombel Kelas</p>
                  <h3 className="text-2xl font-bold text-foreground mt-1">{totalKelas}</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
            </Card>

            <Card className="p-4 border border-border shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Wali Kelas Terisi</p>
                  <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {kelasWithWali}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            </Card>

            <Card className="p-4 border border-border shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Belum Memiliki Wali</p>
                  <h3 className={cn("text-2xl font-bold mt-1", kelasWithoutWali > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground")}>
                    {kelasWithoutWali}
                  </h3>
                </div>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", kelasWithoutWali > 0 ? "bg-amber-500/10 text-amber-600" : "bg-muted text-muted-foreground")}>
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
            </Card>

            <Card className="p-4 border border-border shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Guru Tersedia</p>
                  <h3 className="text-2xl font-bold text-foreground mt-1">{availableGurus.length}</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
            </Card>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-4 rounded-xl border border-border shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari kelas atau nama wali kelas..."
                value={waliSearch}
                onChange={(e) => setWaliSearch(e.target.value)}
                className="pl-9 bg-background text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                Status:
              </span>
              <Select
                value={waliFilter}
                onValueChange={(val: any) => setWaliFilter(val || "ALL")}
              >
                <SelectTrigger className="w-full sm:w-44 text-xs">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">Semua Kelas ({totalKelas})</SelectItem>
                  <SelectItem value="ASSIGNED" className="text-xs">Sudah Ada Wali ({kelasWithWali})</SelectItem>
                  <SelectItem value="UNASSIGNED" className="text-xs">Belum Ada Wali ({kelasWithoutWali})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table Daftar Kelas & Wali Kelas */}
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-xs font-semibold">Kelas / Rombel</TableHead>
                  <TableHead className="text-xs font-semibold">Jumlah Santri</TableHead>
                  <TableHead className="text-xs font-semibold">Wali Kelas Saat Ini</TableHead>
                  <TableHead className="text-xs font-semibold">Status Penugasan</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKelasList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                      Tidak ada kelas yang sesuai dengan filter pencarian.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredKelasList.map((k) => (
                    <TableRow key={k.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {k.namaKelas.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-sm text-foreground block">
                              {k.namaKelas}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              T.A. {activeTA.nama}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="secondary" className="text-xs font-normal">
                          <Users className="w-3 h-3 mr-1 text-muted-foreground" />
                          {k._count?.anggota ?? 0} Santri
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {k.waliKelas ? (
                          <div className="flex items-center gap-2.5">
                            <Avatar className="w-8 h-8 rounded-lg border border-border shrink-0">
                              <AvatarImage src={k.waliKelas.fotoWajah || ""} alt={k.waliKelas.nama} />
                              <AvatarFallback className="rounded-lg text-xs font-bold bg-primary/10 text-primary">
                                {k.waliKelas.nama.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-semibold text-xs text-foreground block">
                                {k.waliKelas.nama}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {k.waliKelas.nip ? `NIP: ${k.waliKelas.nip}` : "NIP: -"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Belum Ditetapkan
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {k.waliKelas ? (
                          <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                            Aktif Bertugas
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                            Perlu Wali Kelas
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            onClick={() => handleOpenWaliModal(k)}
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 gap-1 cursor-pointer"
                          >
                            <Pencil className="w-3 h-3" />
                            {k.waliKelas ? "Ganti" : "Tugaskan"}
                          </Button>

                          {k.waliKelas && (
                            <Button
                              onClick={() => handleRemoveWaliKelas(k)}
                              size="sm"
                              variant="ghost"
                              className="text-xs h-8 text-destructive hover:bg-destructive/10 px-2 cursor-pointer"
                              title="Lepaskan Wali Kelas"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: GURU PIKET (JADWAL HARIAN)                               */}
      {/* ============================================================== */}
      {activeTab === "piket" && (
        <div className="bg-card rounded-2xl border border-border p-5 shadow-xs">
          <GuruPiketClient
            initialData={piketList}
            guruList={availableGurus}
            activeTaName={activeTA.nama}
            isEmbedded={true}
          />
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL PENUGASAN STRUKTURAL (PIMPINAN & WAKA)                    */}
      {/* ============================================================== */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              <span>
                {selectedRole ? ROLE_CONFIGS[selectedRole].title : "Tugaskan Guru"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tentukan guru yang memegang amanah struktural ini untuk Tahun Ajaran {activeTA.nama}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {feedback && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  feedback.type === "success"
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-destructive/10 text-destructive border border-destructive/20"
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
              <Label className="text-xs font-semibold">Nomor SK Penugasan (Opsional)</Label>
              <Input
                placeholder="Contoh: SK/045/MA-SAPA/VII/2026"
                value={skNomor}
                onChange={(e) => setSkNomor(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Catatan / Keterangan */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Catatan / Tugas Tambahan (Opsional)</Label>
              <Textarea
                placeholder="Tuliskan catatan mandat atau rincian tugas..."
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                className="text-xs min-h-[70px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isPending}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveStruktural}
              disabled={isPending}
              className="text-xs gap-1.5 cursor-pointer"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Simpan Penugasan</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* MODAL PENETAPAN WALI KELAS                                      */}
      {/* ============================================================== */}
      <Dialog open={isWaliModalOpen} onOpenChange={setIsWaliModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span>
                Tetapkan Wali Kelas: {selectedKelasForWali?.namaKelas}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Pilih guru yang ditugaskan membina rombel ini untuk Tahun Ajaran {activeTA.nama}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {waliFeedback && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  waliFeedback.type === "success"
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-destructive/10 text-destructive border border-destructive/20"
                }`}
              >
                {waliFeedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{waliFeedback.text}</span>
              </div>
            )}

            {/* Pemilihan Guru */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Pilih Guru / Wali Kelas <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedWaliGuruId}
                onValueChange={(val) => setSelectedWaliGuruId(val || "")}
              >
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="-- Pilih Guru dari Daftar --" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {availableGurus.map((g) => {
                    const elsewhere = selectedKelasForWali
                      ? getGuruWaliElsewhere(g.id, selectedKelasForWali.id)
                      : null

                    return (
                      <SelectItem key={g.id} value={String(g.id)} className="text-xs">
                        <div className="flex items-center justify-between gap-2 w-full">
                          <span>{g.nama} {g.nip ? `(${g.nip})` : ""}</span>
                          {elsewhere && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium ml-2">
                              [Wali {elsewhere}]
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1">
                Wali kelas otomatis memiliki akses portal Wali Kelas untuk mengelola rapor santri di rombel ini.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsWaliModalOpen(false)}
              disabled={isWaliPending}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveWaliKelas}
              disabled={isWaliPending}
              className="text-xs gap-1.5 cursor-pointer"
            >
              {isWaliPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Simpan Wali Kelas</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
