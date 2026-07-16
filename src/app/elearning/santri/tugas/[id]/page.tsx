"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { kumpulkanTugas } from "../../actions"
import Link from "next/link"
import { ArrowLeft, Upload, CheckCircle2 } from "lucide-react"

export default function PengumpulanTugasPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const tugasId = parseInt(params.id)
  
  const [fileUrl, setFileUrl] = useState("")
  const [catatan, setCatatan] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const res = await kumpulkanTugas({
      tugasId,
      fileUrl,
      catatanSantri: catatan
    })
    
    setIsSubmitting(false)
    if (res.success) {
      setSuccess(true)
    } else {
      alert("Gagal mengumpulkan: " + res.error)
    }
  }

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 p-10 rounded-2xl text-center max-w-xl mx-auto mt-10 shadow-sm">
        <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-emerald-800 mb-2">Berhasil Dikumpulkan!</h2>
        <p className="text-emerald-700">Tugas kamu telah terkirim ke ustadz/ustadzah dan menunggu penilaian.</p>
        <button 
          onClick={() => router.back()} 
          className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium transition"
        >
          Kembali
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto mt-6">
      <div className="mb-8 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100 transition">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Pengumpulan Tugas
          </h1>
          <p className="text-slate-500 mt-1">Unggah hasil jawaban atau tugas praktikmu di sini.</p>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">Link File / Jawaban Teks</label>
            <input
              type="url"
              className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition"
              placeholder="https://docs.google.com/..."
              value={fileUrl}
              onChange={e => setFileUrl(e.target.value)}
            />
            <p className="text-xs text-slate-400">Tempel link file tugas (Google Drive, Youtube, dll). Opsional jika tugas hanya butuh catatan singkat.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">
              Catatan untuk Guru <span className="text-slate-400 font-normal">(opsional)</span>
            </label>
            <textarea
              className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition"
              rows={5}
              placeholder="Tuliskan jawaban singkat atau catatan tambahan di sini..."
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || (!fileUrl && !catatan)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Upload className="h-5 w-5" />
            {isSubmitting ? "Mengumpulkan..." : "Kumpulkan Sekarang"}
          </button>
        </form>
      </div>
    </div>
  )
}
