"use client"

import { useState, useMemo } from "react"
import { 
  Plus, Trash2, Clock, Pencil, Calendar, 
  CalendarDays, BookOpen, User, Sparkles, 
  CheckCircle2, AlertCircle, ArrowRight, Layers
} from "lucide-react"
import { Hari } from "@prisma/client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

import { createJadwalAction, updateJadwalAction, deleteJadwalAction } from "./actions"

type PengampuData = {
  id: number
  mataPelajaran: { id: number; nama: string; kode?: string | null }
  guru: { id: number; nama: string }
}

type JadwalData = {
  id: number
  hari: Hari
  jamMulai: string
  jamSelesai: string
  pengampu: PengampuData & { kelasFormalId: number }
}

const HARI_CONFIG: { key: Hari; label: string; badgeColor: string; bgSoft: string }[] = [
  { key: "SENIN", label: "Senin", badgeColor: "text-blue-700 bg-blue-100 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300", bgSoft: "bg-blue-50/50 dark:bg-blue-950/20" },
  { key: "SELASA", label: "Selasa", badgeColor: "text-emerald-700 bg-emerald-100 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300", bgSoft: "bg-emerald-50/50 dark:bg-emerald-950/20" },
  { key: "RABU", label: "Rabu", badgeColor: "text-amber-700 bg-amber-100 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300", bgSoft: "bg-amber-50/50 dark:bg-amber-950/20" },
  { key: "KAMIS", label: "Kamis", badgeColor: "text-purple-700 bg-purple-100 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300", bgSoft: "bg-purple-50/50 dark:bg-purple-950/20" },
  { key: "JUMAT", label: "Jumat", badgeColor: "text-teal-700 bg-teal-100 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300", bgSoft: "bg-teal-50/50 dark:bg-teal-950/20" },
  { key: "SABTU", label: "Sabtu", badgeColor: "text-indigo-700 bg-indigo-100 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300", bgSoft: "bg-indigo-50/50 dark:bg-indigo-950/20" },
  { key: "MINGGU", label: "Minggu", badgeColor: "text-rose-700 bg-rose-100 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300", bgSoft: "bg-rose-50/50 dark:bg-rose-950/20" },
]

// Slot jam pelajaran umum untuk kemudahan pengisian cepat
const JAM_PRESETS = [
  { label: "Jam 1 (07:15 - 08:00)", mulai: "07:15", selesai: "08:00" },
  { label: "Jam 2 (08:00 - 08:45)", mulai: "08:00", selesai: "08:45" },
  { label: "Jam 3 (08:45 - 09:30)", mulai: "08:45", selesai: "09:30" },
  { label: "Jam 4 (09:45 - 10:30)", mulai: "09:45", selesai: "10:30" },
  { label: "Jam 5 (10:30 - 11:15)", mulai: "10:30", selesai: "11:15" },
  { label: "Jam 6 (11:15 - 12:00)", mulai: "11:15", selesai: "12:00" },
  { label: "Jam 7 (13:00 - 13:45)", mulai: "13:00", selesai: "13:45" },
  { label: "Jam 8 (13:45 - 14:30)", mulai: "13:45", selesai: "14:30" },
]

export function JadwalClient({
  activeTa,
  activeSemester,
  kelasFormalList,
  pengampuList,
  initialJadwal,
}: {
  activeTa: any
  activeSemester: any
  kelasFormalList: { id: number; namaKelas: string }[]
  pengampuList: (PengampuData & { kelasFormalId: number })[]
  initialJadwal: JadwalData[]
}) {
  // Default ke kelas pertama jika tersedia
  const [selectedKelasId, setSelectedKelasId] = useState<string>(
    kelasFormalList.length > 0 ? kelasFormalList[0].id.toString() : ""
  )
  const [selectedTabHari, setSelectedTabHari] = useState<string>("ALL")
  const [jadwalData, setJadwalData] = useState<JadwalData[]>(initialJadwal)

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingJadwalId, setEditingJadwalId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Form State
  const [formPengampuId, setFormPengampuId] = useState("")
  const [formHari, setFormHari] = useState<Hari>("SENIN")
  const [formJamMulai, setFormJamMulai] = useState("07:15")
  const [formJamSelesai, setFormJamSelesai] = useState("08:00")

  // Filter pengampu dan jadwal berdasarkan kelas yang dipilih
  const classPengampu = useMemo(() => {
    return pengampuList.filter((p) => p.kelasFormalId.toString() === selectedKelasId)
  }, [pengampuList, selectedKelasId])

  const classJadwal = useMemo(() => {
    return jadwalData.filter((j) => j.pengampu.kelasFormalId.toString() === selectedKelasId)
  }, [jadwalData, selectedKelasId])

  // Group jadwal berdasarkan hari
  const groupedJadwal = useMemo(() => {
    const map: Record<string, JadwalData[]> = {}
    for (const conf of HARI_CONFIG) {
      map[conf.key] = []
    }
    for (const item of classJadwal) {
      if (!map[item.hari]) map[item.hari] = []
      map[item.hari].push(item)
    }
    // Urutkan jadwal per hari berdasarkan jam mulai
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.jamMulai.localeCompare(b.jamMulai))
    }
    return map
  }, [classJadwal])

  const currentKelasObj = useMemo(() => {
    return kelasFormalList.find((k) => k.id.toString() === selectedKelasId)
  }, [kelasFormalList, selectedKelasId])

  // Buka Dialog Tambah untuk Hari tertentu
  const openAddDialogForHari = (hari: Hari) => {
    setEditingJadwalId(null)
    setFormHari(hari)
    setErrorMessage(null)

    // Cari jam terakhir di hari tersebut untuk menyarankan jam mulai berikutnya
    const existing = groupedJadwal[hari] || []
    if (existing.length > 0) {
      const last = existing[existing.length - 1]
      setFormJamMulai(last.jamSelesai)
      // Tambah default 45 menit
      const [h, m] = last.jamSelesai.split(":").map(Number)
      const nextMin = h * 60 + m + 45
      const nextH = Math.min(23, Math.floor(nextMin / 60))
      const nextM = nextMin % 60
      setFormJamSelesai(`${String(nextH).padStart(2, "0")}:${String(nextM).padStart(2, "0")}`)
    } else {
      setFormJamMulai("07:15")
      setFormJamSelesai("08:00")
    }

    setFormPengampuId(classPengampu[0]?.id.toString() || "")
    setIsDialogOpen(true)
  }

  // Buka Dialog Edit Jadwal
  const openEditDialog = (item: JadwalData) => {
    setEditingJadwalId(item.id)
    setFormHari(item.hari)
    setFormPengampuId(item.pengampu.id.toString())
    setFormJamMulai(item.jamMulai)
    setFormJamSelesai(item.jamSelesai)
    setErrorMessage(null)
    setIsDialogOpen(true)
  }

  const applyPreset = (mulai: string, selesai: string) => {
    setFormJamMulai(mulai)
    setFormJamSelesai(selesai)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!formPengampuId) {
      setErrorMessage("Silakan pilih mata pelajaran & guru pengampu.")
      return
    }
    if (!formHari) {
      setErrorMessage("Silakan pilih hari.")
      return
    }
    if (!formJamMulai || !formJamSelesai) {
      setErrorMessage("Jam mulai dan jam selesai wajib diisi.")
      return
    }
    if (formJamSelesai <= formJamMulai) {
      setErrorMessage("Jam selesai harus lebih akhir dari jam mulai.")
      return
    }

    setIsSubmitting(true)
    try {
      if (editingJadwalId) {
        const res = await updateJadwalAction(
          editingJadwalId,
          parseInt(formPengampuId),
          formHari,
          formJamMulai,
          formJamSelesai
        )
        if (res.success) {
          const pengampuObj = classPengampu.find((p) => p.id === parseInt(formPengampuId))!
          setJadwalData((prev) =>
            prev.map((j) =>
              j.id === editingJadwalId
                ? {
                    ...j,
                    hari: formHari,
                    jamMulai: formJamMulai,
                    jamSelesai: formJamSelesai,
                    pengampu: {
                      ...pengampuObj,
                      kelasFormalId: parseInt(selectedKelasId),
                    },
                  }
                : j
            )
          )
          setIsDialogOpen(false)
        } else {
          setErrorMessage(res.error || "Gagal memperbarui jadwal")
        }
      } else {
        const res = await createJadwalAction(
          parseInt(formPengampuId),
          activeSemester.id,
          formHari,
          formJamMulai,
          formJamSelesai
        )
        if (res.success) {
          // Muat ulang atau update state lokal
          window.location.reload()
        } else {
          setErrorMessage(res.error || "Gagal menyimpan jadwal")
        }
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Terjadi kesalahan sistem")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) return
    const res = await deleteJadwalAction(id)
    if (res.success) {
      setJadwalData((prev) => prev.filter((j) => j.id !== id))
    } else {
      alert(res.error || "Gagal menghapus jadwal")
    }
  }

  if (!activeSemester) {
    return (
      <div className="p-6 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 font-medium">
        Belum ada Semester yang aktif di Tahun Ajaran ini. Silakan hubungi Super Admin.
      </div>
    )
  }

  const hariLabel = HARI_CONFIG.find((h) => h.key === formHari)?.label || formHari

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Manajemen Jadwal Pelajaran
            </h2>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              {activeTa.nama} - {activeSemester.nama}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Atur dan tambahkan jadwal kegiatan belajar mengajar per hari untuk setiap kelas.
          </p>
        </div>

        {/* Pilih Kelas Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
            Pilih Kelas:
          </span>
          <Select value={selectedKelasId} onValueChange={(val) => setSelectedKelasId(val || "")}>
            <SelectTrigger className="w-full sm:w-[220px] bg-background">
              <SelectValue placeholder="Pilih Kelas...">
                {currentKelasObj?.namaKelas || "Pilih Kelas..."}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {kelasFormalList.map((k) => (
                <SelectItem key={k.id} value={k.id.toString()}>
                  {k.namaKelas}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedKelasId ? (
        <div className="space-y-6">
          {/* Info Card Kelas & Tab Hari */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    Kelas: {currentKelasObj?.namaKelas}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Total {classJadwal.length} sesi pertemuan</span>
                    <span>•</span>
                    <span>{classPengampu.length} mata pelajaran terpetakan</span>
                  </div>
                </div>
              </div>

              {/* Quick Add Button default ke hari yang sedang aktif atau SENIN */}
              <Button
                onClick={() =>
                  openAddDialogForHari(selectedTabHari === "ALL" ? "SENIN" : (selectedTabHari as Hari))
                }
                className="gap-2 shadow-xs shrink-0"
                disabled={classPengampu.length === 0}
              >
                <Plus className="w-4 h-4" />
                {selectedTabHari === "ALL"
                  ? "Tambah Jadwal Pelajaran"
                  : `Tambah Jadwal ${HARI_CONFIG.find((h) => h.key === selectedTabHari)?.label}`}
              </Button>
            </div>

            {/* Tab Bar Navigasi Hari */}
            <div className="flex overflow-x-auto gap-2 pt-2 border-t border-border scrollbar-thin">
              <button
                type="button"
                onClick={() => setSelectedTabHari("ALL")}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 border",
                  selectedTabHari === "ALL"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                )}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Semua Hari</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                    selectedTabHari === "ALL" ? "bg-white/20 text-white" : "bg-muted text-foreground"
                  )}
                >
                  {classJadwal.length}
                </span>
              </button>

              {HARI_CONFIG.map((conf) => {
                const count = groupedJadwal[conf.key]?.length || 0
                const isSelected = selectedTabHari === conf.key

                return (
                  <button
                    type="button"
                    key={conf.key}
                    onClick={() => setSelectedTabHari(conf.key)}
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 border",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                    )}
                  >
                    <span>{conf.label}</span>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                        isSelected ? "bg-white/20 text-white" : count > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Warning jika belum ada pemetaan guru */}
          {classPengampu.length === 0 && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 rounded-xl text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <span className="font-bold">Belum Ada Pemetaan Mata Pelajaran di Kelas Ini!</span>
                <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-0.5">
                  Sebelum menambahkan jadwal pelajaran, pastikan Anda telah mengatur guru pengampu mata pelajaran untuk kelas ini di menu <strong>Mata Pelajaran &gt; Atur Pengampu</strong>.
                </p>
              </div>
            </div>
          )}

          {/* VIEW MODE 1: TAMPILAN PER HARI TERTENTU */}
          {selectedTabHari !== "ALL" && (
            <div className="space-y-4">
              {(() => {
                const currentHariKey = selectedTabHari as Hari
                const currentConfig = HARI_CONFIG.find((h) => h.key === currentHariKey)!
                const items = groupedJadwal[currentHariKey] || []

                return (
                  <div className="bg-card rounded-2xl border border-border p-5 shadow-xs space-y-4">
                    {/* Header Hari Tertentu */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "px-3 py-1 rounded-lg text-sm font-bold border",
                            currentConfig.badgeColor
                          )}
                        >
                          Hari {currentConfig.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({items.length} sesi terdaftar)
                        </span>
                      </div>

                      {/* Tombol Tambah Khusus Hari Ini */}
                      <Button
                        size="sm"
                        onClick={() => openAddDialogForHari(currentHariKey)}
                        disabled={classPengampu.length === 0}
                        className="gap-1.5 shadow-xs self-start sm:self-auto"
                      >
                        <Plus className="w-4 h-4" />
                        Tambah Jadwal Hari {currentConfig.label}
                      </Button>
                    </div>

                    {/* Sesi List */}
                    {items.length === 0 ? (
                      <div className="py-12 px-4 text-center rounded-xl border border-dashed border-border bg-muted/20 space-y-3">
                        <CalendarDays className="w-10 h-10 mx-auto text-muted-foreground/30" />
                        <div>
                          <p className="font-semibold text-foreground text-sm">
                            Belum Ada Jadwal di Hari {currentConfig.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 max-w-sm mx-auto">
                            Klik tombol di bawah untuk menambahkan sesi mata pelajaran pertama pada hari {currentConfig.label}.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAddDialogForHari(currentHariKey)}
                          disabled={classPengampu.length === 0}
                          className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                        >
                          <Plus className="w-4 h-4" />
                          Tambah Jadwal Hari {currentConfig.label}
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {items.map((item, idx) => (
                          <div
                            key={item.id}
                            className="bg-background rounded-xl border border-border p-4 shadow-2xs hover:border-primary/40 transition-all flex flex-col justify-between group"
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>
                                    {item.jamMulai} - {item.jamSelesai}
                                  </span>
                                </div>
                                <span className="text-[11px] font-bold text-muted-foreground">
                                  #{idx + 1}
                                </span>
                              </div>

                              <div>
                                <h4 className="font-bold text-base text-foreground leading-snug">
                                  {item.pengampu.mataPelajaran.nama}
                                </h4>
                                {item.pengampu.mataPelajaran.kode && (
                                  <span className="text-[11px] text-muted-foreground">
                                    Kode: {item.pengampu.mataPelajaran.kode}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="pt-3 mt-3 border-t border-border flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                                  {item.pengampu.guru.nama.slice(0, 2).toUpperCase()}
                                </div>
                                <span className="font-medium text-foreground truncate max-w-[130px]">
                                  {item.pengampu.guru.nama}
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(item)}
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                  title="Edit Jadwal"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(item.id)}
                                  className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                  title="Hapus Jadwal"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          )}

          {/* VIEW MODE 2: TAMPILAN SEMUA HARI (GRID MINGGUAN DENGAN TOMBOL TAMBAH PER HARI) */}
          {selectedTabHari === "ALL" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {HARI_CONFIG.map((conf) => {
                const items = groupedJadwal[conf.key] || []

                return (
                  <div
                    key={conf.key}
                    className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden flex flex-col justify-between"
                  >
                    {/* Header Hari dengan Tombol Tambah Hari Ini */}
                    <div className="p-3.5 border-b border-border bg-muted/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-md text-xs font-bold border",
                            conf.badgeColor
                          )}
                        >
                          {conf.label}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">
                          {items.length} sesi
                        </span>
                      </div>

                      {/* Tombol Tambah Khusus Hari Ini */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAddDialogForHari(conf.key)}
                        disabled={classPengampu.length === 0}
                        className="h-7 px-2.5 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                        title={`Tambah jadwal di hari ${conf.label}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah
                      </Button>
                    </div>

                    {/* Konten Jadwal di Hari Tersebut */}
                    <div className="p-3.5 space-y-2.5 flex-1">
                      {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center py-8 text-center text-muted-foreground/70 border border-dashed border-border rounded-xl bg-background/50">
                          <Clock className="w-6 h-6 mb-1 text-muted-foreground/40" />
                          <span className="text-xs">Belum ada jadwal</span>
                          <button
                            type="button"
                            onClick={() => openAddDialogForHari(conf.key)}
                            disabled={classPengampu.length === 0}
                            className="text-xs font-semibold text-primary hover:underline mt-1"
                          >
                            + Tambah Jadwal {conf.label}
                          </button>
                        </div>
                      ) : (
                        items.map((item, idx) => (
                          <div
                            key={item.id}
                            className="bg-background rounded-xl border border-border p-3 shadow-2xs hover:border-primary/40 transition-all flex flex-col justify-between group"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h5 className="font-bold text-sm text-foreground leading-snug">
                                  {item.pengampu.mataPelajaran.nama}
                                </h5>
                                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                                  <User className="w-3 h-3 text-muted-foreground/60" />
                                  <span>{item.pengampu.guru.nama}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(item)}
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                  title="Edit"
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(item.id)}
                                  className="h-6 w-6 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                              <span className="font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {item.jamMulai} - {item.jamSelesai}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                Sesi #{idx + 1}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 bg-card rounded-2xl border border-border shadow-xs text-muted-foreground space-y-3">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/30" />
          <h4 className="font-semibold text-foreground text-base">Silakan Pilih Kelas Terlebih Dahulu</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Gunakan dropdown pemilih kelas di bagian atas untuk melihat dan mengatur jadwal pelajaran mingguan per hari.
          </p>
        </div>
      )}

      {/* Modal Tambah / Edit Jadwal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span>
                {editingJadwalId
                  ? "Edit Jadwal Pelajaran"
                  : `Tambah Jadwal Pelajaran - Hari ${hariLabel}`}
              </span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4 pt-2">
            {errorMessage && (
              <div className="p-3 text-xs bg-destructive/10 text-destructive rounded-lg border border-destructive/20 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Pilihan Hari */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Hari Pelajaran <span className="text-destructive">*</span>
              </Label>
              <Select value={formHari} onValueChange={(val) => setFormHari((val as Hari) || "SENIN")}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Pilih Hari...">
                    {HARI_CONFIG.find((h) => h.key === formHari)?.label || formHari}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {HARI_CONFIG.map((h) => (
                    <SelectItem key={h.key} value={h.key}>
                      Hari {h.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pilihan Mata Pelajaran & Guru */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Mata Pelajaran &amp; Guru Pengampu <span className="text-destructive">*</span>
              </Label>
              <Select value={formPengampuId} onValueChange={(val) => setFormPengampuId(val || "")}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="-- Pilih Mata Pelajaran --">
                    {(() => {
                      const p = classPengampu.find((x) => x.id.toString() === formPengampuId)
                      return p ? `${p.mataPelajaran.nama} — ${p.guru.nama}` : "-- Pilih Mata Pelajaran --"
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {classPengampu.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      <div className="flex flex-col text-left py-0.5">
                        <span className="font-semibold text-sm text-foreground">
                          {p.mataPelajaran.nama} {p.mataPelajaran.kode ? `(${p.mataPelajaran.kode})` : ""}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Guru: {p.guru.nama}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Waktu Pelajaran (Jam Mulai & Jam Selesai) */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">
                    Jam Mulai <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="time"
                    required
                    value={formJamMulai}
                    onChange={(e) => setFormJamMulai(e.target.value)}
                    className="bg-background font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">
                    Jam Selesai <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="time"
                    required
                    value={formJamSelesai}
                    onChange={(e) => setFormJamSelesai(e.target.value)}
                    className="bg-background font-mono"
                  />
                </div>
              </div>

              {/* Preset Jam Cepat */}
              <div className="space-y-1 pt-1">
                <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary" />
                  Preset Jam Cepat (Klik untuk mengisi):
                </span>
                <div className="flex flex-wrap gap-1.5 pt-0.5 max-h-24 overflow-y-auto scrollbar-none">
                  {JAM_PRESETS.map((preset) => (
                    <button
                      type="button"
                      key={preset.label}
                      onClick={() => applyPreset(preset.mulai, preset.selesai)}
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-md border font-medium transition-all",
                        formJamMulai === preset.mulai && formJamSelesai === preset.selesai
                          ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                          : "bg-muted/50 hover:bg-muted text-muted-foreground border-border"
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formPengampuId}
                className="bg-primary text-primary-foreground font-semibold"
              >
                {isSubmitting ? "Menyimpan..." : editingJadwalId ? "Simpan Perubahan" : "Simpan Jadwal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
