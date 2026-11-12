"use client"

import { useState } from "react"
import { Hari } from "@prisma/client"
import { 
  Calendar, Search, Filter, Clock, BookOpen, Users, 
  Printer, CheckCircle2, AlertCircle, Building 
} from "lucide-react"

import { cn } from "@/lib/utils"
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

const DAYS: { key: Hari; label: string }[] = [
  { key: "SENIN", label: "Senin" },
  { key: "SELASA", label: "Selasa" },
  { key: "RABU", label: "Rabu" },
  { key: "KAMIS", label: "Kamis" },
  { key: "JUMAT", label: "Jumat" },
  { key: "SABTU", label: "Sabtu" },
  { key: "MINGGU", label: "Minggu" },
]

type JadwalItemType = {
  id: number
  hari: Hari
  jamMulai: string
  jamSelesai: string
  pengampu: {
    guru: { id: number; nama: string; nip: string | null }
    mataPelajaran: { id: number; nama: string; kode: string | null }
    kelasFormal: { id: number; namaKelas: string }
  }
}

type KelasOption = {
  id: number
  namaKelas: string
}

export function GuruPiketJadwalClient({
  initialJadwal,
  kelasList,
  hariPiketGuru,
  activeTaName,
  activeSemesterName,
}: {
  initialJadwal: JadwalItemType[]
  kelasList: KelasOption[]
  hariPiketGuru: Hari[]
  activeTaName: string
  activeSemesterName: string
}) {
  // Hitung hari saat ini (WIB)
  const getTodayHari = (): Hari => {
    const now = new Date()
    const utc = now.getTime() + now.getTimezoneOffset() * 60000
    const nowWib = new Date(utc + 7 * 3600000)
    const dayIdx = nowWib.getDay()
    const mapDay: Hari[] = ["MINGGU", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"]
    return mapDay[dayIdx]
  }

  const todayHari = getTodayHari()
  const [selectedHari, setSelectedHari] = useState<Hari>(todayHari)
  const [selectedKelas, setSelectedKelas] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  // Filter jadwal
  const filteredJadwal = initialJadwal.filter((j) => {
    const matchHari = j.hari === selectedHari
    const matchKelas =
      selectedKelas === "ALL" || String(j.pengampu.kelasFormal.id) === selectedKelas
    const query = searchQuery.toLowerCase()
    const matchSearch =
      j.pengampu.mataPelajaran.nama.toLowerCase().includes(query) ||
      (j.pengampu.mataPelajaran.kode && j.pengampu.mataPelajaran.kode.toLowerCase().includes(query)) ||
      j.pengampu.guru.nama.toLowerCase().includes(query) ||
      j.pengampu.kelasFormal.namaKelas.toLowerCase().includes(query)

    return matchHari && matchKelas && matchSearch
  })

  // Urutkan berdasarkan jam mulai
  const sortedJadwal = [...filteredJadwal].sort((a, b) =>
    a.jamMulai.localeCompare(b.jamMulai)
  )

  const isCurrentTimeSlot = (jamMulai: string, jamSelesai: string, hari: Hari) => {
    if (hari !== todayHari) return false
    const now = new Date()
    const utc = now.getTime() + now.getTimezoneOffset() * 60000
    const nowWib = new Date(utc + 7 * 3600000)
    const currentHourMin = `${String(nowWib.getHours()).padStart(2, "0")}:${String(
      nowWib.getMinutes()
    ).padStart(2, "0")}`
    return currentHourMin >= jamMulai && currentHourMin <= jamSelesai
  }

  const isTodayPiket = hariPiketGuru.includes(todayHari)

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Jadwal Pelajaran (Piket)
            </h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              {activeTaName} - {activeSemesterName}
            </Badge>
            {isTodayPiket && (
              <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">
                Jadwal Piket Anda Hari Ini
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Pantau seluruh jadwal pelajaran aktif di sekolah untuk memonitor keterisian guru di setiap kelas.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => window.print()}
          className="gap-2 print:hidden shrink-0"
        >
          <Printer className="w-4 h-4" />
          Cetak Jadwal Hari Ini
        </Button>
      </div>

      {/* Tabs Pemilihan Hari */}
      <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-thin print:hidden">
        {DAYS.map((d) => {
          const isSelected = selectedHari === d.key
          const isToday = todayHari === d.key
          const isGuruPiketDay = hariPiketGuru.includes(d.key)

          return (
            <button
              key={d.key}
              onClick={() => setSelectedHari(d.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shrink-0 border",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                  : "bg-card text-foreground/80 border-border hover:bg-muted"
              )}
            >
              <span>{d.label}</span>
              {isToday && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                    isSelected
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  Hari Ini
                </span>
              )}
              {isGuruPiketDay && !isToday && (
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    isSelected ? "bg-white" : "bg-emerald-500"
                  )}
                  title="Jadwal Piket Anda"
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-4 rounded-xl border border-border shadow-xs print:hidden">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari mapel, guru, kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            Filter Kelas:
          </span>
          <Select value={selectedKelas} onValueChange={(val) => setSelectedKelas(val || "ALL")}>
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

      {/* Grid Jadwal Pelajaran */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span>Daftar Pelajaran Hari {DAYS.find((d) => d.key === selectedHari)?.label}</span>
            <span className="text-xs font-normal text-muted-foreground">
              ({sortedJadwal.length} sesi pertemuan)
            </span>
          </div>
        </div>

        {sortedJadwal.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground shadow-xs">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <h3 className="font-semibold text-foreground text-base">Tidak Ada Jadwal Pelajaran</h3>
            <p className="text-sm text-muted-foreground/80 mt-1 max-w-sm mx-auto">
              Tidak ditemukan jadwal pelajaran aktif pada hari ini sesuai filter yang dipilih.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedJadwal.map((item) => {
              const isOngoing = isCurrentTimeSlot(item.jamMulai, item.jamSelesai, item.hari)
              return (
                <div
                  key={item.id}
                  className={cn(
                    "bg-card rounded-xl border p-4 shadow-xs transition-all relative overflow-hidden flex flex-col justify-between",
                    isOngoing
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20"
                      : "border-border hover:border-primary/40 hover:shadow-sm"
                  )}
                >
                  {isOngoing && (
                    <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-bl-lg flex items-center gap-1 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      Sedang Berlangsung
                    </div>
                  )}

                  <div className="space-y-3">
                    {/* Waktu & Kelas */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {item.jamMulai} - {item.jamSelesai}
                        </span>
                      </div>
                      <Badge variant="secondary" className="font-medium text-xs">
                        {item.pengampu.kelasFormal.namaKelas}
                      </Badge>
                    </div>

                    {/* Mata Pelajaran */}
                    <div>
                      <h4 className="font-bold text-base text-foreground leading-snug">
                        {item.pengampu.mataPelajaran.nama}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Kode: {item.pengampu.mataPelajaran.kode || "-"}
                      </p>
                    </div>
                  </div>

                  {/* Guru Pengampu */}
                  <div className="pt-4 mt-3 border-t border-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground text-[10px]">
                        {item.pengampu.guru.nama.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {item.pengampu.guru.nama}
                        </div>
                        {item.pengampu.guru.nip && (
                          <div className="text-[10px] text-muted-foreground">
                            NIP: {item.pengampu.guru.nip}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
