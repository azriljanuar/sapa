"use client"

import { useState, useTransition } from "react"
import {
  Save, Loader2, CheckCircle2, AlertCircle, TrendingUp,
  Edit3, Download, BarChart2, Sparkles, SlidersHorizontal, Info, Eye, EyeOff
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  simpanBatchNilaiSumatif,
  simpanBatchNilaiPAS,
  toggleRilisNilaiMapel
} from "./actions"

// ─── Types ────────────────────────────────────────────────────────────────────
type AbsensiItem = { santriId: number; status: string }
type Jurnal = { id: number; sumatifKe?: number | null; absensiMapel: AbsensiItem[] }
type NilaiSumatif = {
  santriId: number
  sumatifKe: number
  nilaiKurikuler?: number | null
  nilaiTesSumatif?: number | null
  nilaiKehadiran?: number | null
  hadir?: number | null
  sakit?: number | null
  izin?: number | null
  alfa?: number | null
}
type NilaiPAS = { santriId: number; nilai?: number | null }
type Pengampu = {
  id: number; kkm?: number | null
  mataPelajaran: { nama: string }
  kelasFormal: { namaKelas: string }
  nilaiSumatif: NilaiSumatif[]
  nilaiPAS: NilaiPAS[]
  jurnalMengajar: Jurnal[]
  nilaiDirilis?: boolean | null
  tanggalRilis?: Date | string | null
}
type Santri = { id: number; namaLengkap: string; nisn: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hitungNilaiKehadiranDariJurnal(jurnal: Jurnal[], santriId: number, sumatifKe: number): {
  hadir: number; sakit: number; izin: number; alpa: number; total: number; nilai: number | null
} {
  const j = jurnal.filter(x => x.sumatifKe === sumatifKe)
  if (j.length === 0) return { hadir: 0, sakit: 0, izin: 0, alpa: 0, total: 0, nilai: null }
  let hadir = 0, sakit = 0, izin = 0, alpa = 0
  for (const entry of j) {
    const absensi = entry.absensiMapel.find(a => a.santriId === santriId)
    if (!absensi) { alpa++; continue }
    if (absensi.status === "HADIR") hadir++
    else if (absensi.status === "SAKIT") sakit++
    else if (absensi.status === "IZIN") izin++
    else alpa++
  }
  const total = hadir + sakit + izin + alpa
  if (total === 0) return { hadir: 0, sakit: 0, izin: 0, alpa: 0, total: 0, nilai: null }
  const nilai = ((hadir * 100) + (sakit * 80) + (izin * 70)) / total
  return { hadir, sakit, izin, alpa, total, nilai }
}

/**
 * Konversi kehadiran otomatis sesuai ketentuan setiap sumatif:
 * Hadir = bobot 100, Sakit = 80, Izin = 70, Alfa = 0.
 * Standar total pertemuan per sumatif = minimal 5 pertemuan (atau total H+S+I+A riil).
 */
function hitungKonversiKehadiran(h: number | null, s: number | null, i: number | null, a: number | null): number | null {
  if (h === null && s === null && i === null && a === null) return null
  const hVal = h ?? 0
  const sVal = s ?? 0
  const iVal = i ?? 0
  const aVal = a ?? 0
  const total = hVal + sVal + iVal + aVal
  if (total === 0) return null
  const pembagi = Math.max(total, 5)
  const score = ((hVal * 100) + (sVal * 80) + (iVal * 70) + (aVal * 0)) / pembagi
  return Math.min(100, Math.max(0, score))
}

function hitungRataSumatif(kh: number | null, ku: number | null, tes: number | null): number | null {
  if (kh === null && ku === null && tes === null) return null
  return ((kh ?? 0) * 0.6) + ((ku ?? 0) * 0.2) + ((tes ?? 0) * 0.2)
}

function getRataAllSumatif(pengampu: Pengampu, santriId: number): number | null {
  const vals = [1, 2, 3].map(s => {
    const ns = pengampu.nilaiSumatif.find(n => n.santriId === santriId && n.sumatifKe === s)
    const kh = ns?.nilaiKehadiran ?? hitungNilaiKehadiranDariJurnal(pengampu.jurnalMengajar, santriId, s).nilai
    return hitungRataSumatif(kh, ns?.nilaiKurikuler ?? null, ns?.nilaiTesSumatif ?? null)
  })
  const valid = vals.filter(v => v !== null) as number[]
  if (valid.length === 0) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

function getNilaiAkhir(rata: number | null, pas: number | null): number | null {
  if (rata === null && pas === null) return null
  return ((rata ?? 0) * 0.6) + ((pas ?? 0) * 0.4)
}

const fmt = (v: number | null) => v !== null ? v.toFixed(1) : "–"
const parseNilai = (s: string | undefined): number | null => {
  if (s === undefined || s.trim() === "") return null
  const n = parseFloat(s)
  return isNaN(n) ? null : Math.min(100, Math.max(0, n))
}
const parseIntVal = (s: string | undefined): number | null => {
  if (s === undefined || s.trim() === "") return null
  const n = parseInt(s)
  return isNaN(n) ? null : Math.max(0, n)
}

// ─── Tab: Input Sumatif ───────────────────────────────────────────────────────
function TabInputSumatif({
  pengampu, santriList, semesterId
}: { pengampu: Pengampu; santriList: Santri[]; semesterId: number | null }) {
  const [sumatifKe, setSumatifKe] = useState(1)
  const [modeKehadiran, setModeKehadiran] = useState<"rincian" | "langsung">("rincian")

  // State nilai manual
  const [localKu, setLocalKu] = useState<Record<number, string>>({})
  const [localTes, setLocalTes] = useState<Record<number, string>>({})

  // State kehadiran per santri
  const [localHadir, setLocalHadir] = useState<Record<number, string>>({})
  const [localSakit, setLocalSakit] = useState<Record<number, string>>({})
  const [localIzin, setLocalIzin] = useState<Record<number, string>>({})
  const [localAlfa, setLocalAlfa] = useState<Record<number, string>>({})
  const [localDirectKh, setLocalDirectKh] = useState<Record<number, string>>({})

  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const resetAllLocal = () => {
    setLocalKu({})
    setLocalTes({})
    setLocalHadir({})
    setLocalSakit({})
    setLocalIzin({})
    setLocalAlfa({})
    setLocalDirectKh({})
  }

  const getExistingNS = (santriId: number) => {
    return pengampu.nilaiSumatif.find(n => n.santriId === santriId && n.sumatifKe === sumatifKe)
  }

  const getKu = (santriId: number) => {
    if (localKu[santriId] !== undefined) return localKu[santriId]
    return getExistingNS(santriId)?.nilaiKurikuler?.toString() ?? ""
  }

  const getTes = (santriId: number) => {
    if (localTes[santriId] !== undefined) return localTes[santriId]
    return getExistingNS(santriId)?.nilaiTesSumatif?.toString() ?? ""
  }

  const getH = (santriId: number) => {
    if (localHadir[santriId] !== undefined) return localHadir[santriId]
    const existing = getExistingNS(santriId)
    if (existing?.hadir !== undefined && existing?.hadir !== null) return existing.hadir.toString()
    // Fallback dari jurnal mengajar jika ada
    const jData = hitungNilaiKehadiranDariJurnal(pengampu.jurnalMengajar, santriId, sumatifKe)
    if (jData.total > 0) return jData.hadir.toString()
    return ""
  }

  const getS = (santriId: number) => {
    if (localSakit[santriId] !== undefined) return localSakit[santriId]
    const existing = getExistingNS(santriId)
    if (existing?.sakit !== undefined && existing?.sakit !== null) return existing.sakit.toString()
    const jData = hitungNilaiKehadiranDariJurnal(pengampu.jurnalMengajar, santriId, sumatifKe)
    if (jData.total > 0) return jData.sakit.toString()
    return ""
  }

  const getI = (santriId: number) => {
    if (localIzin[santriId] !== undefined) return localIzin[santriId]
    const existing = getExistingNS(santriId)
    if (existing?.izin !== undefined && existing?.izin !== null) return existing.izin.toString()
    const jData = hitungNilaiKehadiranDariJurnal(pengampu.jurnalMengajar, santriId, sumatifKe)
    if (jData.total > 0) return jData.izin.toString()
    return ""
  }

  const getA = (santriId: number) => {
    if (localAlfa[santriId] !== undefined) return localAlfa[santriId]
    const existing = getExistingNS(santriId)
    if (existing?.alfa !== undefined && existing?.alfa !== null) return existing.alfa.toString()
    const jData = hitungNilaiKehadiranDariJurnal(pengampu.jurnalMengajar, santriId, sumatifKe)
    if (jData.total > 0) return jData.alpa.toString()
    return ""
  }

  const getDirectKh = (santriId: number) => {
    if (localDirectKh[santriId] !== undefined) return localDirectKh[santriId]
    const existing = getExistingNS(santriId)
    if (existing?.nilaiKehadiran !== undefined && existing?.nilaiKehadiran !== null) {
      return existing.nilaiKehadiran.toString()
    }
    const jData = hitungNilaiKehadiranDariJurnal(pengampu.jurnalMengajar, santriId, sumatifKe)
    if (jData.nilai !== null) return jData.nilai.toFixed(1)
    return ""
  }

  // Hitung nilai kehadiran akhir untuk baris santri
  const getCalculatedKh = (santriId: number): number | null => {
    if (modeKehadiran === "langsung") {
      return parseNilai(getDirectKh(santriId))
    }
    // Mode rincian (otomatis konversi)
    const h = parseIntVal(getH(santriId))
    const s = parseIntVal(getS(santriId))
    const i = parseIntVal(getI(santriId))
    const a = parseIntVal(getA(santriId))
    
    // Jika semua kosong, cek apakah sudah pernah tersimpan nilaiKehadiran langsung
    if (h === null && s === null && i === null && a === null) {
      const existing = getExistingNS(santriId)
      if (existing?.nilaiKehadiran !== undefined && existing?.nilaiKehadiran !== null) {
        return existing.nilaiKehadiran
      }
      return null
    }

    return hitungKonversiKehadiran(h, s, i, a)
  }

  // Quick Action: Isi semua santri dengan hadir penuh (5 pertemuan = nilai 100)
  const handleIsiSemuaHadirPenuh = () => {
    const nextH: Record<number, string> = {}
    const nextS: Record<number, string> = {}
    const nextI: Record<number, string> = {}
    const nextA: Record<number, string> = {}
    const nextDirect: Record<number, string> = {}

    for (const s of santriList) {
      nextH[s.id] = "5"
      nextS[s.id] = "0"
      nextI[s.id] = "0"
      nextA[s.id] = "0"
      nextDirect[s.id] = "100"
    }

    setLocalHadir(prev => ({ ...prev, ...nextH }))
    setLocalSakit(prev => ({ ...prev, ...nextS }))
    setLocalIzin(prev => ({ ...prev, ...nextI }))
    setLocalAlfa(prev => ({ ...prev, ...nextA }))
    setLocalDirectKh(prev => ({ ...prev, ...nextDirect }))
  }

  const handleSimpan = () => {
    if (!semesterId) {
      setStatus("error")
      setErrorMsg("Semester tidak ditemukan. Hubungi admin.")
      return
    }
    startTransition(async () => {
      const items = santriList.map(s => {
        const finalKh = getCalculatedKh(s.id)
        const hVal = parseIntVal(getH(s.id))
        const sVal = parseIntVal(getS(s.id))
        const iVal = parseIntVal(getI(s.id))
        const aVal = parseIntVal(getA(s.id))

        return {
          santriId: s.id,
          nilaiKurikuler: parseNilai(getKu(s.id)),
          nilaiTesSumatif: parseNilai(getTes(s.id)),
          nilaiKehadiran: finalKh,
          hadir: hVal,
          sakit: sVal,
          izin: iVal,
          alfa: aVal,
        }
      })

      const res = await simpanBatchNilaiSumatif({
        pengampuId: pengampu.id,
        semesterId,
        sumatifKe,
        items,
      })

      if (res.success) {
        setStatus("saved")
        resetAllLocal()
        setTimeout(() => setStatus("idle"), 2500)
      } else {
        setStatus("error")
        setErrorMsg(res.error || "Gagal menyimpan")
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Selector Sumatif & Mode Kehadiran */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
        {/* Pilih Sumatif Ke- */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sumatif:</span>
          {[1, 2, 3].map(k => (
            <button key={k} onClick={() => { setSumatifKe(k); resetAllLocal() }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition border ${sumatifKe === k ? "bg-primary text-primary-foreground border-primary shadow-xs" : "bg-card text-muted-foreground border-border hover:border-primary/50"}`}>
              Sumatif {k}
            </button>
          ))}
        </div>

        {/* Mode Input Kehadiran & Preset */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-muted p-0.5 rounded-lg border border-border flex items-center text-[11px] font-medium">
            <button
              onClick={() => setModeKehadiran("rincian")}
              className={`px-2.5 py-1 rounded-md transition ${modeKehadiran === "rincian" ? "bg-background text-foreground font-semibold shadow-2xs" : "text-muted-foreground hover:text-foreground"}`}
              title="Input jumlah Hadir, Sakit, Izin, Alfa lalu otomatis dikonversi"
            >
              Rincian H/S/I/A
            </button>
            <button
              onClick={() => setModeKehadiran("langsung")}
              className={`px-2.5 py-1 rounded-md transition ${modeKehadiran === "langsung" ? "bg-background text-foreground font-semibold shadow-2xs" : "text-muted-foreground hover:text-foreground"}`}
              title="Input nilai kehadiran angka 0-100 langsung"
            >
              Nilai Langsung
            </button>
          </div>

          <button
            onClick={handleIsiSemuaHadirPenuh}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 text-[11px] font-semibold hover:bg-emerald-500/20 transition"
            title="Isi semua santri dengan hadir 5 pertemuan (nilai 100)"
          >
            <Sparkles className="h-3 w-3" /> Hadir Penuh (100)
          </button>
        </div>
      </div>

      {/* Info Ketentuan Konversi Kehadiran */}
      <div className="flex items-center gap-2 px-3.5 py-2 bg-muted/60 border border-border rounded-xl text-xs text-muted-foreground">
        <Info className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1 text-[11px]">
          <strong className="text-foreground font-medium">Ketentuan Konversi Kehadiran:</strong>{" "}
          Bobot nilai Hadir = 100, Sakit = 80, Izin = 70, Alfa = 0. Standar 5 pertemuan per sumatif.
          <span className="hidden sm:inline"> Nilai otomatis dihitung on-the-fly.</span>
        </div>
      </div>

      {/* Status Banner */}
      {status === "saved" && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-xl text-primary text-sm font-medium">
          <CheckCircle2 className="h-4 w-4" /> Nilai Sumatif {sumatifKe} (termasuk konversi kehadiran) berhasil disimpan!
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm font-medium">
          <AlertCircle className="h-4 w-4" /> {errorMsg}
        </div>
      )}

      {/* Tabel Input */}
      <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/50 border-b border-border flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">
            Form Nilai Sumatif {sumatifKe} · {santriList.length} Santri
          </span>
          <button
            onClick={handleSimpan}
            disabled={isPending || !semesterId}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-2xs"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Simpan Semua Nilai
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/30 border-b border-border text-center">
                <th className="text-left px-3 py-2.5 text-muted-foreground font-semibold w-8">No</th>
                <th className="text-left px-3 py-2.5 text-muted-foreground font-semibold min-w-[150px]">Nama Santri</th>
                
                {/* Kolom Kehadiran */}
                {modeKehadiran === "rincian" ? (
                  <th className="px-2 py-2.5 text-muted-foreground font-semibold min-w-[240px]">
                    <div className="flex items-center justify-center gap-1 text-[11px]">
                      <span>Kehadiran (H / S / I / A)</span>
                      <span className="text-[10px] text-primary font-normal">→ Konversi</span>
                    </div>
                  </th>
                ) : (
                  <th className="px-2.5 py-2.5 text-muted-foreground font-semibold w-28">Nilai Kehadiran</th>
                )}

                <th className="px-2.5 py-2.5 text-muted-foreground font-semibold w-24">Kurikuler</th>
                <th className="px-2.5 py-2.5 text-muted-foreground font-semibold w-24">Tes Sumatif</th>
                <th className="px-2.5 py-2.5 text-muted-foreground font-semibold w-24 bg-amber-500/10 text-amber-800">Rata-rata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {santriList.map((s, i) => {
                const khScore = getCalculatedKh(s.id)
                const ku = parseNilai(getKu(s.id))
                const tes = parseNilai(getTes(s.id))
                const rata = hitungRataSumatif(khScore, ku, tes)

                return (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2 font-medium text-foreground">
                      <div className="truncate max-w-[200px]">{s.namaLengkap}</div>
                      {s.nisn && <div className="text-[10px] text-muted-foreground">{s.nisn}</div>}
                    </td>

                    {/* Cell Kehadiran */}
                    {modeKehadiran === "rincian" ? (
                      <td className="px-2 py-2">
                        <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                          {/* Hadir */}
                          <div className="flex items-center gap-0.5" title="Hadir (bobot 100)">
                            <span className="text-[10px] font-bold text-emerald-600">H:</span>
                            <input
                              type="number" min={0} max={15}
                              placeholder="5"
                              value={getH(s.id)}
                              onChange={e => setLocalHadir(prev => ({ ...prev, [s.id]: e.target.value }))}
                              className="w-10 border border-input bg-background text-foreground rounded px-1 py-1 text-center text-xs font-semibold focus:ring-1 focus:ring-ring outline-none"
                            />
                          </div>

                          {/* Sakit */}
                          <div className="flex items-center gap-0.5" title="Sakit (bobot 80)">
                            <span className="text-[10px] font-bold text-amber-600">S:</span>
                            <input
                              type="number" min={0} max={15}
                              placeholder="0"
                              value={getS(s.id)}
                              onChange={e => setLocalSakit(prev => ({ ...prev, [s.id]: e.target.value }))}
                              className="w-9 border border-input bg-background text-foreground rounded px-1 py-1 text-center text-xs font-semibold focus:ring-1 focus:ring-ring outline-none"
                            />
                          </div>

                          {/* Izin */}
                          <div className="flex items-center gap-0.5" title="Izin (bobot 70)">
                            <span className="text-[10px] font-bold text-blue-600">I:</span>
                            <input
                              type="number" min={0} max={15}
                              placeholder="0"
                              value={getI(s.id)}
                              onChange={e => setLocalIzin(prev => ({ ...prev, [s.id]: e.target.value }))}
                              className="w-9 border border-input bg-background text-foreground rounded px-1 py-1 text-center text-xs font-semibold focus:ring-1 focus:ring-ring outline-none"
                            />
                          </div>

                          {/* Alfa */}
                          <div className="flex items-center gap-0.5" title="Alfa (bobot 0)">
                            <span className="text-[10px] font-bold text-rose-600">A:</span>
                            <input
                              type="number" min={0} max={15}
                              placeholder="0"
                              value={getA(s.id)}
                              onChange={e => setLocalAlfa(prev => ({ ...prev, [s.id]: e.target.value }))}
                              className="w-9 border border-input bg-background text-foreground rounded px-1 py-1 text-center text-xs font-semibold focus:ring-1 focus:ring-ring outline-none"
                            />
                          </div>

                          {/* Hasil Konversi */}
                          <div className="ml-1 px-1.5 py-0.5 rounded text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 min-w-10 text-center" title="Hasil konversi nilai kehadiran">
                            {fmt(khScore)}
                          </div>
                        </div>
                      </td>
                    ) : (
                      <td className="px-2.5 py-2 text-center">
                        <input
                          type="number" min={0} max={100} step={0.1}
                          placeholder="0-100"
                          value={getDirectKh(s.id)}
                          onChange={e => setLocalDirectKh(prev => ({ ...prev, [s.id]: e.target.value }))}
                          className="w-20 border border-input bg-background text-foreground rounded-lg px-2 py-1 text-center text-xs font-semibold focus:ring-1 focus:ring-ring outline-none"
                        />
                      </td>
                    )}

                    {/* Kurikuler */}
                    <td className="px-2.5 py-2 text-center">
                      <input
                        type="number" min={0} max={100} step={0.1}
                        placeholder="0-100"
                        value={getKu(s.id)}
                        onChange={e => setLocalKu(prev => ({ ...prev, [s.id]: e.target.value }))}
                        className="w-20 border border-input bg-background text-foreground rounded-lg px-2 py-1 text-center text-xs font-semibold focus:ring-1 focus:ring-ring outline-none"
                      />
                    </td>

                    {/* Tes Sumatif */}
                    <td className="px-2.5 py-2 text-center">
                      <input
                        type="number" min={0} max={100} step={0.1}
                        placeholder="0-100"
                        value={getTes(s.id)}
                        onChange={e => setLocalTes(prev => ({ ...prev, [s.id]: e.target.value }))}
                        className="w-20 border border-input bg-background text-foreground rounded-lg px-2 py-1 text-center text-xs font-semibold focus:ring-1 focus:ring-ring outline-none"
                      />
                    </td>

                    {/* Rata-rata Sumatif */}
                    <td className="px-2.5 py-2 text-center font-bold bg-amber-500/10 text-amber-900">
                      {fmt(rata)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-2.5 bg-muted/30 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-muted-foreground gap-2">
          <span>Formula Nilai Sumatif = (Kehadiran × 60%) + (Kurikuler × 20%) + (Tes Sumatif × 20%)</span>
          <span>Ketentuan Hadir: H(100), S(80), I(70), A(0)</span>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Input PAS ───────────────────────────────────────────────────────────
function TabInputPAS({
  pengampu, santriList, semesterId
}: { pengampu: Pengampu; santriList: Santri[]; semesterId: number | null }) {
  const [localPAS, setLocalPAS] = useState<Record<number, string>>({})
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const kkm = pengampu.kkm ?? 70

  const getPAS = (santriId: number) => {
    if (localPAS[santriId] !== undefined) return localPAS[santriId]
    const np = pengampu.nilaiPAS.find(n => n.santriId === santriId)
    return np?.nilai?.toString() ?? ""
  }

  const handleSimpan = () => {
    if (!semesterId) {
      setStatus("error")
      setErrorMsg("Semester tidak ditemukan. Hubungi admin.")
      return
    }
    startTransition(async () => {
      const items = santriList.map(s => ({
        santriId: s.id,
        nilai: parseNilai(getPAS(s.id)),
      }))
      const res = await simpanBatchNilaiPAS({
        pengampuId: pengampu.id,
        semesterId,
        items,
      })
      if (res.success) {
        setStatus("saved")
        setLocalPAS({})
        setTimeout(() => setStatus("idle"), 2500)
      } else {
        setStatus("error")
        setErrorMsg(res.error || "Gagal menyimpan")
      }
    })
  }

  return (
    <div className="space-y-4">
      {status === "saved" && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-xl text-primary text-sm font-medium">
          <CheckCircle2 className="h-4 w-4" /> Nilai PAS berhasil disimpan
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm font-medium">
          <AlertCircle className="h-4 w-4" /> {errorMsg}
        </div>
      )}

      <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/50 border-b border-border flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">
            Nilai PAS · {santriList.length} Santri · KKM {kkm}
          </span>
          <button
            onClick={handleSimpan}
            disabled={isPending || !semesterId}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Simpan Semua
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/30 border-b border-border text-center">
                <th className="text-left px-3.5 py-2.5 text-muted-foreground font-semibold w-8">No</th>
                <th className="text-left px-3.5 py-2.5 text-muted-foreground font-semibold">Nama Santri</th>
                <th className="px-2.5 py-2.5 text-muted-foreground font-semibold w-32 bg-amber-500/10 text-amber-800">Nilai PAS</th>
                <th className="px-2.5 py-2.5 text-muted-foreground font-semibold w-24">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {santriList.map((s, i) => {
                const nilaiStr = getPAS(s.id)
                const nilai = parseNilai(nilaiStr)
                const lulus = nilai !== null && nilai >= kkm
                return (
                  <tr key={s.id} className={`transition-colors ${nilai !== null && !lulus ? "bg-destructive/5" : "hover:bg-muted/30"}`}>
                    <td className="px-3.5 py-2.5 text-muted-foreground">{i + 1}</td>
                    <td className="px-3.5 py-2.5 font-medium text-foreground">
                      {s.namaLengkap}
                      {s.nisn && <div className="text-[10px] text-muted-foreground">{s.nisn}</div>}
                    </td>
                    <td className="px-2.5 py-2.5 text-center bg-amber-500/5">
                      <input
                        type="number" min={0} max={100} step={0.1}
                        placeholder="0-100"
                        value={getPAS(s.id)}
                        onChange={e => setLocalPAS(prev => ({ ...prev, [s.id]: e.target.value }))}
                        className="w-24 border border-input bg-background text-foreground rounded-lg px-2 py-1 text-center text-xs font-semibold focus:ring-1 focus:ring-ring outline-none"
                      />
                    </td>
                    <td className="px-2.5 py-2.5 text-center">
                      {nilai === null ? (
                        <span className="text-muted-foreground text-[10px]">Belum diisi</span>
                      ) : lulus ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-primary/10 text-primary">Lulus</span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-destructive/10 text-destructive">Remedial</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Rekap Nilai ─────────────────────────────────────────────────────────
function TabRekap({
  pengampu, santriList, semesterId
}: { pengampu: Pengampu; santriList: Santri[]; semesterId: number | null }) {
  const kkm = pengampu.kkm ?? 70

  const nilaiAkhirList = santriList
    .map(s => {
      const rata = getRataAllSumatif(pengampu, s.id)
      const pas = pengampu.nilaiPAS.find(n => n.santriId === s.id)?.nilai ?? null
      return getNilaiAkhir(rata, pas)
    })
    .filter(v => v !== null) as number[]

  const rataKelas = nilaiAkhirList.length > 0
    ? nilaiAkhirList.reduce((a, b) => a + b, 0) / nilaiAkhirList.length
    : null
  const lulusCount = nilaiAkhirList.filter(v => v >= kkm).length
  const tidakLulusCount = nilaiAkhirList.filter(v => v < kkm).length

  return (
    <div className="space-y-4">
      {/* Stats */}
      {santriList.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Santri", value: santriList.length.toString(), color: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
            { label: "Rata-rata Kelas", value: rataKelas !== null ? rataKelas.toFixed(1) : "–", color: "bg-primary/10 text-primary border-primary/20" },
            { label: "Lulus KKM", value: lulusCount.toString(), color: "bg-primary/15 text-primary border-primary/25" },
            { label: "Belum Lulus", value: tidakLulusCount.toString(), color: "bg-destructive/10 text-destructive border-destructive/20" },
          ].map(stat => (
            <div key={stat.label} className={`${stat.color} rounded-xl p-3.5 border shadow-none`}>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs font-semibold opacity-80 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Ekspor */}
      {semesterId && (
        <div className="flex justify-end">
          <a
            href={`/api/guru/ekspor-nilai?pengampuId=${pengampu.id}&semesterId=${semesterId}`}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-muted border border-border text-xs font-semibold text-foreground hover:bg-muted/80 transition"
          >
            <Download className="h-3.5 w-3.5" />
            Ekspor Excel
          </a>
        </div>
      )}

      {/* Tabel Rekap */}
      <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/50 border-b border-border">
          <span className="text-xs text-muted-foreground">
            KKM: <strong className="text-primary">{kkm}</strong>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/30 border-b border-border text-center">
                <th className="text-left px-3.5 py-2.5 text-muted-foreground font-semibold">No</th>
                <th className="text-left px-3.5 py-2.5 text-muted-foreground font-semibold">Nama Santri</th>
                <th className="px-2.5 py-2.5 text-muted-foreground font-semibold">S1</th>
                <th className="px-2.5 py-2.5 text-muted-foreground font-semibold">S2</th>
                <th className="px-2.5 py-2.5 text-muted-foreground font-semibold">S3</th>
                <th className="px-2.5 py-2.5 text-muted-foreground font-semibold">Rata Sumatif</th>
                <th className="px-2.5 py-2.5 text-muted-foreground font-semibold">PAS</th>
                <th className="px-2.5 py-2.5 text-muted-foreground font-semibold bg-amber-500/10 text-amber-800">Nilai Akhir</th>
                <th className="px-2.5 py-2.5 text-muted-foreground font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {santriList.map((s, i) => {
                const s1 = (() => {
                  const ns = pengampu.nilaiSumatif.find(n => n.santriId === s.id && n.sumatifKe === 1)
                  const kh = ns?.nilaiKehadiran ?? hitungNilaiKehadiranDariJurnal(pengampu.jurnalMengajar, s.id, 1).nilai
                  return hitungRataSumatif(kh, ns?.nilaiKurikuler ?? null, ns?.nilaiTesSumatif ?? null)
                })()
                const s2 = (() => {
                  const ns = pengampu.nilaiSumatif.find(n => n.santriId === s.id && n.sumatifKe === 2)
                  const kh = ns?.nilaiKehadiran ?? hitungNilaiKehadiranDariJurnal(pengampu.jurnalMengajar, s.id, 2).nilai
                  return hitungRataSumatif(kh, ns?.nilaiKurikuler ?? null, ns?.nilaiTesSumatif ?? null)
                })()
                const s3 = (() => {
                  const ns = pengampu.nilaiSumatif.find(n => n.santriId === s.id && n.sumatifKe === 3)
                  const kh = ns?.nilaiKehadiran ?? hitungNilaiKehadiranDariJurnal(pengampu.jurnalMengajar, s.id, 3).nilai
                  return hitungRataSumatif(kh, ns?.nilaiKurikuler ?? null, ns?.nilaiTesSumatif ?? null)
                })()
                const rata = getRataAllSumatif(pengampu, s.id)
                const pas = pengampu.nilaiPAS.find(n => n.santriId === s.id)?.nilai ?? null
                const nilaiAkhir = getNilaiAkhir(rata, pas)
                const lulus = nilaiAkhir !== null && nilaiAkhir >= kkm

                return (
                  <tr key={s.id} className={`transition-colors ${nilaiAkhir !== null && !lulus ? "bg-destructive/5" : "hover:bg-muted/40"}`}>
                    <td className="px-3.5 py-2.5 text-muted-foreground">{i + 1}</td>
                    <td className="px-3.5 py-2.5 font-medium text-foreground">{s.namaLengkap}</td>
                    <td className="px-2.5 py-2.5 text-center text-muted-foreground">{fmt(s1)}</td>
                    <td className="px-2.5 py-2.5 text-center text-muted-foreground">{fmt(s2)}</td>
                    <td className="px-2.5 py-2.5 text-center text-muted-foreground">{fmt(s3)}</td>
                    <td className="px-2.5 py-2.5 text-center font-medium text-foreground">{fmt(rata)}</td>
                    <td className="px-2.5 py-2.5 text-center text-muted-foreground">{fmt(pas)}</td>
                    <td className="px-2.5 py-2.5 text-center font-bold bg-amber-500/10 text-amber-900">{fmt(nilaiAkhir)}</td>
                    <td className="px-2.5 py-2.5 text-center">
                      {nilaiAkhir === null ? (
                        <span className="text-muted-foreground text-[10px]">Belum Lengkap</span>
                      ) : lulus ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-primary/10 text-primary">Lulus</span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-destructive/10 text-destructive">Remedial</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Main Client Component ────────────────────────────────────────────────────
export default function PenilaianGuruClient({
  pengampu,
  santriList,
  semesterId,
  semesterNama,
}: {
  pengampu: Pengampu
  santriList: Santri[]
  semesterId: number | null
  semesterNama: string | null
}) {
  const [activeTab, setActiveTab] = useState<"sumatif" | "pas" | "rekap">("sumatif")
  const [isReleased, setIsReleased] = useState(!!pengampu.nilaiDirilis)
  const [isPendingRelease, setIsPendingRelease] = useState(false)

  const handleToggleRilis = async () => {
    const nextState = !isReleased
    const confirmMsg = nextState 
      ? "Apakah Anda yakin ingin merilis nilai mata pelajaran ini ke santri? Nilai akan langsung dapat dilihat di portal santri."
      : "Apakah Anda yakin ingin menyembunyikan nilai mata pelajaran ini dari santri?"
    
    if (!window.confirm(confirmMsg)) return

    setIsPendingRelease(true)
    try {
      const res = await toggleRilisNilaiMapel(pengampu.id, nextState)
      if (res.success) {
        setIsReleased(nextState)
        alert(nextState ? "Nilai berhasil dirilis ke santri!" : "Nilai berhasil disembunyikan dari santri.")
      } else {
        alert(res.error || "Gagal mengubah status visibilitas")
      }
    } catch (e) {
      alert("Terjadi kesalahan sistem")
    } finally {
      setIsPendingRelease(false)
    }
  }

  const tabs = [
    { id: "sumatif" as const, label: "Input Sumatif", icon: Edit3 },
    { id: "pas" as const, label: "Input PAS", icon: Edit3 },
    { id: "rekap" as const, label: "Rekap Nilai", icon: TrendingUp },
  ]

  if (santriList.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-12 text-center shadow-xs">
        <AlertCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
        <p className="font-semibold text-foreground">Belum ada santri di kelas ini</p>
        <p className="text-sm text-muted-foreground mt-1">
          Hubungi admin untuk menambahkan santri ke kelas.
        </p>
      </div>
    )
  }

  if (!semesterId) {
    return (
      <div className="bg-card rounded-2xl border border-border p-12 text-center shadow-xs">
        <AlertCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
        <p className="font-semibold text-foreground">Semester tidak ditemukan</p>
        <p className="text-sm text-muted-foreground mt-1">
          Hubungi admin untuk mengatur tahun ajaran aktif.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header Actions: Tabs & Visibility Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="bg-muted p-1 rounded-lg border border-border flex gap-1 w-fit flex-wrap">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === tab.id ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"}`}>
                <Icon className="h-3.5 w-3.5" /> {tab.label}
              </button>
            )
          })}
        </div>

        {/* Toggle Visibilitas Nilai ke Santri */}
        <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-3.5 py-2 shadow-2xs">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Visibilitas Portal Santri
            </span>
            <span className={`text-xs font-semibold flex items-center gap-1.5 ${isReleased ? "text-primary" : "text-amber-600"}`}>
              <span className={`w-2 h-2 rounded-full ${isReleased ? "bg-primary animate-pulse" : "bg-amber-500"}`} />
              {isReleased ? "Nilai Dirilis (Bisa Dilihat Santri)" : "Disembunyikan (Draft Guru)"}
            </span>
          </div>
          <Button
            size="sm"
            variant={isReleased ? "outline" : "default"}
            disabled={isPendingRelease}
            onClick={handleToggleRilis}
            className="text-xs h-8 gap-1.5"
          >
            {isPendingRelease ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isReleased ? (
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            {isReleased ? "Tarik Nilai" : "Rilis ke Santri"}
          </Button>
        </div>
      </div>

      {activeTab === "sumatif" && (
        <TabInputSumatif pengampu={pengampu} santriList={santriList} semesterId={semesterId} />
      )}
      {activeTab === "pas" && (
        <TabInputPAS pengampu={pengampu} santriList={santriList} semesterId={semesterId} />
      )}
      {activeTab === "rekap" && (
        <TabRekap pengampu={pengampu} santriList={santriList} semesterId={semesterId} />
      )}
    </div>
  )
}
