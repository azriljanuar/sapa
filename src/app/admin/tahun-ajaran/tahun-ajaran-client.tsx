"use client"

import { useState } from "react"
import { Plus, Trash2, Copy, CheckCircle2, Circle, RefreshCw, BookOpen, Layers } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

import { createTahunAjaran, deleteTahunAjaran, copyAcademicStructureAction } from "./actions"

type SemesterType = {
  id: number
  nama: "GANJIL" | "GENAP"
  isActive: boolean
}

type TahunAjaranType = {
  id: number
  nama: string
  isActive: boolean
  jumlahKelas?: number
  jumlahPengampu?: number
  semester: SemesterType[]
}

export function TahunAjaranClient({ initialData }: { initialData: TahunAjaranType[] }) {
  const [data, setData] = useState<TahunAjaranType[]>(initialData)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // State form Tambah TA
  const [namaTA, setNamaTA] = useState("")
  const [copyStructure, setCopyStructure] = useState(true)
  const [selectedSourceTaId, setSelectedSourceTaId] = useState<number | null>(() => {
    const withData = initialData.find(d => (d.jumlahKelas || 0) > 0)
    return withData ? withData.id : (initialData[0]?.id || null)
  })

  // State dialog Salin Struktur antar TA
  const [targetTaForCopy, setTargetTaForCopy] = useState<TahunAjaranType | null>(null)
  const [sourceTaForCopy, setSourceTaForCopy] = useState<number | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!namaTA) return

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("nama", namaTA)
      formData.append("copyStructure", copyStructure ? "true" : "false")
      if (copyStructure && selectedSourceTaId) {
        formData.append("copyFromTaId", String(selectedSourceTaId))
      }
      
      const res = await createTahunAjaran(formData)
      if (res.success) {
        window.location.reload()
      } else {
        alert(res.error)
      }
    } catch (error) {
      alert("Terjadi kesalahan")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenCopyDialog = (targetItem: TahunAjaranType) => {
    setTargetTaForCopy(targetItem)
    // Cari TA sumber yang bukan targetItem dan memiliki kelas terbanyak
    const candidate = data.find(d => d.id !== targetItem.id && (d.jumlahKelas || 0) > 0) || data.find(d => d.id !== targetItem.id)
    setSourceTaForCopy(candidate ? candidate.id : null)
    setIsCopyDialogOpen(true)
  }

  const handleExecuteCopy = async () => {
    if (!targetTaForCopy || !sourceTaForCopy) return
    setIsSubmitting(true)
    try {
      const res = await copyAcademicStructureAction(sourceTaForCopy, targetTaForCopy.id)
      if (res.success) {
        alert(res.message || "Berhasil menyalin struktur akademik!")
        setIsCopyDialogOpen(false)
        window.location.reload()
      } else {
        alert(res.error || "Gagal menyalin struktur akademik")
      }
    } catch (error) {
      alert("Terjadi kesalahan saat menyalin struktur")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus Tahun Ajaran ini?")) return
    const res = await deleteTahunAjaran(id)
    if (res.success) {
      setData(data.filter(d => d.id !== id))
    } else {
      alert(res.error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Manajemen Tahun Ajaran</h2>
          <p className="text-sm text-slate-500 mt-1">
            Kelola data tahun ajaran, semester aktif, serta otomatisasi struktur kelas, guru mapel, dan jadwal pelajaran.
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-primary text-white">
          <Plus className="mr-2 h-4 w-4" /> Tambah Tahun Ajaran
        </Button>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Tahun Ajaran</TableHead>
              <TableHead>Status Akademik</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-slate-500">{item.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{item.nama}</span>
                      {item.isActive && (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          Aktif
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        <BookOpen className="w-3 h-3" />
                        {item.jumlahKelas ?? 0} Kelas
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                        <Layers className="w-3 h-3" />
                        {item.jumlahPengampu ?? 0} Guru Mapel
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-2 text-xs gap-1"
                        onClick={() => handleOpenCopyDialog(item)}
                        title="Salin kelas, wali kelas, pengampu, dan jadwal dari TA lain"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Salin Struktur</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={item.isActive}
                        className={item.isActive ? "opacity-50" : "text-destructive hover:text-destructive hover:bg-destructive/10"}
                        onClick={() => handleDelete(item.id)}
                        title={item.isActive ? "TA aktif tidak dapat dihapus" : "Hapus Tahun Ajaran"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                  Belum ada data Tahun Ajaran.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal Tambah Tahun Ajaran */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Tahun Ajaran</DialogTitle>
            <DialogDescription>
              Masukkan tahun ajaran baru dengan format YYYY/YYYY (contoh: 2027/2028).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Tahun Ajaran</label>
              <Input 
                placeholder="2027/2028" 
                value={namaTA}
                onChange={e => setNamaTA(e.target.value)}
                required
                pattern="\d{4}/\d{4}"
                title="Format harus YYYY/YYYY"
              />
            </div>

            {/* Opsi Duplikasi Struktur Otomatis */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-3">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="copyStructure"
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary"
                  checked={copyStructure}
                  onChange={e => setCopyStructure(e.target.checked)}
                />
                <label htmlFor="copyStructure" className="text-xs font-semibold text-slate-800 cursor-pointer">
                  Salin Otomatis Struktur Akademik dari TA Sebelumnya
                  <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                    Menduplikasi seluruh daftar kelas, wali kelas, penugasan guru mapel, dan jadwal pelajaran agar tidak kosong.
                  </p>
                </label>
              </div>

              {copyStructure && data.length > 0 && (
                <div className="space-y-1.5 pl-6">
                  <label className="text-xs font-medium text-slate-700">Tahun Ajaran Sumber:</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-white px-3 py-1.5 text-xs text-foreground"
                    value={selectedSourceTaId ?? ""}
                    onChange={e => setSelectedSourceTaId(Number(e.target.value))}
                  >
                    {data.map(ta => (
                      <option key={ta.id} value={ta.id}>
                        {ta.nama} ({ta.jumlahKelas ?? 0} Kelas, {ta.jumlahPengampu ?? 0} Mapel)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Menyimpan & Menyalin..." : "Simpan"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Salin Struktur Akademik Antar TA */}
      <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Copy className="h-5 w-5 text-blue-600" />
              Salin Struktur Akademik
            </DialogTitle>
            <DialogDescription>
              Salin dan sinkronkan data kelas, wali kelas, pengampu mapel, serta jadwal pelajaran ke Tahun Ajaran <strong className="text-slate-900">{targetTaForCopy?.nama}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Pilih Tahun Ajaran Sumber (Referensi):</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground"
                value={sourceTaForCopy ?? ""}
                onChange={e => setSourceTaForCopy(Number(e.target.value))}
              >
                {data
                  .filter(ta => ta.id !== targetTaForCopy?.id)
                  .map(ta => (
                    <option key={ta.id} value={ta.id}>
                      {ta.nama} ({ta.jumlahKelas ?? 0} Kelas, {ta.jumlahPengampu ?? 0} Mapel)
                    </option>
                  ))}
              </select>
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-900 space-y-1.5">
              <div className="font-semibold text-blue-800">✨ Data yang akan disinkronkan:</div>
              <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                <li>Daftar rombel <strong>Kelas Formal</strong> & <strong>Wali Kelas</strong> masing-masing.</li>
                <li>Penugasan <strong>Pengampu Mata Pelajaran</strong> (guru pengajar & KKM per kelas).</li>
                <li>Seluruh <strong>Jadwal Pelajaran</strong> untuk Semester Ganjil & Genap.</li>
              </ul>
              <p className="text-[11px] text-slate-500 pt-1 border-t border-blue-100">
                Data nilai, absensi harian, dan riwayat santri yang sudah ada tidak akan terhapus.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setIsCopyDialogOpen(false)}>
                Batal
              </Button>
              <Button 
                type="button" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSubmitting || !sourceTaForCopy}
                onClick={handleExecuteCopy}
              >
                {isSubmitting ? "Sedang Menyalin..." : "Mulai Salin Struktur"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
