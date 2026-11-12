"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  Calendar, Users, CheckCircle2, AlertCircle, Clock, 
  Search, Printer, RefreshCw, ShieldCheck, ChevronDown, Check,
  Filter, Sparkles, BookOpen
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type KelasItem = {
  id: number
  namaKelas: string
  jenjang: string
  tahunAjaran: string
  totalSantri: number
}

type SantriKehadiran = {
  id: number
  namaLengkap: string
  nisn: string
  status: "HADIR" | "TERLAMBAT" | "SAKIT" | "IZIN" | "ALPA" | null
  keterangan: string | null
  jamMasuk?: string | null
  jamPulang?: string | null
  metode?: string | null
}

export function WaliRekapClient({
  kelasList,
  guruName
}: {
  kelasList: KelasItem[]
  guruName: string
}) {
  const [selectedKelasId, setSelectedKelasId] = useState<string>(
    kelasList[0]?.id ? String(kelasList[0].id) : ""
  )
  const [selectedTanggal, setSelectedTanggal] = useState<string>(
    new Date().toISOString().split("T")[0]
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("SEMUA")

  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<{
    totalSantri: number
    summary: { hadir: number; sakit: number; izin: number; alpa: number; belumAbsen: number }
    holiday?: { isLibur: boolean; namaLibur?: string; tipeLibur?: string }
    data: SantriKehadiran[]
  } | null>(null)

  const activeKelas = useMemo(() => {
    return kelasList.find(k => String(k.id) === selectedKelasId) || kelasList[0]
  }, [kelasList, selectedKelasId])

  const loadData = async (kelasId: string, tanggal: string) => {
    if (!kelasId || !tanggal) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/rekap-harian?kelasId=${kelasId}&tanggal=${tanggal}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.message || "Gagal memuat rekap absensi")
      setData(json)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedKelasId && selectedTanggal) {
      loadData(selectedKelasId, selectedTanggal)
    }
  }, [selectedKelasId, selectedTanggal])

  // Update status manual oleh wali kelas
  const handleUpdateStatus = async (santriId: number, newStatus: "HADIR" | "SAKIT" | "IZIN" | "ALPA", keterangan?: string) => {
    setSavingId(santriId)
    try {
      const res = await fetch("/api/absensi-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kelasId: selectedKelasId,
          absensiData: [
            {
              santriId,
              status: newStatus,
              keterangan: keterangan || ""
            }
          ]
        })
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || "Gagal memperbarui status")
      // Muat ulang data terbaru
      await loadData(selectedKelasId, selectedTanggal)
    } catch (err: any) {
      alert("Gagal update absensi: " + err.message)
    } finally {
      setSavingId(null)
    }
  }

  // Quick set date helper
  const setToday = () => {
    setSelectedTanggal(new Date().toISOString().split("T")[0])
  }

  const setYesterday = () => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    setSelectedTanggal(d.toISOString().split("T")[0])
  }

  // Filter santri
  const filteredSantri = useMemo(() => {
    if (!data?.data) return []
    return data.data.filter(s => {
      const matchSearch = s.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.nisn.includes(searchQuery)
      
      let matchStatus = true
      if (statusFilter === "HADIR") matchStatus = s.status === "HADIR"
      else if (statusFilter === "SAKIT") matchStatus = s.status === "SAKIT"
      else if (statusFilter === "IZIN") matchStatus = s.status === "IZIN"
      else if (statusFilter === "ALPA") matchStatus = s.status === "ALPA"
      else if (statusFilter === "BELUM") matchStatus = !s.status

      return matchSearch && matchStatus
    })
  }, [data, searchQuery, statusFilter])

  const totalSantri = data?.totalSantri || 0
  const hadirCount = data?.summary.hadir || 0
  const persentaseHadir = totalSantri > 0 ? Math.round((hadirCount / totalSantri) * 100) : 0

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-6 sm:p-8 border border-primary/20 relative overflow-hidden print:hidden">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md bg-primary/20 text-primary text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Tugas Wali Kelas
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                {activeKelas?.namaKelas} &middot; {activeKelas?.jenjang}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Rekap Kehadiran Siswa
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Pantau rekapitulasi presensi harian santri kelas binaan Anda. Anda dapat memeriksa catatan kehadiran atau memperbarui status presensi siswa yang izin/sakit.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-2 bg-card hover:bg-muted text-foreground border-border shadow-2xs font-semibold"
            >
              <Printer className="w-4 h-4" /> Cetak Rekap
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => loadData(selectedKelasId, selectedTanggal)}
              disabled={loading}
              className="gap-2 font-semibold shadow-xs"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Segarkan
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Bar: Kelas & Tanggal */}
      <div className="bg-card rounded-xl p-4 sm:p-5 border border-border shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 print:hidden">
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Pilih Kelas (jika wali kelas mengampu lebih dari 1 kelas) */}
          {kelasList.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Kelas:</span>
              <select
                value={selectedKelasId}
                onChange={(e) => setSelectedKelasId(e.target.value)}
                className="bg-background text-foreground border border-border rounded-lg px-3 py-2 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary"
              >
                {kelasList.map(k => (
                  <option key={k.id} value={k.id}>
                    {k.namaKelas} ({k.jenjang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Pilih Tanggal */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" /> Tanggal:
            </span>
            <input
              type="date"
              value={selectedTanggal}
              onChange={(e) => setSelectedTanggal(e.target.value)}
              className="bg-background text-foreground border border-border rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Quick buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={setToday}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-semibold transition-colors border",
                selectedTanggal === new Date().toISOString().split("T")[0]
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground border-border"
              )}
            >
              Hari Ini
            </button>
            <button
              onClick={setYesterday}
              className="px-2.5 py-1 rounded-md text-xs font-semibold transition-colors border bg-muted/40 hover:bg-muted text-muted-foreground border-border"
            >
              Kemarin
            </button>
          </div>
        </div>

        {/* Pencarian Santri */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Cari nama santri / NISN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>

      </div>

      {/* Banner Peringatan Hari Libur */}
      {data?.holiday?.isLibur && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
              Hari Libur: {data.holiday.namaLibur}
            </div>
            <div className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
              {data.holiday.tipeLibur === "SEMESTER"
                ? "Libur Semester — Rekap kehadiran mencatat santri/guru yang hadir berkegiatan."
                : "Tanggal yang dipilih adalah hari libur kegiatan belajar mengajar."}
            </div>
          </div>
        </div>
      )}

      {/* Ringkasan Statistik */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Total Santri */}
        <div className="bg-card rounded-xl p-4 border border-border shadow-2xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Siswa</div>
          <div className="text-2xl font-extrabold text-foreground mt-1">{totalSantri}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Kelas {activeKelas?.namaKelas}</div>
        </div>

        {/* Hadir */}
        <div className="bg-card rounded-xl p-4 border border-emerald-500/20 shadow-2xs bg-emerald-500/[0.02]">
          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Hadir
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {data?.summary.hadir || 0}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{persentaseHadir}% kehadiran</div>
        </div>

        {/* Sakit */}
        <div className="bg-card rounded-xl p-4 border border-orange-500/20 shadow-2xs bg-orange-500/[0.02]">
          <div className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Sakit
          </div>
          <div className="text-2xl font-extrabold text-orange-600 dark:text-orange-400 mt-1">
            {data?.summary.sakit || 0}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Surat / konfirmasi</div>
        </div>

        {/* Izin */}
        <div className="bg-card rounded-xl p-4 border border-blue-500/20 shadow-2xs bg-blue-500/[0.02]">
          <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Izin
          </div>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            {data?.summary.izin || 0}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Izin kegiatan/keluarga</div>
        </div>

        {/* Alpa */}
        <div className="bg-card rounded-xl p-4 border border-rose-500/20 shadow-2xs bg-rose-500/[0.02]">
          <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Alpa
          </div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
            {data?.summary.alpa || 0}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Tanpa keterangan</div>
        </div>

        {/* Belum Presensi */}
        <div className="bg-card rounded-xl p-4 border border-border shadow-2xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            Belum Absen
          </div>
          <div className="text-2xl font-extrabold text-muted-foreground mt-1">
            {data?.summary.belumAbsen || 0}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Menunggu presensi</div>
        </div>

      </div>

      {/* Filter Tabs Status */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none print:hidden">
        {[
          { key: "SEMUA", label: "Semua Siswa", count: data?.data?.length || 0 },
          { key: "HADIR", label: "Hadir", count: data?.summary.hadir || 0 },
          { key: "SAKIT", label: "Sakit", count: data?.summary.sakit || 0 },
          { key: "IZIN", label: "Izin", count: data?.summary.izin || 0 },
          { key: "ALPA", label: "Alpa", count: data?.summary.alpa || 0 },
          { key: "BELUM", label: "Belum Absen", count: data?.summary.belumAbsen || 0 },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5",
              statusFilter === tab.key
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <span>{tab.label}</span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.2 rounded-full",
              statusFilter === tab.key ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tabel Data Rekap Santri */}
      <div className="bg-card rounded-xl border border-border shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Daftar Santri Kelas {activeKelas?.namaKelas}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tanggal: {new Date(selectedTanggal).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            Menampilkan {filteredSantri.length} dari {totalSantri} santri
          </span>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 w-32">NISN</th>
                <th className="py-3 px-4">Nama Lengkap Santri</th>
                <th className="py-3 px-4 w-40 text-center">Status Kehadiran</th>
                <th className="py-3 px-4 w-32">Jam Absen</th>
                <th className="py-3 px-4 w-48">Keterangan</th>
                <th className="py-3 px-4 w-48 text-right print:hidden">Aksi Wali Kelas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Memuat data presensi santri...
                  </td>
                </tr>
              ) : filteredSantri.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    Tidak ada data santri yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredSantri.map((santri, idx) => {
                  const isSaving = savingId === santri.id

                  return (
                    <tr key={santri.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 text-center font-medium text-muted-foreground">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-foreground">
                        {santri.nisn}
                      </td>
                      <td className="py-3 px-4 font-semibold text-foreground">
                        {santri.namaLengkap}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {santri.status === "HADIR" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" /> Hadir
                          </span>
                        ) : santri.status === "TERLAMBAT" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-amber-500/15 text-amber-700 dark:text-amber-400">
                            <Clock className="w-3 h-3" /> Terlambat
                          </span>
                        ) : santri.status === "SAKIT" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-orange-500/10 text-orange-600 dark:text-orange-400">
                            <AlertCircle className="w-3 h-3" /> Sakit
                          </span>
                        ) : santri.status === "IZIN" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Clock className="w-3 h-3" /> Izin
                          </span>
                        ) : santri.status === "ALPA" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            <AlertCircle className="w-3 h-3" /> Alpa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-muted text-muted-foreground">
                            Belum Presensi
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {santri.jamMasuk ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                            {new Date(santri.jamMasuk).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                            {santri.jamPulang && (
                              <span className="text-muted-foreground font-normal">
                                {" "}— {new Date(santri.jamPulang).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-[11px]">
                        {santri.keterangan || "-"}
                      </td>
                      <td className="py-3 px-4 text-right print:hidden">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            disabled={isSaving}
                            onClick={() => handleUpdateStatus(santri.id, "HADIR")}
                            title="Tandai Hadir"
                            className={cn(
                              "px-2 py-1 rounded text-[10px] font-bold transition-colors",
                              santri.status === "HADIR"
                                ? "bg-emerald-600 text-white"
                                : "bg-muted hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            )}
                          >
                            H
                          </button>
                          <button
                            disabled={isSaving}
                            onClick={() => handleUpdateStatus(santri.id, "SAKIT")}
                            title="Tandai Sakit"
                            className={cn(
                              "px-2 py-1 rounded text-[10px] font-bold transition-colors",
                              santri.status === "SAKIT"
                                ? "bg-orange-600 text-white"
                                : "bg-muted hover:bg-orange-500/20 text-orange-600 dark:text-orange-400"
                            )}
                          >
                            S
                          </button>
                          <button
                            disabled={isSaving}
                            onClick={() => handleUpdateStatus(santri.id, "IZIN")}
                            title="Tandai Izin"
                            className={cn(
                              "px-2 py-1 rounded text-[10px] font-bold transition-colors",
                              santri.status === "IZIN"
                                ? "bg-blue-600 text-white"
                                : "bg-muted hover:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                            )}
                          >
                            I
                          </button>
                          <button
                            disabled={isSaving}
                            onClick={() => handleUpdateStatus(santri.id, "ALPA")}
                            title="Tandai Alpa"
                            className={cn(
                              "px-2 py-1 rounded text-[10px] font-bold transition-colors",
                              santri.status === "ALPA"
                                ? "bg-rose-600 text-white"
                                : "bg-muted hover:bg-rose-500/20 text-rose-600 dark:text-rose-400"
                            )}
                          >
                            A
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <div>
            Wali Kelas: <strong className="text-foreground">{guruName}</strong>
          </div>
          <div className="print:hidden text-[11px]">
            * Klik tombol H/S/I/A untuk memperbarui absensi santri secara langsung.
          </div>
        </div>

      </div>

    </div>
  )
}
