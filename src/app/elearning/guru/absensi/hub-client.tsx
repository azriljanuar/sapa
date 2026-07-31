"use client"

import { useState, useTransition } from "react"
import {
  CheckSquare, CheckCircle2, BookOpen, Users, BarChart3, ClipboardList,
  Plus, ChevronDown, ChevronRight, Save, AlertCircle, Loader2, GraduationCap
} from "lucide-react"
import { catatKehadiranGuru, createJurnalMengajar, simpanNilaiSumatif, simpanNilaiPAS } from "../actions"
import { StatusKehadiran } from "@prisma/client"

// ─── Types ────────────────────────────────────────────────────────────────────
type Santri = { id: number; namaLengkap: string; nisn: string }
type AbsensiMapelItem = { santriId: number; status: string; santri: { id: number; namaLengkap: string } }
type Jurnal = {
  id: number; tanggal: string; materi: string; catatan?: string | null
  sumatifKe?: number | null; pertemuanKe?: number | null
  absensiMapel: AbsensiMapelItem[]
}
type NilaiSumatif = { santriId: number; sumatifKe: number; nilaiKurikuler?: number | null; nilaiTesSumatif?: number | null }
type NilaiPAS = { santriId: number; nilai?: number | null }
type Pengampu = {
  id: number; kelasFormalId: number; kkm?: number | null
  mataPelajaran: { nama: string }
  kelasFormal: { namaKelas: string; jenjang: { singkatan: string } }
  tahunAjaran: { id: number; nama: string; semester: { id: number; nama: string }[] }
  jurnalMengajar: Jurnal[]
  nilaiSumatif: NilaiSumatif[]
  nilaiPAS: NilaiPAS[]
}

// ─── Helper: hitung nilai kehadiran dari absensi mapel ────────────────────────
function hitungNilaiKehadiran(jurnal: Jurnal[], santriId: number, sumatifKe: number): number | null {
  const jurnalSumatif = jurnal.filter(j => j.sumatifKe === sumatifKe)
  if (jurnalSumatif.length === 0) return null
  let hadir = 0, sakit = 0, izin = 0, alpa = 0
  for (const j of jurnalSumatif) {
    const absensi = j.absensiMapel.find(a => a.santriId === santriId)
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

function hitungNilaiSumatifRata(kehadiran: number | null, kurikuler: number | null, tes: number | null): number | null {
  if (kehadiran === null && kurikuler === null && tes === null) return null
  const k = kehadiran ?? 0; const ku = kurikuler ?? 0; const t = tes ?? 0
  return (k * 0.6) + (ku * 0.2) + (t * 0.2)
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    HADIR: "bg-emerald-100 text-emerald-700",
    SAKIT: "bg-blue-100 text-blue-700",
    IZIN: "bg-amber-100 text-amber-700",
    ALPA: "bg-red-100 text-red-700",
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] || "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  )
}

// ─── Tab 1: Kehadiran Guru ────────────────────────────────────────────────────
function TabKehadiranGuru({ existingAbsensi }: { existingAbsensi: any }) {
  const [status, setStatus] = useState<StatusKehadiran>("HADIR")
  const [keterangan, setKeterangan] = useState("")
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const res = await catatKehadiranGuru(new Date(), status, keterangan)
      if (res.success) setSuccess(true)
      else alert("Gagal: " + res.error)
    })
  }

  if (existingAbsensi || success) {
    const data = existingAbsensi || { status, keterangan }
    return (
      <div className="bg-emerald-50 border border-emerald-200 p-10 rounded-2xl text-center max-w-xl mx-auto shadow-sm">
        <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-emerald-800 mb-2">Kehadiran Tercatat!</h2>
        <p className="text-emerald-700 mb-4">Data kehadiran Anda hari ini telah tersimpan.</p>
        <div className="bg-white p-4 rounded-xl border border-emerald-100 inline-block text-left">
          <div className="text-sm text-slate-500 mb-1">Status:</div>
          <StatusBadge status={data.status} />
          {data.keterangan && <div className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded border border-slate-100">"{data.keterangan}"</div>}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 block">Status Kehadiran</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(["HADIR", "SAKIT", "IZIN", "ALPA"] as StatusKehadiran[]).map(opt => (
                <label key={opt} className={`border rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${status === opt ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600" : "border-slate-200 hover:border-indigo-300 text-slate-600"}`}>
                  <input type="radio" name="status" value={opt} checked={status === opt} onChange={e => setStatus(e.target.value as StatusKehadiran)} className="sr-only" />
                  <span className="font-bold">{opt}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">Keterangan <span className="text-slate-400 font-normal">(opsional)</span></label>
            <textarea className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-600 outline-none transition" rows={3} value={keterangan} onChange={e => setKeterangan(e.target.value)} />
          </div>
          <button type="submit" disabled={isPending} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Menyimpan..." : "Simpan Kehadiran"}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Form Tambah Pertemuan (modal-like inline) ────────────────────────────────
function FormTambahPertemuan({ pengampu, sumatifKe, pertemuanKe, santriList, onClose, onSuccess }: {
  pengampu: Pengampu; sumatifKe: number; pertemuanKe: number
  santriList: Santri[]; onClose: () => void; onSuccess: () => void
}) {
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0])
  const [materi, setMateri] = useState("")
  const [catatan, setCatatan] = useState("")
  const [absensi, setAbsensi] = useState<Record<number, StatusKehadiran>>(() => {
    const init: Record<number, StatusKehadiran> = {}
    santriList.forEach(s => { init[s.id] = "HADIR" })
    return init
  })
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!materi.trim()) { alert("Materi wajib diisi"); return }
    startTransition(async () => {
      const absensiList = santriList.map(s => ({ santriId: s.id, status: absensi[s.id] || "HADIR" }))
      const res = await createJurnalMengajar(pengampu.id, new Date(tanggal), materi, sumatifKe, pertemuanKe, catatan || undefined, absensiList)
      if (res.success) { onSuccess(); onClose() }
      else alert("Gagal: " + res.error)
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h3 className="font-bold text-slate-800 text-lg">Pertemuan {pertemuanKe} — Sumatif {sumatifKe}</h3>
          <p className="text-sm text-slate-500">{pengampu.mataPelajaran.nama} · {pengampu.kelasFormal.namaKelas}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">Tanggal Pertemuan</label>
            <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-600 outline-none" required />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">Materi / Topik <span className="text-red-500">*</span></label>
            <textarea value={materi} onChange={e => setMateri(e.target.value)} rows={3} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-600 outline-none" placeholder="Tulis materi yang diajarkan..." required />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">Catatan Mengajar <span className="text-slate-400 font-normal">(opsional)</span></label>
            <textarea value={catatan} onChange={e => setCatatan(e.target.value)} rows={2} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-600 outline-none" placeholder="Catatan tambahan..." />
          </div>

          {santriList.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">Absensi Santri</label>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="grid grid-cols-5 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200">
                  <span className="col-span-1">No</span>
                  <span className="col-span-2">Nama</span>
                  <span className="col-span-2">Status</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {santriList.map((s, i) => (
                    <div key={s.id} className="grid grid-cols-5 px-3 py-2 items-center text-sm">
                      <span className="text-slate-500 col-span-1">{i + 1}</span>
                      <span className="font-medium text-slate-800 col-span-2">{s.namaLengkap}</span>
                      <div className="col-span-2 flex gap-1 flex-wrap">
                        {(["HADIR", "SAKIT", "IZIN", "ALPA"] as StatusKehadiran[]).map(st => (
                          <button key={st} type="button"
                            onClick={() => setAbsensi(prev => ({ ...prev, [s.id]: st }))}
                            className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all border ${absensi[s.id] === st
                              ? st === "HADIR" ? "bg-emerald-500 text-white border-emerald-500"
                                : st === "SAKIT" ? "bg-blue-500 text-white border-blue-500"
                                  : st === "IZIN" ? "bg-amber-500 text-white border-amber-500"
                                    : "bg-red-500 text-white border-red-500"
                              : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"}`}
                          >{st}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl font-medium hover:bg-slate-50 transition">Batal</button>
            <button type="submit" disabled={isPending} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Tab 2: Pertemuan & Jurnal ────────────────────────────────────────────────
function TabPertemuan({ pengampuList, santriPerKelas, onRefresh }: {
  pengampuList: Pengampu[]; santriPerKelas: Record<number, Santri[]>; onRefresh: () => void
}) {
  const [selectedPengampuId, setSelectedPengampuId] = useState<number | null>(pengampuList[0]?.id || null)
  const [showForm, setShowForm] = useState<{ sumatifKe: number; pertemuanKe: number } | null>(null)
  const [expandedSumatif, setExpandedSumatif] = useState<number[]>([1])

  const pengampu = pengampuList.find(p => p.id === selectedPengampuId)
  const santriList = pengampu ? (santriPerKelas[pengampu.kelasFormalId] || []) : []

  if (pengampuList.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="font-semibold">Belum ada mata pelajaran yang diampu di semester ini.</p>
      </div>
    )
  }

  const getJurnalBySumatif = (s: number) => (pengampu?.jurnalMengajar || []).filter(j => j.sumatifKe === s)
  const getNextPertemuanKe = (sumatifKe: number) => getJurnalBySumatif(sumatifKe).length + 1

  return (
    <div className="space-y-4">
      {/* Pilih Kelas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <label className="text-sm font-semibold text-slate-600 block mb-2">Pilih Mata Pelajaran / Kelas</label>
        <div className="flex flex-wrap gap-2">
          {pengampuList.map(p => (
            <button key={p.id} onClick={() => setSelectedPengampuId(p.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition border ${selectedPengampuId === p.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}>
              {p.mataPelajaran.nama} – {p.kelasFormal.namaKelas}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline per Sumatif */}
      {pengampu && (
        <div className="space-y-3">
          {[1, 2, 3].map(sumatifKe => {
            const jurnal = getJurnalBySumatif(sumatifKe)
            const isExpanded = expandedSumatif.includes(sumatifKe)
            const nextKe = getNextPertemuanKe(sumatifKe)
            const canAdd = nextKe <= 15

            return (
              <div key={sumatifKe} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition"
                  onClick={() => setExpandedSumatif(prev => isExpanded ? prev.filter(x => x !== sumatifKe) : [...prev, sumatifKe])}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">S{sumatifKe}</div>
                    <div className="text-left">
                      <div className="font-semibold text-slate-800">Sumatif {sumatifKe}</div>
                      <div className="text-xs text-slate-500">{jurnal.length}/15 pertemuan</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(jurnal.length / 15) * 100}%` }} />
                    </div>
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100">
                    {jurnal.length === 0 && (
                      <div className="px-5 py-4 text-sm text-slate-400 text-center">Belum ada pertemuan untuk Sumatif {sumatifKe}</div>
                    )}
                    {jurnal.map(j => (
                      <div key={j.id} className="flex items-start gap-3 px-5 py-3 border-b border-slate-50 last:border-0">
                        <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {j.pertemuanKe}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-slate-500">{new Date(j.tanggal).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">✓ {j.absensiMapel.length} absensi</span>
                          </div>
                          <p className="text-sm font-medium text-slate-800 mt-1 line-clamp-2">{j.materi}</p>
                          {j.catatan && <p className="text-xs text-slate-500 mt-0.5 italic">{j.catatan}</p>}
                        </div>
                      </div>
                    ))}
                    {canAdd && (
                      <div className="px-5 py-3 border-t border-slate-100">
                        <button
                          onClick={() => setShowForm({ sumatifKe, pertemuanKe: nextKe })}
                          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium text-sm transition"
                        >
                          <Plus className="h-4 w-4" /> Tambah Pertemuan {nextKe}
                        </button>
                      </div>
                    )}
                    {!canAdd && (
                      <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400 text-center">
                        Sumatif {sumatifKe} sudah penuh (15/15 pertemuan)
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showForm && pengampu && (
        <FormTambahPertemuan
          pengampu={pengampu}
          sumatifKe={showForm.sumatifKe}
          pertemuanKe={showForm.pertemuanKe}
          santriList={santriList}
          onClose={() => setShowForm(null)}
          onSuccess={onRefresh}
        />
      )}
    </div>
  )
}

// ─── Tab 3: Nilai Sumatif ─────────────────────────────────────────────────────
function TabNilaiSumatif({ pengampuList, santriPerKelas, semesterId }: {
  pengampuList: Pengampu[]; santriPerKelas: Record<number, Santri[]>; semesterId: number | null
}) {
  const [selectedPengampuId, setSelectedPengampuId] = useState<number | null>(pengampuList[0]?.id || null)
  const [activeSumatif, setActiveSumatif] = useState(1)
  const [localNilai, setLocalNilai] = useState<Record<string, string>>({})
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())

  const pengampu = pengampuList.find(p => p.id === selectedPengampuId)
  const santriList = pengampu ? (santriPerKelas[pengampu.kelasFormalId] || []) : []
  const kkm = pengampu?.kkm || 70

  if (!semesterId) return (
    <div className="text-center py-16 text-slate-400">
      <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
      <p>Pilih semester aktif terlebih dahulu melalui filter di header.</p>
    </div>
  )

  const getNilaiSumatif = (santriId: number, sumatifKe: number): NilaiSumatif | undefined =>
    pengampu?.nilaiSumatif.find(n => n.santriId === santriId && n.sumatifKe === sumatifKe)

  const getLocalVal = (key: string, fallback: number | null | undefined): string =>
    localNilai[key] !== undefined ? localNilai[key] : (fallback?.toString() ?? "")

  const handleSave = async (santriId: number, sumatifKe: number) => {
    if (!pengampu || !semesterId) return
    const keyK = `${santriId}-${sumatifKe}-k`
    const keyT = `${santriId}-${sumatifKe}-t`
    const existing = getNilaiSumatif(santriId, sumatifKe)
    const kurikuler = parseFloat(getLocalVal(keyK, existing?.nilaiKurikuler))
    const tes = parseFloat(getLocalVal(keyT, existing?.nilaiTesSumatif))
    const saveKey = `${santriId}-${sumatifKe}`
    setSavingKey(saveKey)
    const res = await simpanNilaiSumatif(
      pengampu.id, santriId, semesterId, sumatifKe,
      isNaN(kurikuler) ? null : kurikuler,
      isNaN(tes) ? null : tes
    )
    setSavingKey(null)
    if (res.success) setSavedKeys(prev => new Set([...prev, saveKey]))
    else alert("Gagal: " + res.error)
  }

  return (
    <div className="space-y-4">
      {/* Pilih Mapel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <label className="text-sm font-semibold text-slate-600 block mb-2">Pilih Mata Pelajaran / Kelas</label>
        <div className="flex flex-wrap gap-2">
          {pengampuList.map(p => (
            <button key={p.id} onClick={() => setSelectedPengampuId(p.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition border ${selectedPengampuId === p.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}>
              {p.mataPelajaran.nama} – {p.kelasFormal.namaKelas}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Sumatif */}
      <div className="flex gap-2">
        {[1, 2, 3].map(s => (
          <button key={s} onClick={() => setActiveSumatif(s)}
            className={`px-5 py-2 rounded-xl font-semibold text-sm transition border ${activeSumatif === s ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}>
            Sumatif {s}
          </button>
        ))}
      </div>

      {/* Tabel Nilai */}
      {pengampu && santriList.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="font-semibold text-slate-700 text-sm">KKM: <span className="text-indigo-600">{kkm}</span></span>
            <span className="text-xs text-slate-500">Formula: Kehadiran(60%) + Kurikuler(20%) + Tes(20%)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-slate-600 font-semibold w-8">No</th>
                  <th className="text-left px-4 py-3 text-slate-600 font-semibold">Nama Santri</th>
                  <th className="text-center px-3 py-3 text-slate-600 font-semibold">Kehadiran<br /><span className="text-xs font-normal text-slate-400">(auto)</span></th>
                  <th className="text-center px-3 py-3 text-slate-600 font-semibold">Kurikuler<br /><span className="text-xs font-normal text-slate-400">(input)</span></th>
                  <th className="text-center px-3 py-3 text-slate-600 font-semibold">Tes Sumatif<br /><span className="text-xs font-normal text-slate-400">(input)</span></th>
                  <th className="text-center px-3 py-3 text-slate-600 font-semibold">Rata-rata</th>
                  <th className="text-center px-3 py-3 text-slate-600 font-semibold w-20">Simpan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {santriList.map((s, i) => {
                  const existing = getNilaiSumatif(s.id, activeSumatif)
                  const keyadiranVal = hitungNilaiKehadiran(pengampu.jurnalMengajar, s.id, activeSumatif)
                  const keyK = `${s.id}-${activeSumatif}-k`
                  const keyT = `${s.id}-${activeSumatif}-t`
                  const kurikulerStr = getLocalVal(keyK, existing?.nilaiKurikuler)
                  const tesStr = getLocalVal(keyT, existing?.nilaiTesSumatif)
                  const kurikulerNum = parseFloat(kurikulerStr)
                  const tesNum = parseFloat(tesStr)
                  const rata = hitungNilaiSumatifRata(keyadiranVal, isNaN(kurikulerNum) ? null : kurikulerNum, isNaN(tesNum) ? null : tesNum)
                  const saveKey = `${s.id}-${activeSumatif}`
                  const isSaving = savingKey === saveKey
                  const isSaved = savedKeys.has(saveKey)

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-2.5 text-slate-500">{i + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-800">{s.namaLengkap}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`font-semibold ${keyadiranVal !== null ? "text-slate-800" : "text-slate-300"}`}>
                          {keyadiranVal !== null ? keyadiranVal.toFixed(1) : "–"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <input type="number" min={0} max={100}
                          value={kurikulerStr}
                          onChange={e => setLocalNilai(prev => ({ ...prev, [keyK]: e.target.value }))}
                          className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          placeholder="–" />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <input type="number" min={0} max={100}
                          value={tesStr}
                          onChange={e => setLocalNilai(prev => ({ ...prev, [keyT]: e.target.value }))}
                          className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          placeholder="–" />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`font-bold text-base ${rata === null ? "text-slate-300" : rata >= kkm ? "text-emerald-600" : "text-red-500"}`}>
                          {rata !== null ? rata.toFixed(1) : "–"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button onClick={() => handleSave(s.id, activeSumatif)} disabled={isSaving}
                          className={`p-1.5 rounded-lg transition ${isSaved ? "text-emerald-600 hover:bg-emerald-50" : "text-indigo-600 hover:bg-indigo-50"}`}>
                          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : isSaved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                        </button>
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

// ─── Tab 4: Nilai Akhir & PAS ─────────────────────────────────────────────────
function TabNilaiAkhir({ pengampuList, santriPerKelas, semesterId }: {
  pengampuList: Pengampu[]; santriPerKelas: Record<number, Santri[]>; semesterId: number | null
}) {
  const [selectedPengampuId, setSelectedPengampuId] = useState<number | null>(pengampuList[0]?.id || null)
  const [localPAS, setLocalPAS] = useState<Record<number, string>>({})
  const [savingId, setSavingId] = useState<number | null>(null)
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set())

  const pengampu = pengampuList.find(p => p.id === selectedPengampuId)
  const santriList = pengampu ? (santriPerKelas[pengampu.kelasFormalId] || []) : []
  const kkm = pengampu?.kkm || 70

  if (!semesterId) return (
    <div className="text-center py-16 text-slate-400">
      <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
      <p>Pilih semester aktif terlebih dahulu.</p>
    </div>
  )

  const getRataSumatif = (santriId: number): number | null => {
    if (!pengampu) return null
    const nilai = [1, 2, 3].map(s => {
      const ns = pengampu.nilaiSumatif.find(n => n.santriId === santriId && n.sumatifKe === s)
      const kehadiran = hitungNilaiKehadiran(pengampu.jurnalMengajar, santriId, s)
      return hitungNilaiSumatifRata(kehadiran, ns?.nilaiKurikuler ?? null, ns?.nilaiTesSumatif ?? null)
    })
    const valid = nilai.filter(v => v !== null) as number[]
    if (valid.length === 0) return null
    return valid.reduce((a, b) => a + b, 0) / valid.length
  }

  const getPASNilai = (santriId: number): number | null => {
    if (localPAS[santriId] !== undefined) return parseFloat(localPAS[santriId]) || null
    return pengampu?.nilaiPAS.find(n => n.santriId === santriId)?.nilai ?? null
  }

  const getNilaiAkhir = (rataSumatif: number | null, pas: number | null): number | null => {
    if (rataSumatif === null && pas === null) return null
    return ((rataSumatif ?? 0) * 0.6) + ((pas ?? 0) * 0.4)
  }

  const handleSavePAS = async (santriId: number) => {
    if (!pengampu || !semesterId) return
    const nilaiStr = localPAS[santriId]
    const nilai = nilaiStr !== undefined ? parseFloat(nilaiStr) : (pengampu.nilaiPAS.find(n => n.santriId === santriId)?.nilai ?? null)
    setSavingId(santriId)
    const res = await simpanNilaiPAS(pengampu.id, santriId, semesterId, isNaN(nilai as number) ? null : nilai)
    setSavingId(null)
    if (res.success) setSavedIds(prev => new Set([...prev, santriId]))
    else alert("Gagal: " + res.error)
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <label className="text-sm font-semibold text-slate-600 block mb-2">Pilih Mata Pelajaran / Kelas</label>
        <div className="flex flex-wrap gap-2">
          {pengampuList.map(p => (
            <button key={p.id} onClick={() => setSelectedPengampuId(p.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition border ${selectedPengampuId === p.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}>
              {p.mataPelajaran.nama} – {p.kelasFormal.namaKelas}
            </button>
          ))}
        </div>
      </div>

      {pengampu && santriList.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
            <span className="text-xs text-slate-500">Formula: <strong>Nilai Akhir = (Rata Sumatif × 60%) + (PAS × 40%)</strong> · KKM: <strong className="text-indigo-600">{kkm}</strong></span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-center">
                  <th className="text-left px-4 py-3 text-slate-600 font-semibold">Nama Santri</th>
                  <th className="px-3 py-3 text-slate-600 font-semibold">S1</th>
                  <th className="px-3 py-3 text-slate-600 font-semibold">S2</th>
                  <th className="px-3 py-3 text-slate-600 font-semibold">S3</th>
                  <th className="px-3 py-3 text-slate-600 font-semibold">Rata<br/>Sumatif</th>
                  <th className="px-3 py-3 text-slate-600 font-semibold">PAS<br/><span className="text-xs font-normal">(input)</span></th>
                  <th className="px-3 py-3 text-slate-600 font-semibold bg-amber-50">Nilai<br/>Akhir</th>
                  <th className="px-3 py-3 text-slate-600 font-semibold">Status</th>
                  <th className="px-3 py-3 text-slate-600 font-semibold w-16">Simpan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {santriList.map((s) => {
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
                  const rataSumatif = getRataSumatif(s.id)
                  const pas = getPASNilai(s.id)
                  const nilaiAkhir = getNilaiAkhir(rataSumatif, pas)
                  const lulus = nilaiAkhir !== null && nilaiAkhir >= kkm
                  const isSaving = savingId === s.id
                  const isSaved = savedIds.has(s.id)

                  const fmt = (v: number | null) => v !== null ? v.toFixed(1) : "–"

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-2.5 font-medium text-slate-800">{s.namaLengkap}</td>
                      <td className="px-3 py-2.5 text-center text-slate-600">{fmt(s1)}</td>
                      <td className="px-3 py-2.5 text-center text-slate-600">{fmt(s2)}</td>
                      <td className="px-3 py-2.5 text-center text-slate-600">{fmt(s3)}</td>
                      <td className="px-3 py-2.5 text-center font-semibold text-slate-800">{fmt(rataSumatif)}</td>
                      <td className="px-3 py-2.5 text-center">
                        <input type="number" min={0} max={100}
                          value={localPAS[s.id] ?? (pengampu.nilaiPAS.find(n => n.santriId === s.id)?.nilai?.toString() ?? "")}
                          onChange={e => setLocalPAS(prev => ({ ...prev, [s.id]: e.target.value }))}
                          className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-center focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="–" />
                      </td>
                      <td className="px-3 py-2.5 text-center bg-amber-50">
                        <span className={`font-bold text-base ${nilaiAkhir === null ? "text-slate-300" : lulus ? "text-emerald-600" : "text-red-500"}`}>
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
                      <td className="px-3 py-2.5 text-center">
                        <button onClick={() => handleSavePAS(s.id)} disabled={isSaving}
                          className={`p-1.5 rounded-lg transition ${isSaved ? "text-emerald-600 hover:bg-emerald-50" : "text-indigo-600 hover:bg-indigo-50"}`}>
                          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : isSaved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                        </button>
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

// ─── Main Hub ─────────────────────────────────────────────────────────────────
export default function AbsensiGuruHub({ existingAbsensi, pengampuList, santriPerKelas, semesterId, semesterNama }: {
  existingAbsensi: any
  pengampuList: Pengampu[]
  santriPerKelas: Record<number, Santri[]>
  semesterId: number | null
  semesterNama: string
}) {
  const [activeTab, setActiveTab] = useState<"kehadiran" | "pertemuan" | "nilai-sumatif" | "nilai-akhir">("kehadiran")
  const [refreshKey, setRefreshKey] = useState(0)

  const tabs = [
    { id: "kehadiran" as const, label: "Kehadiran Guru", icon: CheckSquare },
    { id: "pertemuan" as const, label: "Pertemuan & Jurnal", icon: BookOpen },
    { id: "nilai-sumatif" as const, label: "Nilai Sumatif", icon: ClipboardList },
    { id: "nilai-akhir" as const, label: "Nilai Akhir & PAS", icon: GraduationCap },
  ]

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-indigo-600" /> Absensi & Penilaian
          </h1>
          {semesterNama && (
            <p className="text-sm text-slate-500 mt-1">Semester: <span className="font-semibold text-indigo-600">{semesterNama}</span></p>
          )}
        </div>
        {pengampuList.length > 0 && (
          <div className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full font-semibold">
            {pengampuList.length} mata pelajaran diampu
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-1 flex overflow-x-auto gap-1">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${activeTab === tab.id ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
            >
              <Icon className="h-4 w-4" /> {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div key={refreshKey}>
        {activeTab === "kehadiran" && <TabKehadiranGuru existingAbsensi={existingAbsensi} />}
        {activeTab === "pertemuan" && (
          <TabPertemuan
            pengampuList={pengampuList}
            santriPerKelas={santriPerKelas}
            onRefresh={() => setRefreshKey(k => k + 1)}
          />
        )}
        {activeTab === "nilai-sumatif" && (
          <TabNilaiSumatif
            pengampuList={pengampuList}
            santriPerKelas={santriPerKelas}
            semesterId={semesterId}
          />
        )}
        {activeTab === "nilai-akhir" && (
          <TabNilaiAkhir
            pengampuList={pengampuList}
            santriPerKelas={santriPerKelas}
            semesterId={semesterId}
          />
        )}
      </div>
    </div>
  )
}
