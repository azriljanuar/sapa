"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  Calendar, Users, CheckCircle2, AlertCircle, Clock, 
  Search, Printer, RefreshCw, ShieldCheck, Check,
  Filter, Pencil, UserCheck, X
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

type KelasOption = {
  id: number
  namaKelas: string
}

type SantriItem = {
  id: number
  namaLengkap: string
  nisn: string
  rfidCardId?: string | null
  kelasId: number
  namaKelas: string
  status: "HADIR" | "TERLAMBAT" | "SAKIT" | "IZIN" | "ALPA" | null
  keterangan: string | null
  jamMasuk?: string | null
  jamPulang?: string | null
  metode?: string | null
}

export function GuruPiketRekapClient({
  kelasList,
  jenjangId,
  guruName,
  activeTaName,
}: {
  kelasList: KelasOption[]
  jenjangId: number
  guruName: string
  activeTaName: string
}) {
  const getTodayWib = () => {
    const now = new Date()
    const utc = now.getTime() + now.getTimezoneOffset() * 60000
    const nowWib = new Date(utc + 7 * 3600000)
    return nowWib.toISOString().split("T")[0]
  }

  const [selectedTanggal, setSelectedTanggal] = useState<string>(getTodayWib())
  const [selectedKelasId, setSelectedKelasId] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<{
    totalSantri: number
    summary: { hadir: number; terlambat: number; sakit: number; izin: number; alpa: number; belumAbsen: number }
    holiday?: { isLibur: boolean; namaLibur?: string; tipeLibur?: string }
    data: SantriItem[]
  } | null>(null)

  // Edit Modal State
  const [editTarget, setEditTarget] = useState<SantriItem | null>(null)
  const [newStatus, setNewStatus] = useState<"HADIR" | "TERLAMBAT" | "SAKIT" | "IZIN" | "ALPA">("HADIR")
  const [catatan, setCatatan] = useState("")
  const [saving, setSaving] = useState(false)

  const loadData = async (kelasId: string, tanggal: string) => {
    setLoading(true)
    setError(null)
    try {
      const url =
        kelasId === "ALL"
          ? `/api/rekap-harian?kelasId=ALL&jenjangId=${jenjangId}&tanggal=${tanggal}`
          : `/api/rekap-harian?kelasId=${kelasId}&tanggal=${tanggal}`

      const res = await fetch(url)
      const json = await res.json()
      if (!json.success) throw new Error(json.message || "Gagal memuat rekap absensi")
      setData(json)
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(selectedKelasId, selectedTanggal)
  }, [selectedKelasId, selectedTanggal])

  const handleOpenEdit = (item: SantriItem) => {
    setEditTarget(item)
    setNewStatus(item.status || "HADIR")
    setCatatan(item.keterangan || "")
  }

  const handleSaveStatus = async () => {
    if (!editTarget) return
    setSaving(true)
    try {
      const res = await fetch("/api/absensi-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kelasId: editTarget.kelasId,
          tanggal: selectedTanggal,
          absensiData: [
            {
              santriId: editTarget.id,
              status: newStatus,
              keterangan: catatan.trim(),
            },
          ],
        }),
      })

      const json = await res.json()
      if (!json.success) throw new Error(json.message || "Gagal menyimpan perubahan")

      setEditTarget(null)
      await loadData(selectedKelasId, selectedTanggal)
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan absensi")
    } finally {
      setSaving(false)
    }
  }

  // Filter santri
  const filteredSantri = useMemo(() => {
    if (!data?.data) return []
    return data.data.filter((s) => {
      const query = searchQuery.toLowerCase()
      const matchSearch =
        s.namaLengkap.toLowerCase().includes(query) ||
        s.nisn.includes(query) ||
        (s.namaKelas && s.namaKelas.toLowerCase().includes(query))

      let matchStatus = true
      if (statusFilter === "HADIR") matchStatus = s.status === "HADIR"
      else if (statusFilter === "TERLAMBAT") matchStatus = s.status === "TERLAMBAT"
      else if (statusFilter === "SAKIT") matchStatus = s.status === "SAKIT"
      else if (statusFilter === "IZIN") matchStatus = s.status === "IZIN"
      else if (statusFilter === "ALPA") matchStatus = s.status === "ALPA"
      else if (statusFilter === "BELUM") matchStatus = !s.status

      return matchSearch && matchStatus
    })
  }, [data, searchQuery, statusFilter])

  const getStatusBadge = (status: SantriItem["status"]) => {
    switch (status) {
      case "HADIR":
        return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">Hadir</Badge>
      case "TERLAMBAT":
        return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30">Terlambat</Badge>
      case "SAKIT":
        return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30">Sakit</Badge>
      case "IZIN":
        return <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30">Izin</Badge>
      case "ALPA":
        return <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30">Alpa</Badge>
      default:
        return <Badge variant="outline" className="text-muted-foreground">Belum Absen</Badge>
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Rekap Kehadiran (Piket)
            </h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              {activeTaName}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Monitoring kehadiran seluruh santri lintas kelas. Guru piket dapat mencatat santri izin, sakit, atau terlambat secara manual.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(selectedKelasId, selectedTanggal)}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Segarkan
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-2"
          >
            <Printer className="w-4 h-4" />
            Cetak Rekap
          </Button>
        </div>
      </div>

      {/* Date & Filter Bar */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Tanggal */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              Tanggal:
            </span>
            <Input
              type="date"
              value={selectedTanggal}
              onChange={(e) => setSelectedTanggal(e.target.value)}
              className="w-full sm:w-44 bg-background"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTanggal(getTodayWib())}
              className="text-xs text-primary"
            >
              Hari Ini
            </Button>
          </div>

          {/* Filter Kelas */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              Pilih Kelas:
            </span>
            <Select value={selectedKelasId} onValueChange={(val) => setSelectedKelasId(val || "ALL")}>
              <SelectTrigger className="w-full sm:w-[180px] bg-background">
                <SelectValue placeholder="Semua Kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Kelas</SelectItem>
                {kelasList.map((k) => (
                  <SelectItem key={k.id} value={String(k.id)}>
                    {k.namaKelas}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search & Status Filter */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-2 border-t border-border">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama santri, NISN, atau kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {["ALL", "HADIR", "TERLAMBAT", "SAKIT", "IZIN", "ALPA", "BELUM"].map((st) => (
              <Button
                key={st}
                type="button"
                variant={statusFilter === st ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(st)}
                className="text-xs capitalize h-8"
              >
                {st === "ALL" ? "Semua Status" : st === "BELUM" ? "Belum Absen" : st.toLowerCase()}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Holiday Notification */}
      {data?.holiday?.isLibur && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-700 dark:text-amber-300 text-sm flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            Pemberitahuan: Tanggal ini terdaftar sebagai hari libur ({data.holiday.namaLibur || "Hari Libur"}).
          </span>
        </div>
      )}

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="bg-card shadow-xs border-border">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Total Santri</div>
              <div className="text-2xl font-bold text-foreground mt-1">{data.totalSantri}</div>
            </CardContent>
          </Card>
          <Card className="bg-card shadow-xs border-border">
            <CardContent className="p-4">
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Hadir Tepat Waktu</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {Math.max(0, data.summary.hadir - data.summary.terlambat)}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card shadow-xs border-border">
            <CardContent className="p-4">
              <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">Terlambat</div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{data.summary.terlambat}</div>
            </CardContent>
          </Card>
          <Card className="bg-card shadow-xs border-border">
            <CardContent className="p-4">
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Sakit / Izin</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {data.summary.sakit + data.summary.izin}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card shadow-xs border-border">
            <CardContent className="p-4">
              <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">Alpa</div>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{data.summary.alpa}</div>
            </CardContent>
          </Card>
          <Card className="bg-card shadow-xs border-border">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Belum Absen</div>
              <div className="text-2xl font-bold text-muted-foreground mt-1">{data.summary.belumAbsen}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table Data */}
      <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-12 text-center">No</TableHead>
                <TableHead>Nama Santri</TableHead>
                <TableHead>NISN</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Waktu Masuk / Pulang</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="text-right print:hidden">Aksi Piket</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Memuat data kehadiran santri...
                  </TableCell>
                </TableRow>
              ) : filteredSantri.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="font-medium">Tidak ada data santri ditemukan</p>
                    <p className="text-xs text-muted-foreground/80 mt-1">
                      Coba ubah filter kelas, tanggal, atau kata kunci pencarian.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSantri.map((item, idx) => (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-center font-medium text-muted-foreground text-sm">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground text-sm">
                      {item.namaLengkap}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {item.nisn}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {item.namaKelas}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.jamMasuk ? (
                        <div className="space-y-0.5">
                          <span className="font-medium text-foreground">
                            Masuk: {new Date(item.jamMasuk).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {item.jamPulang && (
                            <span className="block text-[11px]">
                              Pulang: {new Date(item.jamPulang).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                          {item.metode && (
                            <span className="text-[10px] text-muted-foreground/70 block">
                              via {item.metode}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="italic text-muted-foreground/60">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {item.keterangan || <span className="italic text-muted-foreground/50">-</span>}
                    </TableCell>
                    <TableCell className="text-right print:hidden">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(item)}
                        className="gap-1.5 text-xs text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Ubah Status
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Absensi Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Catat / Ubah Kehadiran Manual</DialogTitle>
          </DialogHeader>

          {editTarget && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted/50 rounded-xl space-y-1">
                <div className="font-bold text-foreground text-sm">{editTarget.namaLengkap}</div>
                <div className="text-xs text-muted-foreground">
                  NISN: {editTarget.nisn} • Kelas: {editTarget.namaKelas}
                </div>
                <div className="text-xs text-muted-foreground">
                  Tanggal: {selectedTanggal}
                </div>
              </div>

              {/* Status Radio / Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Pilih Status Kehadiran
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["HADIR", "TERLAMBAT", "SAKIT", "IZIN", "ALPA"] as const).map((st) => (
                    <button
                      type="button"
                      key={st}
                      onClick={() => setNewStatus(st)}
                      className={cn(
                        "px-3 py-2 rounded-lg border text-xs font-semibold text-left transition-all",
                        newStatus === st
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-background text-foreground border-input hover:bg-muted"
                      )}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Catatan / Keterangan */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Keterangan / Alasan (Opsional)
                </label>
                <Input
                  placeholder="Contoh: Izin ke UKS / Terlambat ban bocor / Sakit flu"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setEditTarget(null)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button onClick={handleSaveStatus} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
