"use client"

import { useRouter, useSearchParams } from "next/navigation"

type Jenjang = { id: number; nama: string; singkatan: string }
type Semester = { id: number; nama: string }

export function JadwalFilter({
  jenjangs,
  semesters,
  selectedJenjangId,
  selectedSemesterId,
}: {
  jenjangs: Jenjang[]
  semesters: Semester[]
  selectedJenjangId: number | null
  selectedSemesterId: number | null
}) {
  const router = useRouter()

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams()
    if (selectedJenjangId) params.set("jenjangId", String(selectedJenjangId))
    if (selectedSemesterId) params.set("semester", String(selectedSemesterId))
    params.set(key, value)
    router.push(`/elearning/guru/jadwal?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-slate-500 font-medium">Filter:</span>

      {/* Filter Jenjang - hanya tampil jika guru mengajar di >1 jenjang */}
      {jenjangs.length > 1 && (
        <select
          value={selectedJenjangId ?? ""}
          onChange={(e) => updateParam("jenjangId", e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
        >
          {jenjangs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.singkatan} — {j.nama}
            </option>
          ))}
        </select>
      )}

      {/* Filter Semester */}
      {semesters.length > 0 && (
        <select
          value={selectedSemesterId ?? ""}
          onChange={(e) => updateParam("semester", e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
        >
          {semesters.map((s) => (
            <option key={s.id} value={s.id}>
              Semester {s.nama}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
