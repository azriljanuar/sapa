"use client"

import { useState, useTransition } from "react"
import { BarChart2, Settings2, Save, Loader2, CheckCircle2, AlertCircle, TrendingUp, Eye, EyeOff, Globe } from "lucide-react"
import { toggleRilisNilaiPengampu, toggleRilisSemuaNilaiSemester } from "./actions"

// ─── Types ────────────────────────────────────────────────────────────────────
type AbsensiItem = { santriId: number; status: string }
type Jurnal = { id: number; sumatifKe?: number | null; pertemuanKe?: number | null; absensiMapel: AbsensiItem[] }
type NilaiSumatif = {
  santriId: number
  sumatifKe: number
  nilaiKurikuler?: number | null
  nilaiTesSumatif?: number | null
  nilaiKehadiran?: number | null
}
type NilaiPAS = { santriId: number; nilai?: number | null }
type Pengampu = {
  id: number; kkm?: number | null
  mataPelajaran: { nama: string }
  kelasFormal: { id: number; namaKelas: string }
  guru: { nama: string }
  nilaiSumatif: NilaiSumatif[]
  nilaiPAS: NilaiPAS[]
  jurnalMengajar: Jurnal[]
  nilaiDirilis?: boolean | null
  tanggalRilis?: Date | string | null
}
type Santri = { id: number; namaLengkap: string; nisn: string }
type Kelas = { id: number; namaKelas: string; anggota: { santri: Santri }[] }

// ─── Helpers ─────────────────────────────────────────────────────────────────
function hitungNilaiKehadiran(jurnal: Jurnal[], santriId: number, sumatifKe: number): number | null {
  const j = jurnal.filter(x => x.sumatifKe === sumatifKe)
  if (j.length === 0) return null
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
  if (total === 0) return null
  return ((hadir * 100) + (sakit * 80) + (izin * 70)) / total
}

function hitungNilaiSumatifRata(kh: number | null, ku: number | null, tes: number | null): number | null {
  if (kh === null && ku === null && tes === null) return null
  return ((kh ?? 0) * 0.6) + ((ku ?? 0) * 0.2) + ((tes ?? 0) * 0.2)
}

function getRataSumatif(pengampu: Pengampu, santriId: number): number | null {
  const vals = [1, 2, 3].map(s => {
    const ns = pengampu.nilaiSumatif.find(n => n.santriId === santriId && n.sumatifKe === s)
    const kh = ns?.nilaiKehadiran ?? hitungNilaiKehadiran(pengampu.jurnalMengajar, santriId, s)
    return hitungNilaiSumatifRata(kh, ns?.nilaiKurikuler ?? null, ns?.nilaiTesSumatif ?? null)
  })
  const valid = vals.filter(v => v !== null) as number[]
  if (valid.length === 0) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

function getNilaiAkhir(rataSumatif: number | null, pas: number | null): number | null {
  if (rataSumatif === null && pas === null) return null
  return ((rataSumatif ?? 0) * 0.6) + ((pas ?? 0) * 0.4)
}

const fmt = (v: number | null) => v !== null ? v.toFixed(1) : "–"

// ─── Tab: Rekap Nilai ────────────────────────────────────────────────────────
function TabRekapNilai({ pengampuList, kelasList, semesterId }: {
  pengampuList: Pengampu[]
  kelasList: Kelas[]
  semesterId: number | null
}) {
  const [selectedKelasId, setSelectedKelasId] = useState<number>(kelasList[0]?.id ?? 0)
  const [selectedPengampuId, setSelectedPengampuId] = useState<number | null>(null)
  const [releasedMap, setReleasedMap] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {}
    pengampuList.forEach(p => {
      initial[p.id] = !!p.nilaiDirilis
    })
    return initial
  })
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const selectedKelas = kelasList.find(k => k.id === selectedKelasId)
  const pengampuKelas = pengampuList.filter(p => p.kelasFormal.id === selectedKelasId)
  const pengampu = selectedPengampuId
    ? pengampuKelas.find(p => p.id === selectedPengampuId)
    : pengampuKelas[0]

  const santriList = selectedKelas?.anggota.map(a => a.santri) ?? []
  const kkm = pengampu?.kkm ?? 70

  const handleToggleMapel = async (pId: number) => {
    const currentState = !!releasedMap[pId]
    const nextState = !currentState
    const confirmMsg = nextState
      ? "Rilis nilai mata pelajaran ini agar dapat dilihat oleh santri di portal santri?"
      : "Sembunyikan nilai mata pelajaran ini dari portal santri?"
    
    if (!window.confirm(confirmMsg)) return

    setTogglingId(pId)
    try {
      const res = await toggleRilisNilaiPengampu(pId, nextState)
      if (res.success) {
        setReleasedMap(prev => ({ ...prev, [pId]: nextState }))
      } else {
        alert(res.error || "Gagal mengubah status rilis")
      }
    } catch {
      alert("Terjadi kesalahan sistem")
    } finally {
      setTogglingId(null)
    }
  }

  // Ringkasan nilai kelas
  const nilaiAkhirList = santriList
    .map(s => {
      if (!pengampu) return null
      const rata = getRataSumatif(pengampu, s.id)
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
      {/* Filter Kelas */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Kelas</label>
            <div className="flex flex-wrap gap-2">
              {kelasList.map(k => (
                <button key={k.id} onClick={() => { setSelectedKelasId(k.id); setSelectedPengampuId(null) }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${selectedKelasId === k.id ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/50"}`}>
                  {k.namaKelas}
                </button>
              ))}
            </div>
          </div>
          {pengampuKelas.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Mata Pelajaran</label>
              <div className="flex flex-wrap gap-2">
                {pengampuKelas.map(p => {
                  const isRel = releasedMap[p.id] ?? !!p.nilaiDirilis
                  const isSelected = (selectedPengampuId === p.id || (!selectedPengampuId && pengampuKelas[0]?.id === p.id))
                  return (
                    <button key={p.id}
                      onClick={() => setSelectedPengampuId(p.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border flex items-center gap-1.5 ${isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/50"}`}>
                      <span>{p.mataPelajaran.nama}</span>
                      <span className="text-[10px] opacity-80">({p.guru.nama})</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${isRel ? "bg-emerald-400" : "bg-amber-400"}`} title={isRel ? "Dirilis" : "Disembunyikan"} />
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      {pengampu && santriList.length > 0 && (
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

      {/* Tabel Nilai */}
      {pengampu && santriList.length > 0 && (
        <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/50 border-b border-border flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-muted-foreground">
              KKM: <strong className="text-primary">{kkm}</strong> · 
              Guru: <strong className="text-foreground">{pengampu.guru.nama}</strong>
            </span>

            {/* Toggle Visibilitas Mapel Ini */}
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-semibold flex items-center gap-1.5 ${releasedMap[pengampu.id] ? "text-primary" : "text-amber-600"}`}>
                <span className={`w-2 h-2 rounded-full ${releasedMap[pengampu.id] ? "bg-primary animate-pulse" : "bg-amber-500"}`} />
                {releasedMap[pengampu.id] ? "Dirilis ke Santri" : "Disembunyikan"}
              </span>
              <button
                disabled={togglingId === pengampu.id}
                onClick={() => handleToggleMapel(pengampu.id)}
                className="text-xs px-2.5 py-1 rounded-md border border-border bg-card hover:bg-muted font-medium flex items-center gap-1 transition"
              >
                {togglingId === pengampu.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : releasedMap[pengampu.id] ? (
                  <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <Eye className="w-3.5 h-3.5 text-primary" />
                )}
                {releasedMap[pengampu.id] ? "Sembunyikan" : "Rilis Mapel Ini"}
              </button>
            </div>
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
                    const kh = ns?.nilaiKehadiran ?? hitungNilaiKehadiran(pengampu.jurnalMengajar, s.id, 1)
                    return hitungNilaiSumatifRata(kh, ns?.nilaiKurikuler ?? null, ns?.nilaiTesSumatif ?? null)
                  })()
                  const s2 = (() => {
                    const ns = pengampu.nilaiSumatif.find(n => n.santriId === s.id && n.sumatifKe === 2)
                    const kh = ns?.nilaiKehadiran ?? hitungNilaiKehadiran(pengampu.jurnalMengajar, s.id, 2)
                    return hitungNilaiSumatifRata(kh, ns?.nilaiKurikuler ?? null, ns?.nilaiTesSumatif ?? null)
                  })()
                  const s3 = (() => {
                    const ns = pengampu.nilaiSumatif.find(n => n.santriId === s.id && n.sumatifKe === 3)
                    const kh = ns?.nilaiKehadiran ?? hitungNilaiKehadiran(pengampu.jurnalMengajar, s.id, 3)
                    return hitungNilaiSumatifRata(kh, ns?.nilaiKurikuler ?? null, ns?.nilaiTesSumatif ?? null)
                  })()
                  const rata = getRataSumatif(pengampu, s.id)
                  const pas = pengampu.nilaiPAS.find(n => n.santriId === s.id)?.nilai ?? null
                  const nilaiAkhir = getNilaiAkhir(rata, pas)
                  const lulus = nilaiAkhir !== null && nilaiAkhir >= kkm

                  return (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3.5 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-3.5 py-2 font-medium text-foreground">
                        {s.namaLengkap}
                        {s.nisn && <div className="text-[10px] text-muted-foreground">{s.nisn}</div>}
                      </td>
                      <td className="px-2.5 py-2 text-center text-muted-foreground">{fmt(s1)}</td>
                      <td className="px-2.5 py-2 text-center text-muted-foreground">{fmt(s2)}</td>
                      <td className="px-2.5 py-2 text-center text-muted-foreground">{fmt(s3)}</td>
                      <td className="px-2.5 py-2 text-center font-medium text-foreground">{fmt(rata)}</td>
                      <td className="px-2.5 py-2 text-center text-muted-foreground">{fmt(pas)}</td>
                      <td className="px-2.5 py-2 text-center font-bold bg-amber-500/10 text-amber-900">{fmt(nilaiAkhir)}</td>
                      <td className="px-2.5 py-2 text-center">
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
      )}
    </div>
  )
}

// ─── Tab: Edit KKM ────────────────────────────────────────────────────────────
function TabEditKKM({ pengampuList }: { pengampuList: Pengampu[] }) {
  const [localKKM, setLocalKKM] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState<number | null>(null)
  const [saved, setSaved] = useState<Set<number>>(new Set())

  const byKelas: Record<string, Pengampu[]> = {}
  for (const p of pengampuList) {
    const k = p.kelasFormal.namaKelas
    if (!byKelas[k]) byKelas[k] = []
    byKelas[k].push(p)
  }

  const handleSave = async (p: Pengampu) => {
    const rawVal = localKKM[p.id] ?? p.kkm?.toString() ?? "70"
    const kkmVal = parseFloat(rawVal)
    if (isNaN(kkmVal) || kkmVal < 0 || kkmVal > 100) {
      alert("KKM harus angka antara 0 - 100")
      return
    }

    setSaving(p.id)
    try {
      const res = await fetch("/api/admin/kkm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pengampuId: p.id, kkm: kkmVal })
      }).then(r => r.json())

      if (res.success) {
        setSaved(prev => new Set([...prev, p.id]))
        setTimeout(() => setSaved(prev => {
          const next = new Set(prev)
          next.delete(p.id)
          return next
        }), 2000)
      } else {
        alert("Gagal update KKM: " + (res.error || "Unknown error"))
      }
    } catch {
      alert("Terjadi kesalahan jaringan")
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-4">
      {Object.entries(byKelas).map(([namaKelas, list]) => (
        <div key={namaKelas} className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/50 border-b border-border">
            <h3 className="font-semibold text-foreground text-sm">{namaKelas}</h3>
          </div>
          <div className="divide-y divide-border">
            {list.map(p => {
              const isSaving = saving === p.id
              const isSaved = saved.has(p.id)
              const currentKKM = localKKM[p.id] ?? (p.kkm?.toString() ?? "")
              return (
                <div key={p.id} className="flex items-center px-4 py-2.5 gap-4">
                  <div className="flex-1">
                    <div className="font-medium text-foreground text-xs">{p.mataPelajaran.nama}</div>
                    <div className="text-[11px] text-muted-foreground">{p.guru.nama}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-muted-foreground font-medium">KKM:</label>
                    <input
                      type="number" min={0} max={100} step={1}
                      value={currentKKM}
                      onChange={e => setLocalKKM(prev => ({ ...prev, [p.id]: e.target.value }))}
                      className="w-16 border border-input bg-background text-foreground rounded-lg px-2 py-1 text-center text-xs font-semibold focus:ring-1 focus:ring-ring outline-none"
                      placeholder="70"
                    />
                    <button onClick={() => handleSave(p)} disabled={isSaving}
                      className={`p-1.5 rounded-lg transition ${isSaved ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-muted"}`}>
                      {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isSaved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {pengampuList.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Settings2 className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Belum ada mata pelajaran untuk semester ini.</p>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PenilaianAdminClient({ 
  pengampuList, 
  kelasList, 
  semesterId, 
  semesterNama,
  semesterNilaiDirilis = false
}: {
  pengampuList: Pengampu[]
  kelasList: Kelas[]
  semesterId: number | null
  semesterNama: string
  semesterNilaiDirilis?: boolean
}) {
  const [activeTab, setActiveTab] = useState<"rekap" | "kkm">("rekap")
  const [isSemesterReleased, setIsSemesterReleased] = useState(semesterNilaiDirilis)
  const [isPendingSemester, setIsPendingSemester] = useState(false)

  const handleToggleSemester = async () => {
    if (!semesterId) return
    const nextState = !isSemesterReleased
    const confirmMsg = nextState
      ? "Apakah Anda yakin ingin MERILIS SEMUA NILAI pada semester ini ke seluruh santri? Seluruh santri akan dapat melihat nilai mereka."
      : "Apakah Anda yakin ingin MENYEMBUNYIKAN SEMUA NILAI semester ini dari santri?"

    if (!window.confirm(confirmMsg)) return

    setIsPendingSemester(true)
    try {
      const res = await toggleRilisSemuaNilaiSemester(semesterId, nextState)
      if (res.success) {
        setIsSemesterReleased(nextState)
        alert(nextState ? "Semua nilai semester berhasil dirilis ke santri!" : "Semua nilai semester berhasil disembunyikan dari santri.")
        window.location.reload()
      } else {
        alert(res.error || "Gagal mengubah status rilis semester")
      }
    } catch {
      alert("Terjadi kesalahan sistem")
    } finally {
      setIsPendingSemester(false)
    }
  }

  const tabs = [
    { id: "rekap" as const, label: "Rekap Nilai", icon: TrendingUp },
    { id: "kkm" as const, label: "Edit KKM", icon: Settings2 },
  ]

  return (
    <div className="space-y-4 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-primary" /> Penilaian Santri
          </h1>
          {semesterNama && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Semester: <span className="font-semibold text-foreground">{semesterNama}</span>
            </p>
          )}
        </div>

        {/* Action Buttons: Release Semester */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-md font-medium">
            {kelasList.length} kelas · {pengampuList.length} mapel
          </span>

          {semesterId && (
            <button
              onClick={handleToggleSemester}
              disabled={isPendingSemester}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition shadow-2xs ${
                isSemesterReleased
                  ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                  : "bg-card text-foreground border-border hover:bg-muted"
              }`}
            >
              {isPendingSemester ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isSemesterReleased ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5 text-primary" />
              )}
              {isSemesterReleased ? "Tarik Semua Nilai Semester" : "Rilis Semua Nilai Semester"}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-muted p-1 rounded-lg border border-border flex gap-1 w-fit">
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

      {/* Content */}
      {activeTab === "rekap" && (
        <TabRekapNilai pengampuList={pengampuList} kelasList={kelasList} semesterId={semesterId} />
      )}
      {activeTab === "kkm" && (
        <TabEditKKM pengampuList={pengampuList} />
      )}
    </div>
  )
}
