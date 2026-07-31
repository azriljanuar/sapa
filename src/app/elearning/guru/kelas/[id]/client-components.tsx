"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { StatusKehadiran, TipeMateri } from "@prisma/client"
import { createJurnalMengajar, createMateriBelajar, createTugas } from "../../actions"

export function JurnalDialog({ pengampuId, anggota }: { pengampuId: number, anggota: any[] }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])
  const [materi, setMateri] = useState("")
  const [catatan, setCatatan] = useState("")
  const [absensi, setAbsensi] = useState<{santriId: number, status: StatusKehadiran}[]>(
    anggota.map(a => ({ santriId: a.santriId, status: "HADIR" }))
  )

  const handleAbsensiChange = (santriId: number, status: StatusKehadiran) => {
    setAbsensi(prev => prev.map(a => a.santriId === santriId ? { ...a, status } : a))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await createJurnalMengajar(pengampuId, new Date(tanggal), materi, 1, 1, catatan, absensi)
      if (res.success) {
        setOpen(false)
        setMateri("")
        setCatatan("")
      } else {
        alert(res.error)
      }
    } catch (err) {
      alert("Terjadi kesalahan")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center text-sm font-medium px-4 py-2 rounded-lg">
        <Plus className="w-4 h-4 mr-1"/> Buat Jurnal Baru
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buat Jurnal Mengajar</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tanggal</label>
            <Input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Materi Pembelajaran</label>
            <Input value={materi} onChange={e => setMateri(e.target.value)} required placeholder="Contoh: Bab 1 - Pengantar" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Catatan Tambahan (Opsional)</label>
            <Textarea value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Catatan kelas..." />
          </div>
          
          <div className="pt-4 border-t border-slate-100">
            <h4 className="font-semibold text-sm mb-3">Absensi Santri</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {anggota.map(a => {
                const currentStatus = absensi.find(ab => ab.santriId === a.santriId)?.status || "HADIR"
                return (
                  <div key={a.santriId} className="flex justify-between items-center p-2 border border-slate-100 rounded-lg text-sm bg-slate-50">
                    <span className="font-medium text-slate-700">{a.santri.namaLengkap}</span>
                    <Select value={currentStatus} onValueChange={(val) => handleAbsensiChange(a.santriId, val as StatusKehadiran)}>
                      <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HADIR" className="text-emerald-600 font-medium">Hadir</SelectItem>
                        <SelectItem value="SAKIT" className="text-blue-600 font-medium">Sakit</SelectItem>
                        <SelectItem value="IZIN" className="text-yellow-600 font-medium">Izin</SelectItem>
                        <SelectItem value="ALPA" className="text-rose-600 font-medium">Alpa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Simpan Jurnal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function MateriDialog({ pengampuId }: { pengampuId: number }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [judul, setJudul] = useState("")
  const [deskripsi, setDeskripsi] = useState("")
  const [tipe, setTipe] = useState<TipeMateri>("DOKUMEN")
  const [fileUrl, setFileUrl] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await createMateriBelajar({ pengampuId, judul, deskripsi, tipe, fileUrl })
      if (res.success) {
        setOpen(false)
        setJudul("")
        setDeskripsi("")
        setFileUrl("")
      } else {
        alert(res.error)
      }
    } catch (err) {
      alert("Terjadi kesalahan")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center text-sm font-medium px-4 py-2 rounded-lg">
        <Plus className="w-4 h-4 mr-1"/> Tambah Materi
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Materi Belajar</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Judul Materi</label>
            <Input value={judul} onChange={e => setJudul(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipe Materi</label>
            <Select value={tipe} onValueChange={(val) => setTipe(val as TipeMateri)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DOKUMEN">Dokumen (PDF/Word)</SelectItem>
                <SelectItem value="VIDEO">Video Belajar</SelectItem>
                <SelectItem value="LINK">Tautan Web</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">URL File/Tautan</label>
            <Input value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="https://..." />
            <p className="text-xs text-slate-500">Saat ini hanya mendukung tautan URL (Google Drive, YouTube, dll)</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Deskripsi Singkat</label>
            <Textarea value={deskripsi} onChange={e => setDeskripsi(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Simpan Materi"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function TugasDialog({ pengampuId }: { pengampuId: number }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [judul, setJudul] = useState("")
  const [deskripsi, setDeskripsi] = useState("")
  const [tenggatWaktu, setTenggatWaktu] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await createTugas({ 
        pengampuId, 
        judul, 
        deskripsi, 
        tenggatWaktu: tenggatWaktu ? new Date(tenggatWaktu) : undefined 
      })
      if (res.success) {
        setOpen(false)
        setJudul("")
        setDeskripsi("")
        setTenggatWaktu("")
      } else {
        alert(res.error)
      }
    } catch (err) {
      alert("Terjadi kesalahan")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center text-sm font-medium px-4 py-2 rounded-lg">
        <Plus className="w-4 h-4 mr-1"/> Buat Tugas
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat Tugas Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Judul Tugas</label>
            <Input value={judul} onChange={e => setJudul(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tenggat Waktu (Opsional)</label>
            <Input type="datetime-local" value={tenggatWaktu} onChange={e => setTenggatWaktu(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Instruksi Tugas</label>
            <Textarea value={deskripsi} onChange={e => setDeskripsi(e.target.value)} required className="h-32" />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Simpan Tugas"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
