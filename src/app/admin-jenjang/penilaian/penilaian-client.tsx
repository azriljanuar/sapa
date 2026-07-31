"use client"

import { useState, useTransition } from "react"
import { BarChart2, Settings2, ChevronDown, Save, Loader2, CheckCircle2, AlertCircle, Users, TrendingUp } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────
type AbsensiItem = { santriId: number; status: string }
type Jurnal = { id: number; sumatifKe?: number | null; pertemuanKe?: number | null; absensiMapel: AbsensiItem[] }
type NilaiSumatif = { santriId: number; sumatifKe: number; nilaiKurikuler?: number | null; nilaiTesSumatif?: number | null }
type NilaiPAS = { santriId: number; nilai?: number | null }
type Pengampu = {
  id: number; kkm?: number | null
  mataPelajaran: { nama: string }
  kelasFormal: { id: number; namaKelas: string }
  guru: { nama: string }
  nilaiSumatif: NilaiSumatif[]
  nilaiPAS: NilaiPAS[]
  jurnalMengajar: Jurnal[]
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
    const kh = hitungNilaiKehadiran(pengampu.jurnalMengajar, santriId, s)
    return hitungNilaiSumatifRata(kh, ns?.nilaiKurikuler ?? null, ns?.nilaiTesSumatif ?? null)
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

// ─── Edit KKM Action ─────────────────────────────────────────────────────────
async function updateKKM(pengampuId: number, kkm: number | null): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("/api/admin/kkm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pengampuId, kkm })
    })
    const data = await res.json()
    return data
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// ─── Tab: Rekap Nilai ─────────────────────────────────────────────────────────
function TabRekapNilai({ pengampuList, kelasList, semesterId }: {
  pengampuList: Pengampu[]; kelasList: Kelas[]; semesterId: number | null
}) {
  const [selectedKelasId, setSelectedKelasId] = useState<number | null>(kelasList[0]?.id || null)
  const [selectedPengampuId, setSelectedPengampuId] = useState<number | null>(null)

  const kelas = kelasList.find(k => k.id === selectedKelasId)
  const pengampuKelas = pengampuList.filter(p => p.kelasFormal.id === selectedKelasId)
  const santriList = kelas?.anggota.map(a => a.santri) || []

  const pengampu = selectedPengampuId
    ? pengampuList.find(p => p.id === selectedPengampuId)
    : pengampuKelas[0]
  const kkm = pengampu?.kkm || 70

  if (kelasList.length === 0) return (
    <div className="text-center py-20 text-slate-400">
      <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-40" />
      <p className="font-semibold">Belum ada kelas untuk semester ini.</p>
    </div>
  )

  // Stats
  const nilaiAkhirList = santriList
    .map(s => {
      const rata = pengampu ? getRataSumatif(pengampu, s.id) : null
      const pas = pengampu?.nilaiPAS.find(n => n.santriId === s.id)?.nilai ?? null
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
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Kelas</label>
            <div className="flex flex-wrap gap-2">
              {kelasList.map(k => (
                <button key={k.id} onClick={() => { setSelectedKelasId(k.id); setSelectedPengampuId(null) }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition border ${selectedKelasId === k.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}>
                  {k.namaKelas}
                </button>
              ))}
            </div>
          </div>
          {pengampuKelas.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Mata Pelajaran</label>
              <div className="flex flex-wrap gap-2">
                {pengampuKelas.map(p => (
                  <button key={p.id}
                    onClick={() => setSelectedPengampuId(p.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition border ${(selectedPengampuId === p.id || (!selectedPengampuId && pengampuKelas[0]?.id === p.id)) ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"}`}>
                    {p.mataPelajaran.nama}
                    <span className="ml-1 text-xs opacity-75">({p.guru.nama})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      {pengampu && santriList.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Santri", value: santriList.length.toString(), color: "bg-blue-50 text-blue-700" },
            { label: "Rata-rata Kelas", value: rataKelas !== null ? rataKelas.toFixed(1) : "–", color: "bg-indigo-50 text-indigo-700" },
            { label: "Lulus KKM", value: lulusCount.toString(), color: "bg-emerald-50 text-emerald-700" },
            { label: "Belum Lulus", value: tidakLulusCount.toString(), color: "bg-red-50 text-red-700" },
          ].map(stat => (
            <div key={stat.label} className={`${stat.color} rounded-2xl p-4 border border-current border-opacity-20`}>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs font-semibold opacity-75 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabel Nilai */}
      {pengampu && santriList.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
            <span className="text-xs text-slate-500">
              KKM: <strong className="text-indigo-600">{kkm}</strong> · 
              Guru: <strong>{pengampu.guru.nama}</strong>
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-center">
                  <th className="text-left px-4 py-3 text-slate-600 font-semibold">No</th>
                  <th className="text-left px-4 py-3 text-slate-600 font-semibold">Nama Santri</th>
                  <th className="px-3 py-3 text-slate-600 font-semibold">S1</th>
                  <th className="px-3 py-3 text-slate-600 font-semibold">S2</th>
                  <th className="px-3 py-3 text-slate-600 font-semibold">S3</th>
                  <th className="px-3 py-3 text-slate-600 font-semibold">Rata Sumatif</th>
                  <th className="px-3 py-3 text-slate-600 font-semibold">PAS</th>
                  <th className="px-3 py-3 text-slate-600 font-semibold bg-amber-50">Nilai Akhir</th>
                  <th className="px-3 py-3 text-slate-600 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {santriList.map((s, i) => {
                  const s1 = (() => {
                    const ns = pengampu.nilaiSumatif.find(n => n.santriId === s.id && n.sumatifKe === 1)
                    const kh = hitungNilaiKehadiran(pengampu.jurnalMengajar, s.id, 1)
                    return hitungNilaiSumatifRata(kh, ns?.nilaiKurikuler ?? null, ns?.nilaiTesSumatif ?? null)
                  })()
                  const s2 = (() => {
                    const ns = pengampu.nilaiSumatif.find(n => n.santriId === s.id && n.sumatifKe === 2)
                    const kh = hitungNilaiKehadiran(pengampu.jurnalMengajar, s.id, 2)
                    return hitungNilaiSumatifRata(kh, ns?.nilaiKurikuler ?? null, ns?.nilaiTesSumatif ?? null)
                  })()
                  const s3 = (() => {
                    const ns = pengampu.nilaiSumatif.find(n => n.santriId === s.id && n.sumatifKe === 3)
                    const kh = hitungNilaiKehadiran(pengampu.jurnalMengajar, s.id, 3)
                    return hitungNilaiSumatifRata(kh, ns?.nilaiKurikuler ?? null, ns?.nilaiTesSumatif ?? null)
                  })()
                  const rata = getRataSumatif(pengampu, s.id)
                  const pas = pengampu.nilaiPAS.find(n => n.santriId === s.id)?.nilai ?? null
                  const nilaiAkhir = getNilaiAkhir(rata, pas)
                  const lulus = nilaiAkhir !== null && nilaiAkhir >= kkm

                  return (
                    <tr key={s.id} className={`transition ${nilaiAkhir !== null && !lulus ? "bg-red-50/30" : "hover:bg-slate-50/50"}`}>
                      <td className="px-4 py-2.5 text-slate-500">{i + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-800">{s.namaLengkap}</td>
                      <td className="px-3 py-2.5 text-center text-slate-600">{fmt(s1)}</td>
                      <td className="px-3 py-2.5 text-center text-slate-600">{fmt(s2)}</td>
                      <td className="px-3 py-2.5 text-center text-slate-600">{fmt(s3)}</td>
                      <td className="px-3 py-2.5 text-center font-semibold text-slate-700">{fmt(rata)}</td>
                      <td className="px-3 py-2.5 text-center text-slate-600">{fmt(pas)}</td>
                      <td className="px-3 py-2.5 text-center bg-amber-50">
                        <span className={`font-bold text-base ${nilaiAkhir === null ? "text-slate-300" : lulus ? "text-emerald-600" : "text-red-600"}`}>
                          {fmt(nilaiAkhir)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {nilaiAkhir !== null && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${lulus ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                            {lulus ? "✓ Lulus" : "✗ Belum"}
                          </span>
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

  // Kelompokkan per kelas
  const byKelas: Record<string, Pengampu[]> = {}
  for (const p of pengampuList) {
    const key = p.kelasFormal.namaKelas
    if (!byKelas[key]) byKelas[key] = []
    byKelas[key].push(p)
  }

  const handleSave = async (p: Pengampu) => {
    const nilaiStr = localKKM[p.id]
    const kkm = nilaiStr !== undefined ? parseFloat(nilaiStr) : (p.kkm ?? null)
    setSaving(p.id)
    const res = await updateKKM(p.id, isNaN(kkm as number) ? null : kkm)
    setSaving(null)
    if (res.success) setSaved(prev => new Set([...prev, p.id]))
    else alert("Gagal simpan KKM: " + res.error)
  }

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
        <strong>⚙️ Edit KKM</strong> — Nilai KKM berbeda untuk setiap kelas dan mata pelajaran. 
        Perubahan di sini akan langsung diterapkan ke halaman guru.
      </div>

      {Object.entries(byKelas).map(([namaKelas, list]) => (
        <div key={namaKelas} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800">{namaKelas}</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {list.map(p => {
              const isSaving = saving === p.id
              const isSaved = saved.has(p.id)
              const currentKKM = localKKM[p.id] ?? (p.kkm?.toString() ?? "")
              return (
                <div key={p.id} className="flex items-center px-5 py-3 gap-4">
                  <div className="flex-1">
                    <div className="font-medium text-slate-800">{p.mataPelajaran.nama}</div>
                    <div className="text-xs text-slate-500">{p.guru.nama}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-500 font-medium">KKM:</label>
                    <input
                      type="number" min={0} max={100} step={1}
                      value={currentKKM}
                      onChange={e => setLocalKKM(prev => ({ ...prev, [p.id]: e.target.value }))}
                      className="w-20 border border-slate-200 rounded-xl px-3 py-1.5 text-center text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="70"
                    />
                    <button onClick={() => handleSave(p)} disabled={isSaving}
                      className={`p-2 rounded-xl transition ${isSaved ? "text-emerald-600 hover:bg-emerald-50" : "text-indigo-600 hover:bg-indigo-50"}`}>
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : isSaved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {pengampuList.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <Settings2 className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>Belum ada mata pelajaran untuk semester ini.</p>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PenilaianAdminClient({ pengampuList, kelasList, semesterId, semesterNama }: {
  pengampuList: Pengampu[]
  kelasList: Kelas[]
  semesterId: number | null
  semesterNama: string
}) {
  const [activeTab, setActiveTab] = useState<"rekap" | "kkm">("rekap")

  const tabs = [
    { id: "rekap" as const, label: "Rekap Nilai", icon: TrendingUp },
    { id: "kkm" as const, label: "Edit KKM", icon: Settings2 },
  ]

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-indigo-600" /> Penilaian Santri
          </h1>
          {semesterNama && (
            <p className="text-sm text-slate-500 mt-1">Semester: <span className="font-semibold text-indigo-600">{semesterNama}</span></p>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full font-semibold">
            {kelasList.length} kelas · {pengampuList.length} mata pelajaran
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-1 flex gap-1 w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}>
              <Icon className="h-4 w-4" /> {tab.label}
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
