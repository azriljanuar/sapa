"use client"

import { useState, useEffect } from "react"
import { Calendar, ClipboardList, Loader2, AlertCircle, Info, Printer, Settings, BookOpen, CalendarDays, UserCheck, CheckCircle2, ChevronDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ManajemenAbsensiTab } from "./manajemen-absensi-tab"

export default function RekapKehadiranClient({ 
  kelasList, 
  jenjangId,
  jenjangNama, 
  tahunAjaran,
  tahunAjaranId,
  initialConfig,
  initialHariLibur,
}: { 
  kelasList: any[], 
  jenjangId: number,
  jenjangNama: string, 
  tahunAjaran: string,
  tahunAjaranId?: number,
  initialConfig: any,
  initialHariLibur?: any,
}) {
  const [activeTab, setActiveTab] = useState("santri")
  
  const [selectedKelasId, setSelectedKelasId] = useState<string>("")
  const [selectedTanggal, setSelectedTanggal] = useState<string>(
    new Date().toISOString().split("T")[0] // default hari ini
  )

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [guruData, setGuruData] = useState<any>(null)
  const [loadingGuru, setLoadingGuru] = useState(false)
  const [errorGuru, setErrorGuru] = useState<string | null>(null)

  useEffect(() => {
    if (activeTab === "santri") {
      if (selectedKelasId && selectedTanggal) {
        loadData(selectedKelasId, selectedTanggal)
      } else {
        setData(null)
      }
    } else if (activeTab === "guru" || activeTab === "manajemen") {
      if (selectedTanggal) {
        loadGuruData(selectedTanggal)
      }
    }
  }, [activeTab, selectedKelasId, selectedTanggal])

  const loadData = async (kelasId: string, tanggal: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/rekap-harian?kelasId=${kelasId}&tanggal=${tanggal}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      setData(json)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadGuruData = async (tanggal: string) => {
    setLoadingGuru(true)
    setErrorGuru(null)
    try {
      const url = `/api/rekap-guru-harian?jenjangId=${jenjangId}&tanggal=${tanggal}${
        tahunAjaranId ? `&tahunAjaranId=${tahunAjaranId}` : ""
      }`
      const res = await fetch(url)
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      setGuruData(json)
    } catch (err: any) {
      setErrorGuru(err.message)
    } finally {
      setLoadingGuru(false)
    }
  }

  const getStatusBadge = (status: string | null) => {
    switch(status) {
      case "HADIR": return <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-transparent shadow-none">Hadir</Badge>
      case "TERLAMBAT": return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 border-transparent shadow-none">Terlambat</Badge>
      case "SAKIT": return <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border-transparent shadow-none">Sakit</Badge>
      case "IZIN": return <Badge className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-transparent shadow-none">Izin</Badge>
      case "ALPA": return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-transparent shadow-none">Alpa</Badge>
      default: return <Badge variant="outline" className="text-muted-foreground border-border shadow-none">Belum Absen</Badge>
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <ClipboardList className="h-7 w-7 text-primary" />
          Rekap Kehadiran Harian
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Jenjang: {jenjangNama}
        </p>
      </div>

      <Tabs defaultValue="santri" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="santri">Rekap Santri</TabsTrigger>
          <TabsTrigger value="guru">Rekap Guru</TabsTrigger>
          <TabsTrigger value="manajemen" className="flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5" />
            Manajemen Absensi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="santri" className="space-y-5">
          <div className="bg-card p-4 rounded-xl border border-border shadow-xs flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Pilih Kelas</label>
              <select 
                value={selectedKelasId}
                onChange={(e) => setSelectedKelasId(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-1 focus:ring-ring outline-none bg-background text-sm text-foreground"
              >
                <option value="">-- Pilih Kelas --</option>
                {kelasList.map(k => (
                  <option key={k.id} value={k.id}>{k.namaKelas}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Pilih Tanggal</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="date"
                  value={selectedTanggal}
                  onChange={(e) => setSelectedTanggal(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-input rounded-lg focus:ring-1 focus:ring-ring outline-none bg-background text-sm text-foreground"
                />
              </div>
            </div>
            <div className="pt-2 sm:pt-6 w-full sm:w-auto">
              <Button 
                variant="outline"
                className="w-full sm:w-auto h-9 text-xs"
                onClick={() => setSelectedTanggal(new Date().toISOString().split("T")[0])}
              >
                Hari Ini
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-primary space-y-3">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm text-muted-foreground font-medium">Memuat data absensi santri...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center bg-destructive/10 border border-destructive/20 rounded-xl">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-destructive font-medium text-sm">{error}</p>
            </div>
          ) : data ? (
            <div className="space-y-4">
              {data.holiday?.isLibur && (
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
                        ? "Libur Semester — Rekap menampilkan santri/guru yang hadir berkegiatan."
                        : "Tanggal yang dipilih adalah hari libur kegiatan belajar mengajar."}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <a
                  href={`/admin/rekap-kehadiran/print?kelasId=${selectedKelasId}&tanggal=${selectedTanggal}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg transition shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Rekap
                </a>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card className="bg-primary/10 border-primary/20 shadow-none">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                    <span className="text-xs font-semibold text-primary mb-1">Hadir</span>
                    <span className="text-2xl font-bold text-primary">{data.summary.hadir}</span>
                  </CardContent>
                </Card>
                <Card className="bg-amber-500/10 border-amber-500/20 shadow-none">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                    <span className="text-xs font-semibold text-amber-700 mb-1">Sakit</span>
                    <span className="text-2xl font-bold text-amber-700">{data.summary.sakit}</span>
                  </CardContent>
                </Card>
                <Card className="bg-blue-500/10 border-blue-500/20 shadow-none">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                    <span className="text-xs font-semibold text-blue-700 mb-1">Izin</span>
                    <span className="text-2xl font-bold text-blue-700">{data.summary.izin}</span>
                  </CardContent>
                </Card>
                <Card className="bg-destructive/10 border-destructive/20 shadow-none">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                    <span className="text-xs font-semibold text-destructive mb-1">Alpa</span>
                    <span className="text-2xl font-bold text-destructive">{data.summary.alpa}</span>
                  </CardContent>
                </Card>
                <Card className="bg-muted border-border shadow-none">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                    <span className="text-xs font-semibold text-muted-foreground mb-1">Belum Absen</span>
                    <span className="text-2xl font-bold text-foreground">{data.summary.belumAbsen}</span>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-5 py-3 font-semibold">No</th>
                        <th className="px-5 py-3 font-semibold">Nama Santri</th>
                        <th className="px-5 py-3 font-semibold">NISN</th>
                        <th className="px-5 py-3 font-semibold text-center">Status</th>
                        <th className="px-5 py-3 font-semibold">Jam Absen</th>
                        <th className="px-5 py-3 font-semibold">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.data.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                            Tidak ada data santri di kelas ini.
                          </td>
                        </tr>
                      ) : (
                        data.data.map((santri: any, idx: number) => (
                          <tr key={santri.id} className="hover:bg-muted/40 transition-colors">
                            <td className="px-5 py-3 text-muted-foreground text-xs">{idx + 1}</td>
                            <td className="px-5 py-3 font-medium text-foreground">{santri.namaLengkap}</td>
                            <td className="px-5 py-3 text-muted-foreground text-xs">{santri.nisn || "-"}</td>
                            <td className="px-5 py-3 text-center">
                              {getStatusBadge(santri.status)}
                            </td>
                            <td className="px-5 py-3 text-xs font-mono">
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
                            <td className="px-5 py-3 text-muted-foreground text-xs italic">
                              {santri.keterangan || "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground flex flex-col items-center">
              <Info className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm">Pilih kelas dan tanggal untuk melihat rekap kehadiran santri.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="guru" className="space-y-5">
          <div className="bg-card p-4 rounded-xl border border-border shadow-xs flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 w-full max-w-sm">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Pilih Tanggal</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="date"
                  value={selectedTanggal}
                  onChange={(e) => setSelectedTanggal(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-input rounded-lg focus:ring-1 focus:ring-ring outline-none bg-background text-sm text-foreground"
                />
              </div>
            </div>
            <div className="pt-2 sm:pt-6 w-full sm:w-auto">
              <Button 
                variant="outline"
                className="w-full sm:w-auto h-9 text-xs"
                onClick={() => setSelectedTanggal(new Date().toISOString().split("T")[0])}
              >
                Hari Ini
              </Button>
            </div>
          </div>

          {loadingGuru ? (
            <div className="py-16 flex flex-col items-center justify-center text-primary space-y-3">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm text-muted-foreground font-medium">Memuat data absensi guru...</p>
            </div>
          ) : errorGuru ? (
            <div className="p-6 text-center bg-destructive/10 border border-destructive/20 rounded-xl">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-destructive font-medium text-sm">{errorGuru}</p>
            </div>
          ) : guruData ? (
            <div className="space-y-6">
              {guruData.holiday?.isLibur && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      Hari Libur: {guruData.holiday.namaLibur}
                    </div>
                    <div className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                      {guruData.holiday.tipeLibur === "SEMESTER"
                        ? "Libur Semester — Rekap menampilkan pendidik yang hadir piket atau berkegiatan."
                        : "Tanggal yang dipilih adalah hari libur kegiatan belajar mengajar."}
                    </div>
                  </div>
                </div>
              )}

              {/* Ringkasan Statistik */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="bg-primary/10 border-primary/20 shadow-none">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                    <span className="text-xs font-semibold text-primary mb-1">
                      Terjadwal ({guruData.namaHari})
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      {guruData.summary.totalTerjadwal ?? 0}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      {guruData.summary.hadirTerjadwal ?? 0} Hadir • {guruData.summary.belumAbsenTerjadwal ?? 0} Belum
                    </span>
                  </CardContent>
                </Card>

                <Card className="bg-emerald-500/10 border-emerald-500/20 shadow-none">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                      Hadir Sesuai Jadwal
                    </span>
                    <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                      {guruData.summary.hadirTerjadwal ?? 0}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      Guru bertatap muka hari ini
                    </span>
                  </CardContent>
                </Card>

                <Card className="bg-amber-500/10 border-amber-500/20 shadow-none">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                      Hadir Di Luar Jadwal
                    </span>
                    <span className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                      {guruData.summary.totalLuarJadwalHadir ?? guruData.summary.hadirLuarJadwal ?? 0}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      Piket / dinas / non-tatap muka
                    </span>
                  </CardContent>
                </Card>

                <Card className="bg-muted border-border shadow-none">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                    <span className="text-xs font-semibold text-muted-foreground mb-1">
                      Izin / Sakit / Alpa
                    </span>
                    <span className="text-2xl font-bold text-foreground">
                      {(guruData.summary.izin ?? 0) + (guruData.summary.sakit ?? 0) + (guruData.summary.alpa ?? 0)}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      Izin: {guruData.summary.izin ?? 0} • Sakit: {guruData.summary.sakit ?? 0} • Alpa: {guruData.summary.alpa ?? 0}
                    </span>
                  </CardContent>
                </Card>
              </div>

              {/* TABEL 1: GURU YANG MEMILIKI JADWAL MENGAJAR HARI INI */}
              <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
                <div className="p-4 bg-muted/40 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                        Guru Terjadwal Mengajar — Hari {guruData.namaHari}
                        <Badge variant="outline" className="text-primary border-primary/30 text-[11px]">
                          {(guruData.guruTerjadwal || []).length} Guru
                        </Badge>
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Daftar guru yang terjadwal mengajar mata pelajaran formal pada hari ini
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
                      <tr>
                        <th className="px-4 py-3 font-semibold">No</th>
                        <th className="px-4 py-3 font-semibold">Nama Guru</th>
                        <th className="px-4 py-3 font-semibold">Jadwal Mengajar Hari Ini</th>
                        <th className="px-4 py-3 font-semibold text-center">Status</th>
                        <th className="px-4 py-3 font-semibold">Jam Absen</th>
                        <th className="px-4 py-3 font-semibold">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {!guruData.guruTerjadwal || guruData.guruTerjadwal.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground text-xs">
                            Tidak ada jadwal mengajar pada hari {guruData.namaHari}.
                          </td>
                        </tr>
                      ) : (
                        guruData.guruTerjadwal.map((guru: any, idx: number) => (
                          <tr key={guru.id} className="hover:bg-muted/40 transition-colors">
                            <td className="px-4 py-3 text-muted-foreground text-xs">{idx + 1}</td>
                            <td className="px-4 py-3 font-medium text-foreground">
                              {guru.nama}
                              {guru.nip && <div className="text-[11px] text-muted-foreground font-mono">{guru.nip}</div>}
                            </td>
                            <td className="px-4 py-3 text-xs">
                              <div className="flex flex-wrap gap-1.5">
                                {guru.jadwal && guru.jadwal.length > 0 ? (
                                  guru.jadwal.map((j: any, jIdx: number) => (
                                    <span
                                      key={jIdx}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/10 text-primary border border-primary/20"
                                    >
                                      <BookOpen className="w-3 h-3 shrink-0" />
                                      {j.mapel} ({j.kelas}) • {j.jamMulai}-{j.jamSelesai}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {getStatusBadge(guru.status)}
                            </td>
                            <td className="px-4 py-3 text-xs font-mono">
                              {guru.jamMasuk ? (
                                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                                  {new Date(guru.jamMasuk).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                                  {guru.jamPulang && (
                                    <span className="text-muted-foreground font-normal">
                                      {" "}— {new Date(guru.jamPulang).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-xs italic">
                              {guru.keterangan || "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TABEL 2: GURU HADIR DI LUAR JADWAL MENGAJAR */}
              <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
                <div className="p-4 bg-amber-500/5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                        Guru Hadir di Luar Jadwal Mengajar
                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-transparent shadow-none text-[11px]">
                          {(guruData.guruLuarJadwal || []).length} Guru Hadir
                        </Badge>
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Daftar guru yang tidak ada jadwal mengajar pada hari {guruData.namaHari}, namun hadir dan melakukan presensi
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
                      <tr>
                        <th className="px-4 py-3 font-semibold">No</th>
                        <th className="px-4 py-3 font-semibold">Nama Guru</th>
                        <th className="px-4 py-3 font-semibold text-center">Status</th>
                        <th className="px-4 py-3 font-semibold">Jam Absen</th>
                        <th className="px-4 py-3 font-semibold">Metode</th>
                        <th className="px-4 py-3 font-semibold">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {!guruData.guruLuarJadwal || guruData.guruLuarJadwal.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground text-xs">
                            Belum ada guru di luar jadwal mengajar yang melakukan presensi hari ini.
                          </td>
                        </tr>
                      ) : (
                        guruData.guruLuarJadwal.map((guru: any, idx: number) => (
                          <tr key={guru.id} className="hover:bg-muted/40 transition-colors">
                            <td className="px-4 py-3 text-muted-foreground text-xs">{idx + 1}</td>
                            <td className="px-4 py-3 font-medium text-foreground">
                              {guru.nama}
                              {guru.nip && <div className="text-[11px] text-muted-foreground font-mono">{guru.nip}</div>}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {getStatusBadge(guru.status)}
                            </td>
                            <td className="px-4 py-3 text-xs font-mono">
                              {guru.jamMasuk ? (
                                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                                  {new Date(guru.jamMasuk).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                                  {guru.jamPulang && (
                                    <span className="text-muted-foreground font-normal">
                                      {" "}— {new Date(guru.jamPulang).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs">
                              <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold text-[10px]">
                                {guru.metode || "RFID"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-xs italic">
                              {guru.keterangan || "Hadir (di luar jadwal tatap muka)"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SEKSI COLLAPSIBLE: GURU TANPA JADWAL YANG BELUM ABSEN */}
              {guruData.guruLainnya && guruData.guruLainnya.length > 0 && (
                <details className="group bg-card border border-border rounded-xl shadow-xs overflow-hidden">
                  <summary className="p-4 cursor-pointer select-none flex items-center justify-between text-xs font-semibold text-muted-foreground hover:bg-muted/30 transition-colors">
                    <span className="flex items-center gap-2">
                      <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                      Lihat Guru Tidak Ada Jadwal Hari Ini & Belum Absen ({guruData.guruLainnya.length} Guru)
                    </span>
                    <span className="text-[11px] font-normal">Klik untuk melihat</span>
                  </summary>
                  <div className="border-t border-border p-4 bg-muted/10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {guruData.guruLainnya.map((g: any) => (
                        <div key={g.id} className="p-2.5 rounded-lg bg-card border border-border text-xs flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-foreground block">{g.nama}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{g.nip || "Tidak ada NIP"}</span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">
                            Libur / Tidak Ada Jadwal
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
              )}
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="manajemen" className="space-y-5">
          <ManajemenAbsensiTab
            initialConfig={initialConfig}
            initialHariLibur={initialHariLibur}
            jenjangId={jenjangId}
            guruList={guruData?.data || []}
            selectedTanggal={selectedTanggal}
            onRefreshGuru={() => loadGuruData(selectedTanggal)}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
