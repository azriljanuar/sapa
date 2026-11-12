"use client"

import { useState } from "react"
import { BarChart2, BookOpen, CheckCircle2, AlertCircle, EyeOff, Award, TrendingUp, Sparkles, ChevronDown, ChevronUp, Lock } from "lucide-react"

type NilaiItem = {
  pengampuId: number
  mataPelajaran: string
  kodeMapel: string | null
  namaGuru: string
  kkm: number
  isVisible: boolean
  tanggalRilis: string | null
  nilaiSumatif: {
    sumatifKe: number
    nilaiKurikuler: number | null
    nilaiTesSumatif: number | null
    nilaiKehadiran: number | null
  }[]
  nilaiPAS: number | null
  jurnalMengajar: any[]
}

function hitungRataSumatif(item: NilaiItem): number | null {
  const vals = [1, 2, 3].map(s => {
    const ns = item.nilaiSumatif.find(n => n.sumatifKe === s)
    if (!ns || (ns.nilaiKehadiran === null && ns.nilaiKurikuler === null && ns.nilaiTesSumatif === null)) return null
    return ((ns.nilaiKehadiran ?? 0) * 0.6) + ((ns.nilaiKurikuler ?? 0) * 0.2) + ((ns.nilaiTesSumatif ?? 0) * 0.2)
  })
  const valid = vals.filter(v => v !== null) as number[]
  if (valid.length === 0) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

function hitungNilaiAkhir(item: NilaiItem): number | null {
  const rataSumatif = hitungRataSumatif(item)
  const pas = item.nilaiPAS
  if (rataSumatif === null && pas === null) return null
  return ((rataSumatif ?? 0) * 0.6) + ((pas ?? 0) * 0.4)
}

const fmt = (v: number | null) => v !== null ? v.toFixed(1) : "–"

export default function SantriNilaiClient({
  santriName,
  namaKelas,
  semesterNama,
  listNilai
}: {
  santriName: string
  namaKelas: string
  semesterNama: string
  listNilai: NilaiItem[]
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // Hitung ringkasan
  const totalMapel = listNilai.length
  const mapelRilis = listNilai.filter(m => m.isVisible)
  const nilaiAkhirList = mapelRilis
    .map(m => hitungNilaiAkhir(m))
    .filter(v => v !== null) as number[]

  const rataKeseluruhan = nilaiAkhirList.length > 0
    ? nilaiAkhirList.reduce((a, b) => a + b, 0) / nilaiAkhirList.length
    : null

  const lulusCount = mapelRilis.filter(m => {
    const na = hitungNilaiAkhir(m)
    return na !== null && na >= m.kkm
  }).length

  return (
    <div className="space-y-6 pb-12">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-primary" />
            Nilai Hasil Belajar
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kelas: <span className="font-semibold text-foreground">{namaKelas}</span> · Semester: <span className="font-semibold text-foreground">{semesterNama}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            {santriName}
          </span>
        </div>
      </div>

      {/* Ringkasan Statistik */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border p-3.5 shadow-2xs">
          <div className="text-2xl font-bold text-foreground">{totalMapel}</div>
          <div className="text-xs font-medium text-muted-foreground mt-0.5">Total Mapel</div>
        </div>

        <div className="bg-card rounded-xl border border-border p-3.5 shadow-2xs">
          <div className="text-2xl font-bold text-emerald-600">
            {mapelRilis.length} <span className="text-xs font-normal text-muted-foreground">/ {totalMapel}</span>
          </div>
          <div className="text-xs font-medium text-muted-foreground mt-0.5">Nilai Dirilis</div>
        </div>

        <div className="bg-card rounded-xl border border-border p-3.5 shadow-2xs">
          <div className="text-2xl font-bold text-primary">{fmt(rataKeseluruhan)}</div>
          <div className="text-xs font-medium text-muted-foreground mt-0.5">Rata-rata Nilai</div>
        </div>

        <div className="bg-card rounded-xl border border-border p-3.5 shadow-2xs">
          <div className="text-2xl font-bold text-indigo-600">{lulusCount} Mapel</div>
          <div className="text-xs font-medium text-muted-foreground mt-0.5">Mencapai KKM</div>
        </div>
      </div>

      {/* Daftar Mata Pelajaran */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Rincian Nilai per Mata Pelajaran
        </h2>

        {listNilai.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">Belum ada mata pelajaran yang terjadwal untuk kelas ini.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {listNilai.map(item => {
              const isExpanded = expandedId === item.pengampuId
              const rataSumatif = hitungRataSumatif(item)
              const nilaiAkhir = hitungNilaiAkhir(item)
              const isLulus = nilaiAkhir !== null && nilaiAkhir >= item.kkm

              return (
                <div
                  key={item.pengampuId}
                  className={`bg-card rounded-xl border transition-all overflow-hidden ${
                    item.isVisible ? "border-border shadow-xs" : "border-dashed border-border/80 bg-muted/20"
                  }`}
                >
                  {/* Card Header */}
                  <div
                    onClick={() => item.isVisible && setExpandedId(isExpanded ? null : item.pengampuId)}
                    className={`p-4 flex items-center justify-between gap-3 ${
                      item.isVisible ? "cursor-pointer hover:bg-muted/30" : "cursor-default"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        item.isVisible ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }`}>
                        {item.isVisible ? <Award className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-foreground truncate">
                            {item.mataPelajaran}
                          </h3>
                          {item.kodeMapel && (
                            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                              {item.kodeMapel}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          Guru: {item.namaGuru} · KKM: <span className="font-semibold">{item.kkm}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {item.isVisible ? (
                        <>
                          <div className="text-right">
                            <span className="text-[10px] text-muted-foreground block">Nilai Akhir</span>
                            <span className="text-base font-bold text-foreground">
                              {fmt(nilaiAkhir)}
                            </span>
                          </div>
                          <div>
                            {nilaiAkhir === null ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-muted text-muted-foreground">
                                Belum Lengkap
                              </span>
                            ) : isLulus ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                                Lulus
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                                Remedial
                              </span>
                            )}
                          </div>
                          <button className="text-muted-foreground hover:text-foreground p-1">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 border border-amber-500/20 text-xs font-semibold">
                          <EyeOff className="h-3.5 w-3.5" />
                          <span>Nilai Belum Dirilis</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Detail (Expanded) */}
                  {item.isVisible && isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-border/60 bg-muted/10 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                        {[1, 2, 3].map(ke => {
                          const ns = item.nilaiSumatif.find(n => n.sumatifKe === ke)
                          const kh = ns?.nilaiKehadiran ?? null
                          const ku = ns?.nilaiKurikuler ?? null
                          const tes = ns?.nilaiTesSumatif ?? null
                          const sRata = (kh !== null || ku !== null || tes !== null)
                            ? (((kh ?? 0) * 0.6) + ((ku ?? 0) * 0.2) + ((tes ?? 0) * 0.2))
                            : null

                          return (
                            <div key={ke} className="bg-card p-3 rounded-lg border border-border/80 text-xs space-y-1.5 shadow-2xs">
                              <div className="font-semibold text-foreground flex items-center justify-between">
                                <span>Sumatif {ke}</span>
                                <span className="text-primary font-bold">{fmt(sRata)}</span>
                              </div>
                              <div className="text-[11px] text-muted-foreground space-y-0.5 pt-1 border-t border-border/40">
                                <div className="flex justify-between">
                                  <span>Kehadiran (60%):</span>
                                  <span className="font-medium text-foreground">{fmt(kh)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Kurikuler (20%):</span>
                                  <span className="font-medium text-foreground">{fmt(ku)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Tes Sumatif (20%):</span>
                                  <span className="font-medium text-foreground">{fmt(tes)}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Summary Row */}
                      <div className="bg-card p-3 rounded-lg border border-border/80 flex items-center justify-between text-xs font-medium">
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-muted-foreground">Rata-rata Sumatif (60%): </span>
                            <span className="font-bold text-foreground">{fmt(rataSumatif)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Nilai PAS (40%): </span>
                            <span className="font-bold text-foreground">{fmt(item.nilaiPAS)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-muted-foreground">Nilai Akhir: </span>
                          <span className="font-bold text-primary text-sm">{fmt(nilaiAkhir)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notice for unreleased mapel */}
                  {!item.isVisible && (
                    <div className="px-4 pb-3 text-xs text-muted-foreground flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>
                        Nilai mata pelajaran ini masih dalam proses penyusunan/koreksi oleh guru pengampu dan belum dibuka untuk dilihat.
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
