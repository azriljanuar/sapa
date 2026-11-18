"use client"

import { useState, useEffect } from "react"
import { Hari, KaldikAgenda } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  Radio,
  Plus,
  CalendarDays,
  Info,
} from "lucide-react"
import { HARI_LABEL_ID, KATEGORI_KALDIK_LABEL } from "@/lib/kaldik-types"

interface KalenderVisualViewProps {
  daftarBulan: {
    bulan: number
    tahun: number
    namaBulan: string
    hk: number
    listAgenda: KaldikAgenda[]
  }[]
  hariLiburRutin: Hari[]
  onSelectDate: (dateStr: string) => void
  onEditAgenda: (agenda: KaldikAgenda) => void
}

const HARI_COLS: { key: Hari; label: string; short: string }[] = [
  { key: "SENIN", label: "Senin", short: "Sen" },
  { key: "SELASA", label: "Selasa", short: "Sel" },
  { key: "RABU", label: "Rabu", short: "Rab" },
  { key: "KAMIS", label: "Kamis", short: "Kam" },
  { key: "JUMAT", label: "Jumat", short: "Jum" },
  { key: "SABTU", label: "Sabtu", short: "Sab" },
  { key: "MINGGU", label: "Ahad", short: "Ahd" },
]

export function KalenderVisualView({
  daftarBulan,
  hariLiburRutin,
  onSelectDate,
  onEditAgenda,
}: KalenderVisualViewProps) {
  // Hitung bulan & tahun saat ini (WIB)
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const nowWib = new Date(utc + 7 * 3600000)
  const currentMonthNum = nowWib.getMonth() + 1
  const currentYearNum = nowWib.getFullYear()

  const findActiveMonthIndex = () => {
    if (!daftarBulan || daftarBulan.length === 0) return 0
    // 1. Coba cari yang bulan dan tahunnya sama persis
    const exact = daftarBulan.findIndex(
      (b) => b.bulan === currentMonthNum && b.tahun === currentYearNum
    )
    if (exact !== -1) return exact

    // 2. Jika tahun berbeda, cari yang bulannya sama
    const byMonth = daftarBulan.findIndex((b) => b.bulan === currentMonthNum)
    if (byMonth !== -1) return byMonth

    return 0
  }

  const [selectedMonthIdx, setSelectedMonthIdx] = useState(findActiveMonthIndex)

  useEffect(() => {
    setSelectedMonthIdx(findActiveMonthIndex())
  }, [daftarBulan])

  if (!daftarBulan || daftarBulan.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Belum ada data bulan untuk semester ini.
      </div>
    )
  }

  const currentMonth = daftarBulan[selectedMonthIdx] || daftarBulan[0]
  const { bulan, tahun, namaBulan, hk, listAgenda } = currentMonth

  // Hitung hari pertama dalam bulan (0 = Ahad, 1 = Senin, ... 6 = Sabtu)
  const firstDayObj = new Date(tahun, bulan - 1, 1)
  const rawFirstDay = firstDayObj.getDay()
  // Normalisasi ke grid Senin = 0 s.d. Ahad = 6
  const startColOffset = rawFirstDay === 0 ? 6 : rawFirstDay - 1

  // Buat array tanggal 1 s.d. hk
  const dateCells: {
    dayNum: number
    dateStr: string
    hari: Hari
    isRutineHoliday: boolean
    agendas: KaldikAgenda[]
  }[] = []

  for (let d = 1; d <= hk; d++) {
    const curDate = new Date(Date.UTC(tahun, bulan - 1, d))
    const localDate = new Date(tahun, bulan - 1, d)
    const rawDay = localDate.getDay()
    const hari: Hari =
      rawDay === 0
        ? "MINGGU"
        : rawDay === 1
        ? "SENIN"
        : rawDay === 2
        ? "SELASA"
        : rawDay === 3
        ? "RABU"
        : rawDay === 4
        ? "KAMIS"
        : rawDay === 5
        ? "JUMAT"
        : "SABTU"

    const dateStr = `${tahun}-${String(bulan).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    const isRutineHoliday = hariLiburRutin.includes(hari)

    const matchingAgendas = listAgenda.filter((a) => {
      const aStart = new Date(a.tanggalMulai)
      const aEnd = new Date(a.tanggalAkhir)
      return curDate >= aStart && curDate <= aEnd
    })

    dateCells.push({
      dayNum: d,
      dateStr,
      hari,
      isRutineHoliday,
      agendas: matchingAgendas,
    })
  }

  const todayStr = `${currentYearNum}-${String(currentMonthNum).padStart(2, "0")}-${String(nowWib.getDate()).padStart(2, "0")}`

  return (
    <div className="space-y-4">
      {/* Header Pengendali Bulan */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={selectedMonthIdx === 0}
            onClick={() => setSelectedMonthIdx((prev) => Math.max(0, prev - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-base font-bold text-foreground px-2 min-w-[150px] text-center">
            {namaBulan}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={selectedMonthIdx === daftarBulan.length - 1}
            onClick={() => setSelectedMonthIdx((prev) => Math.min(daftarBulan.length - 1, prev + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Tab Pilihan Cepat Bulan dalam Semester */}
        <div className="flex flex-wrap items-center gap-1">
          {daftarBulan.map((b, idx) => {
            const isCurrentRunningMonth = b.bulan === currentMonthNum && b.tahun === currentYearNum
            return (
              <button
                key={`${b.tahun}-${b.bulan}`}
                onClick={() => setSelectedMonthIdx(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedMonthIdx === idx
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : isCurrentRunningMonth
                    ? "bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 font-semibold"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{b.namaBulan.split(" ")[0]}</span>
                {isCurrentRunningMonth && (
                  <span className="ml-1 text-[9px] font-bold uppercase opacity-90">(Bulan Ini)</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid Kalender 7 Kolom */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
        {/* Header Hari */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs font-semibold">
          {HARI_COLS.map((h) => {
            const isLibur = hariLiburRutin.includes(h.key)
            return (
              <div
                key={h.key}
                className={`py-2.5 px-1 border-r last:border-r-0 border-border ${
                  isLibur ? "text-destructive font-bold bg-destructive/5" : "text-foreground"
                }`}
              >
                <span className="hidden sm:inline">{h.label}</span>
                <span className="sm:hidden">{h.short}</span>
              </div>
            )
          })}
        </div>

        {/* Kotak-Kotak Tanggal */}
        <div className="grid grid-cols-7 auto-rows-fr">
          {/* Offset awal bulan */}
          {Array.from({ length: startColOffset }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="min-h-[95px] sm:min-h-[110px] p-1.5 border-b border-r border-border bg-muted/15"
            />
          ))}

          {/* Tanggal Aktif */}
          {dateCells.map((item) => {
            const isToday = item.dateStr === todayStr
            const hasHolidayAgenda = item.agendas.some((a) =>
              ["LIBUR_NASIONAL", "LIBUR_SEMESTER", "LIBUR_RAMADHAN", "LIBUR_KHUSUS"].includes(a.kategori)
            )
            const isDayRed = item.isRutineHoliday || hasHolidayAgenda

            return (
              <div
                key={item.dateStr}
                onClick={() => onSelectDate(item.dateStr)}
                className={`min-h-[95px] sm:min-h-[110px] p-1.5 border-b border-r border-border group relative transition-colors cursor-pointer hover:bg-primary/5 ${
                  item.isRutineHoliday ? "bg-destructive/[0.02]" : "bg-card"
                } ${isToday ? "ring-2 ring-primary ring-inset bg-primary/[0.04]" : ""}`}
              >
                {/* Baris Tanggal & Tombol Tambah */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                      isToday
                        ? "bg-primary text-primary-foreground shadow-xs font-bold ring-2 ring-primary/30"
                        : isDayRed
                        ? "text-destructive font-bold"
                        : "text-foreground"
                    }`}
                  >
                    {item.dayNum}
                  </span>

                  {isToday && (
                    <span className="text-[9px] font-bold text-primary uppercase tracking-tight">Hari Ini</span>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectDate(item.dateStr)
                    }}
                    title="Tambah agenda di tanggal ini"
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-primary hover:bg-muted rounded transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Badge Agenda di Tanggal Tersebut */}
                <div className="space-y-1">
                  {item.agendas.map((agenda) => {
                    const meta = KATEGORI_KALDIK_LABEL[agenda.kategori]
                    const color = agenda.warnaHex || meta?.defaultWarna || "#3b82f6"

                    return (
                      <div
                        key={agenda.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditAgenda(agenda)
                        }}
                        style={{ borderLeftColor: color }}
                        className="text-[10px] sm:text-[11px] leading-tight px-1.5 py-0.5 rounded bg-muted/80 hover:bg-muted border-l-2 font-medium truncate flex items-center justify-between gap-1 shadow-2xs transition-all"
                        title={`${agenda.nama} (${meta?.label || ""})`}
                      >
                        <span className="truncate">
                          {agenda.kodeSingkatan ? `[${agenda.kodeSingkatan}] ` : ""}
                          {agenda.nama}
                        </span>
                        {agenda.allowAbsensiRfid && (
                          <span title="Presensi RFID Aktif" className="inline-flex shrink-0">
                            <Radio className="w-2.5 h-2.5 text-primary" />
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Petunjuk / Legend Warna Standar Kemenag */}
      <div className="p-3.5 bg-card rounded-xl border border-border">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-primary" />
          <span>Panduan Klasifikasi Warna Agenda Kemenag</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-600 shrink-0" />
            <span className="text-foreground">Hari Efektif Belajar (HEB)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-700 shrink-0" />
            <span className="text-foreground">Efektif Fakultatif (HEF)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-600 shrink-0" />
            <span className="text-foreground">Asesmen / Ujian Madrasah</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-600 shrink-0" />
            <span className="text-foreground">Matsama & Kegiatan Khusus</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600 shrink-0" />
            <span className="text-foreground">Libur Nasional & Keagamaan</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-600 shrink-0" />
            <span className="text-foreground">Libur Akhir Semester</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-600 shrink-0" />
            <span className="text-foreground">Libur Ramadhan & Idulfitri</span>
          </div>
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-foreground">Presensi RFID Diizinkan</span>
          </div>
        </div>
      </div>
    </div>
  )
}
