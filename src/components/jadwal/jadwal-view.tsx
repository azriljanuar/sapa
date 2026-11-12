"use client"

import { useState, useMemo } from "react"
import { 
  Calendar, Clock, BookOpen, GraduationCap, 
  User, CheckCircle2, AlertCircle, Sparkles, CalendarDays
} from "lucide-react"
import { cn } from "@/lib/utils"

export type JadwalItem = {
  id: number
  hari: "SENIN" | "SELASA" | "RABU" | "KAMIS" | "JUMAT" | "SABTU" | "MINGGU"
  jamMulai: string
  jamSelesai: string
  semester?: {
    nama: string
    tahunAjaran?: { nama: string }
  } | null
  pengampu: {
    mataPelajaran: {
      id: number
      nama: string
      kode?: string | null
    }
    guru?: {
      id: number
      nama: string
      nip?: string | null
    } | null
    kelasFormal?: {
      id: number
      namaKelas: string
      jenjang?: {
        singkatan: string
        nama: string
      } | null
    } | null
  }
}

interface JadwalViewProps {
  jadwalList: JadwalItem[]
  mode: "GURU" | "SANTRI"
  title?: string
  subtitle?: string
}

const HARI_ORDER: ("SENIN" | "SELASA" | "RABU" | "KAMIS" | "JUMAT" | "SABTU" | "MINGGU")[] = [
  "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU", "MINGGU"
]

const HARI_LABEL: Record<string, string> = {
  SENIN: "Senin",
  SELASA: "Selasa",
  RABU: "Rabu",
  KAMIS: "Kamis",
  JUMAT: "Jumat",
  SABTU: "Sabtu",
  MINGGU: "Minggu"
}

// Helper untuk dapatkan enum Hari hari ini
function getTodayEnum(): "SENIN" | "SELASA" | "RABU" | "KAMIS" | "JUMAT" | "SABTU" | "MINGGU" {
  const dayIndex = new Date().getDay()
  switch (dayIndex) {
    case 1: return "SENIN"
    case 2: return "SELASA"
    case 3: return "RABU"
    case 4: return "KAMIS"
    case 5: return "JUMAT"
    case 6: return "SABTU"
    default: return "MINGGU"
  }
}

export function JadwalView({ jadwalList, mode, title, subtitle }: JadwalViewProps) {
  const todayEnum = getTodayEnum()
  
  // Default filter: jika ada jadwal hari ini, pilih hari ini; jika tidak, pilih "SEMUA"
  const hasJadwalToday = useMemo(() => {
    return jadwalList.some(item => item.hari === todayEnum)
  }, [jadwalList, todayEnum])

  const [selectedHari, setSelectedHari] = useState<string>(hasJadwalToday ? todayEnum : "SEMUA")

  // Hitung jumlah jadwal per hari
  const countsPerHari = useMemo(() => {
    const counts: Record<string, number> = { SEMUA: jadwalList.length }
    HARI_ORDER.forEach(h => { counts[h] = 0 })
    jadwalList.forEach(item => {
      if (counts[item.hari] !== undefined) {
        counts[item.hari]++
      }
    })
    return counts
  }, [jadwalList])

  // Filter list
  const filteredList = useMemo(() => {
    let list = [...jadwalList]
    if (selectedHari !== "SEMUA") {
      list = list.filter(item => item.hari === selectedHari)
    }
    // Sort berdasarkan hari lalu jam mulai
    return list.sort((a, b) => {
      const dayDiff = HARI_ORDER.indexOf(a.hari) - HARI_ORDER.indexOf(b.hari)
      if (dayDiff !== 0) return dayDiff
      return a.jamMulai.localeCompare(b.jamMulai)
    })
  }, [jadwalList, selectedHari])

  // Kelompokkan per hari jika "SEMUA" dipilih
  const groupedByHari = useMemo(() => {
    const groups: { hari: typeof HARI_ORDER[number]; label: string; items: JadwalItem[] }[] = []
    HARI_ORDER.forEach(h => {
      const items = filteredList.filter(item => item.hari === h)
      if (items.length > 0) {
        groups.push({
          hari: h,
          label: HARI_LABEL[h],
          items
        })
      }
    })
    return groups
  }, [filteredList])

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            {title || (mode === "GURU" ? "Jadwal Pelajaran yang Diampu" : "Jadwal Pelajaran Kelas")}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {subtitle || (mode === "GURU" 
              ? "Jadwal waktu mengajar berdasarkan penugasan pengampu mata pelajaran aktif."
              : "Daftar mata pelajaran harian kelas Anda beserta waktu dan pengajar.")}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 bg-muted/60 border border-border px-3 py-1.5 rounded-lg text-xs font-medium text-foreground self-start sm:self-auto">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span>Total: <strong className="font-semibold text-primary">{jadwalList.length}</strong> Pertemuan/Minggu</span>
        </div>
      </div>

      {/* Tabs Filter Hari */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-border/80">
        <button
          onClick={() => setSelectedHari("SEMUA")}
          className={cn(
            "px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5",
            selectedHari === "SEMUA"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <span>Semua Hari</span>
          <span className={cn(
            "text-[10px] px-1.5 py-0.2 rounded-full",
            selectedHari === "SEMUA" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            {countsPerHari.SEMUA}
          </span>
        </button>

        {HARI_ORDER.map((hari) => {
          const isToday = hari === todayEnum
          const count = countsPerHari[hari]
          const isSelected = selectedHari === hari

          return (
            <button
              key={hari}
              onClick={() => setSelectedHari(hari)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 relative",
                isSelected
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground",
                isToday && !isSelected && "ring-1 ring-primary/40 text-foreground font-semibold"
              )}
            >
              <span>{HARI_LABEL[hari]}</span>
              {isToday && (
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isSelected ? "bg-primary-foreground" : "bg-primary"
                )} title="Hari Ini" />
              )}
              {count > 0 && (
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full",
                  isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Konten Jadwal */}
      {filteredList.length === 0 ? (
        <div className="bg-card rounded-xl p-8 border border-border text-center shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-sm text-foreground">Tidak Ada Jadwal Pelajaran</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {selectedHari !== "SEMUA" 
              ? `Tidak ada jadwal pelajaran yang tercatat pada hari ${HARI_LABEL[selectedHari]}.`
              : "Belum ada jadwal pelajaran yang dikonfigurasi untuk periode akademik ini."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {selectedHari === "SEMUA" ? (
            groupedByHari.map((group) => (
              <div key={group.hari} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md border border-border/60">
                    {group.label}
                  </span>
                  {group.hari === todayEnum && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                      <Sparkles className="w-3 h-3" /> Hari Ini
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    ({group.items.length} sesi)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {group.items.map((item) => (
                    <JadwalCard key={item.id} item={item} mode={mode} isToday={group.hari === todayEnum} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredList.map((item) => (
                <JadwalCard key={item.id} item={item} mode={mode} isToday={item.hari === todayEnum} />
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )
}

function JadwalCard({ item, mode, isToday }: { item: JadwalItem; mode: "GURU" | "SANTRI"; isToday: boolean }) {
  const mapel = item.pengampu.mataPelajaran
  const guru = item.pengampu.guru
  const kelas = item.pengampu.kelasFormal

  return (
    <div className={cn(
      "bg-card rounded-xl p-4 border transition-all shadow-2xs flex flex-col justify-between hover:border-primary/40 hover:shadow-xs",
      isToday ? "border-primary/30 bg-primary/[0.02]" : "border-border"
    )}>
      <div>
        {/* Header Kartu: Jam & Hari */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted text-[11px] font-semibold text-foreground border border-border/60">
            <Clock className="w-3 h-3 text-primary" />
            <span>{item.jamMulai} - {item.jamSelesai}</span>
          </div>

          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">
            {HARI_LABEL[item.hari]}
          </span>
        </div>

        {/* Nama Mata Pelajaran */}
        <div className="mb-3">
          <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">{mapel.nama}</span>
          </h3>
          {mapel.kode && (
            <span className="text-[10px] text-muted-foreground font-mono mt-0.5 block">
              Kode: {mapel.kode}
            </span>
          )}
        </div>
      </div>

      {/* Info Khusus Mode Guru / Santri */}
      <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
        {mode === "GURU" ? (
          // Mode Guru: Tampilkan Kelas & Jenjang
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-foreground truncate block">
                Kelas {kelas?.namaKelas || "-"}
              </span>
              {kelas?.jenjang && (
                <span className="text-[10px] text-muted-foreground truncate block">
                  Jenjang {kelas.jenjang.singkatan}
                </span>
              )}
            </div>
          </div>
        ) : (
          // Mode Santri: Tampilkan Nama Guru Pengajar
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-foreground truncate block">
                {guru?.nama || "Guru Pengajar"}
              </span>
              <span className="text-[10px] text-muted-foreground truncate block">
                {guru?.nip ? `NIP: ${guru.nip}` : "Pengampu Mapel"}
              </span>
            </div>
          </div>
        )}

        {/* Badge Semester jika ada */}
        {item.semester && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground font-medium shrink-0">
            Sem {item.semester.nama}
          </span>
        )}
      </div>
    </div>
  )
}
