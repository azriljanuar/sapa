"use client"

import { useState } from "react"
import { catatKehadiranGuru } from "../actions"
import { CheckSquare, CheckCircle2 } from "lucide-react"

export default function AbsensiGuruPage() {
  const [status, setStatus] = useState<"HADIR" | "IZIN" | "SAKIT" | "ALPA">("HADIR")
  const [keterangan, setKeterangan] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // We send today's date
    const today = new Date()
    
    const res = await catatKehadiranGuru(today, status, keterangan)
    setIsSubmitting(false)
    if (res.success) {
      setSuccess(true)
    } else {
      alert("Gagal menyimpan: " + res.error)
    }
  }

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 p-10 rounded-2xl text-center max-w-xl mx-auto mt-10 shadow-sm">
        <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-emerald-800 mb-2">Kehadiran Tercatat!</h2>
        <p className="text-emerald-700">Terima kasih, data kehadiran Anda hari ini telah tersimpan dalam sistem.</p>
        <button 
          onClick={() => window.location.href = "/elearning/guru"} 
          className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium transition"
        >
          Kembali ke Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto mt-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <CheckSquare className="h-6 w-6 text-indigo-600" /> Form Kehadiran Harian
        </h1>
        <p className="text-slate-500 mt-2">Silakan isi kehadiran Anda sebelum memulai kelas hari ini.</p>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 block">Status Kehadiran</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {["HADIR", "SAKIT", "IZIN", "ALPA"].map((opt) => (
                <label 
                  key={opt}
                  className={`
                    border rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all
                    ${status === opt 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600' 
                      : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-600'}
                  `}
                >
                  <input 
                    type="radio" 
                    name="status" 
                    value={opt} 
                    checked={status === opt}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="sr-only"
                  />
                  <span className="font-bold">{opt}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">
              Keterangan <span className="text-slate-400 font-normal">(opsional)</span>
            </label>
            <textarea
              className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition"
              rows={3}
              placeholder="Tambahkan catatan jika diperlukan (misal: Izin keperluan keluarga...)"
              value={keterangan}
              onChange={e => setKeterangan(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition shadow-md disabled:opacity-50"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Kehadiran"}
          </button>
        </form>
      </div>
    </div>
  )
}
