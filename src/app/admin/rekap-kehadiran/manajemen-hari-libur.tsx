"use client"

import { useState, useTransition } from "react"
import { Hari } from "@prisma/client"
import { Calendar, Plus, Trash2, Loader2, CheckCircle2, AlertCircle, Info, CalendarDays, SunMedium } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  saveLiburMingguan,
  addLiburKondisional,
  addLiburSemester,
  deleteHariLibur,
} from "./actions"

interface HariLiburItem {
  id: number
  tipe: "MINGGUAN" | "KONDISIONAL" | "SEMESTER"
  nama: string
  hariMingguan?: Hari | null
  tanggal?: Date | string | null
  tanggalMulai?: Date | string | null
  tanggalAkhir?: Date | string | null
  keterangan?: string | null
  jenjangId?: number | null
  jenjang?: { id: number; nama: string; singkatan: string } | null
}

interface ManajemenHariLiburProps {
  initialMingguan: Hari[]
  initialKondisional: HariLiburItem[]
  initialSemester: HariLiburItem[]
  jenjangId?: number
  onRefresh?: () => void
}

const HARI_OPTIONS: { key: Hari; label: string }[] = [
  { key: "SENIN", label: "Senin" },
  { key: "SELASA", label: "Selasa" },
  { key: "RABU", label: "Rabu" },
  { key: "KAMIS", label: "Kamis" },
  { key: "JUMAT", label: "Jumat" },
  { key: "SABTU", label: "Sabtu" },
  { key: "MINGGU", label: "Minggu" },
]

export function ManajemenHariLibur({
  initialMingguan = [],
  initialKondisional = [],
  initialSemester = [],
  jenjangId,
  onRefresh,
}: ManajemenHariLiburProps) {
  // State Section 1: Mingguan
  const [selectedMingguan, setSelectedMingguan] = useState<Hari[]>(initialMingguan)
  const [isPendingMingguan, startTransitionMingguan] = useTransition()
  const [mingguanFeedback, setMingguanFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // State Section 2: Kondisional
  const [kondisionalList, setKondisionalList] = useState<HariLiburItem[]>(initialKondisional)
  const [isPendingKondisional, startTransitionKondisional] = useTransition()
  const [kondisionalFeedback, setKondisionalFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // State Section 3: Semester
  const [semesterList, setSemesterList] = useState<HariLiburItem[]>(initialSemester)
  const [isPendingSemester, startTransitionSemester] = useTransition()
  const [semesterFeedback, setSemesterFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Handler Libur Mingguan
  const toggleHariMingguan = (hari: Hari) => {
    setSelectedMingguan((prev) =>
      prev.includes(hari) ? prev.filter((h) => h !== hari) : [...prev, hari]
    )
  }

  const handleSaveMingguan = () => {
    setMingguanFeedback(null)
    startTransitionMingguan(async () => {
      const res = await saveLiburMingguan(selectedMingguan, jenjangId)
      if (res.success) {
        setMingguanFeedback({ type: "success", text: res.message })
        if (onRefresh) onRefresh()
      } else {
        setMingguanFeedback({ type: "error", text: res.message })
      }
    })
  }

  // Handler Libur Kondisional
  const handleAddKondisional = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setKondisionalFeedback(null)
    const form = e.currentTarget
    const formData = new FormData(form)
    if (jenjangId) formData.set("jenjangId", String(jenjangId))

    startTransitionKondisional(async () => {
      const res = await addLiburKondisional(formData)
      if (res.success) {
        setKondisionalFeedback({ type: "success", text: res.message })
        form.reset()
        if (onRefresh) onRefresh()
      } else {
        setKondisionalFeedback({ type: "error", text: res.message })
      }
    })
  }

  // Handler Libur Semester
  const handleAddSemester = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSemesterFeedback(null)
    const form = e.currentTarget
    const formData = new FormData(form)
    if (jenjangId) formData.set("jenjangId", String(jenjangId))

    startTransitionSemester(async () => {
      const res = await addLiburSemester(formData)
      if (res.success) {
        setSemesterFeedback({ type: "success", text: res.message })
        form.reset()
        if (onRefresh) onRefresh()
      } else {
        setSemesterFeedback({ type: "error", text: res.message })
      }
    })
  }

  // Handler Hapus Libur
  const handleDelete = (id: number, nama: string, tipe: "KONDISIONAL" | "SEMESTER") => {
    if (!confirm(`Konfirmasi: Apakah Anda yakin ingin menghapus data libur "${nama}"?`)) {
      return
    }

    const startTransitionFn = tipe === "KONDISIONAL" ? startTransitionKondisional : startTransitionSemester
    const setFeedbackFn = tipe === "KONDISIONAL" ? setKondisionalFeedback : setSemesterFeedback

    startTransitionFn(async () => {
      const res = await deleteHariLibur(id)
      if (res.success) {
        setFeedbackFn({ type: "success", text: res.message })
        if (tipe === "KONDISIONAL") {
          setKondisionalList((prev) => prev.filter((item) => item.id !== id))
        } else {
          setSemesterList((prev) => prev.filter((item) => item.id !== id))
        }
        if (onRefresh) onRefresh()
      } else {
        setFeedbackFn({ type: "error", text: res.message })
      }
    })
  }

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: LIBUR RUTIN MINGGUAN */}
      <Card className="border-border shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <SunMedium className="w-5 h-5 text-amber-500" />
            <CardTitle className="text-base sm:text-lg">1. Hari Libur Rutin Mingguan</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Pilih hari-hari yang selalu diliburkan setiap minggu (misal: Ahad/Minggu & Jumat atau Sabtu).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {HARI_OPTIONS.map((item) => {
              const isChecked = selectedMingguan.includes(item.key)
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => toggleHariMingguan(item.key)}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all ${
                    isChecked
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300 shadow-2xs font-bold"
                      : "bg-card border-border hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <span className="text-sm">{item.label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${isChecked ? "bg-amber-500/30 text-amber-900 dark:text-amber-200" : "bg-muted text-muted-foreground"}`}>
                    {isChecked ? "Libur" : "Masuk"}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <p className="text-[11px] text-muted-foreground">
              • Scan RFID pada hari libur mingguan yang dipilih akan <strong>ditolak</strong> dengan pemberitahuan hari libur.
            </p>
            <Button
              type="button"
              onClick={handleSaveMingguan}
              disabled={isPendingMingguan}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5 shadow-2xs shrink-0"
            >
              {isPendingMingguan ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Simpan Libur Mingguan
                </>
              )}
            </Button>
          </div>

          {mingguanFeedback && (
            <div
              className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                mingguanFeedback.type === "success"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
              }`}
            >
              {mingguanFeedback.text}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 2: LIBUR KONDISIONAL (TANGGAL TERTENTU) */}
      <Card className="border-border shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-base sm:text-lg">2. Hari Libur Kondisional / Nasional</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Atur hari libur tanggal tertentu, seperti hari besar nasional, hari raya, atau agenda libur khusus madrasah.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Form Tambah Libur Kondisional */}
          <form onSubmit={handleAddKondisional} className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-3">
            <div className="text-xs font-bold text-foreground">Tambah Libur Kondisional</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="namaKondisional" className="text-xs">Nama Libur</Label>
                <Input
                  id="namaKondisional"
                  name="nama"
                  placeholder="Contoh: HUT RI, Isra Miraj, dll."
                  required
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tanggalKondisional" className="text-xs">Tanggal Libur</Label>
                <Input
                  id="tanggalKondisional"
                  name="tanggal"
                  type="date"
                  required
                  className="text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ketKondisional" className="text-xs">Keterangan (Opsional)</Label>
                <Input
                  id="ketKondisional"
                  name="keterangan"
                  placeholder="Opsional"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                disabled={isPendingKondisional}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5 shadow-2xs"
              >
                {isPendingKondisional ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Menambahkan...
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Libur Kondisional
                  </>
                )}
              </Button>
            </div>
          </form>

          {kondisionalFeedback && (
            <div
              className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                kondisionalFeedback.type === "success"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
              }`}
            >
              {kondisionalFeedback.text}
            </div>
          )}

          {/* Tabel Libur Kondisional */}
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Tanggal</th>
                    <th className="px-4 py-2.5 font-semibold">Nama Hari Libur</th>
                    <th className="px-4 py-2.5 font-semibold">Keterangan</th>
                    <th className="px-4 py-2.5 font-semibold text-center w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {kondisionalList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-xs text-muted-foreground">
                        Belum ada daftar libur kondisional yang ditambahkan.
                      </td>
                    </tr>
                  ) : (
                    kondisionalList.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-2.5 text-xs font-mono font-medium text-foreground">
                          {item.tanggal ? new Date(item.tanggal).toLocaleDateString("id-ID", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }) : "-"}
                        </td>
                        <td className="px-4 py-2.5 text-xs font-semibold text-foreground">
                          {item.nama}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground italic">
                          {item.keterangan || "-"}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id, item.nama, "KONDISIONAL")}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3: LIBUR SEMESTER (RENTANG TANGGAL) */}
      <Card className="border-border shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <CalendarDays className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-base sm:text-lg">3. Hari Libur Semester (Rentang Tanggal)</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Atur rentang libur akhir semester atau libur pergantian tahun pelajaran.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Note Khusus Libur Semester */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
            <Info className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
              <strong>Ketentuan Khusus Libur Semester:</strong> Berbeda dengan libur mingguan/nasional, pada masa libur semester mesin RFID <strong>tetap dapat mencatat kehadiran</strong> bagi guru, karyawan, atau santri yang datang berkegiatan/piket di madrasah.
            </div>
          </div>

          {/* Form Tambah Libur Semester */}
          <form onSubmit={handleAddSemester} className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-3">
            <div className="text-xs font-bold text-foreground">Tambah Rentang Libur Semester</div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="namaSemester" className="text-xs">Nama Libur Semester</Label>
                <Input
                  id="namaSemester"
                  name="nama"
                  placeholder="Contoh: Libur Akhir Semester Ganjil 2024/2025"
                  required
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tglMulaiSemester" className="text-xs">Tanggal Mulai</Label>
                <Input
                  id="tglMulaiSemester"
                  name="tanggalMulai"
                  type="date"
                  required
                  className="text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tglAkhirSemester" className="text-xs">Tanggal Akhir</Label>
                <Input
                  id="tglAkhirSemester"
                  name="tanggalAkhir"
                  type="date"
                  required
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                disabled={isPendingSemester}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5 shadow-2xs"
              >
                {isPendingSemester ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Menambahkan...
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Libur Semester
                  </>
                )}
              </Button>
            </div>
          </form>

          {semesterFeedback && (
            <div
              className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                semesterFeedback.type === "success"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
              }`}
            >
              {semesterFeedback.text}
            </div>
          )}

          {/* Tabel Libur Semester */}
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Nama Libur</th>
                    <th className="px-4 py-2.5 font-semibold">Rentang Tanggal</th>
                    <th className="px-4 py-2.5 font-semibold">Durasi</th>
                    <th className="px-4 py-2.5 font-semibold text-center w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {semesterList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-xs text-muted-foreground">
                        Belum ada rentang libur semester yang didaftarkan.
                      </td>
                    </tr>
                  ) : (
                    semesterList.map((item) => {
                      let durasiHari = 0
                      if (item.tanggalMulai && item.tanggalAkhir) {
                        const m = new Date(item.tanggalMulai).getTime()
                        const a = new Date(item.tanggalAkhir).getTime()
                        durasiHari = Math.max(1, Math.round((a - m) / (1000 * 60 * 60 * 24)) + 1)
                      }
                      return (
                        <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                          <td className="px-4 py-2.5 text-xs font-semibold text-foreground">
                            {item.nama}
                          </td>
                          <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">
                            {item.tanggalMulai ? new Date(item.tanggalMulai).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                            {" s/d "}
                            {item.tanggalAkhir ? new Date(item.tanggalAkhir).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                          </td>
                          <td className="px-4 py-2.5 text-xs">
                            <Badge variant="outline" className="font-mono text-[11px]">
                              {durasiHari} Hari
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id, item.nama, "SEMESTER")}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
