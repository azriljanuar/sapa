"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react"

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

import { createTahunAjaran, deleteTahunAjaran, setTahunAjaranAktif, setSemesterAktif } from "./actions"

type SemesterType = {
  id: number
  nama: "GANJIL" | "GENAP"
  isActive: boolean
}

type TahunAjaranType = {
  id: number
  nama: string
  isActive: boolean
  semester: SemesterType[]
}

export function TahunAjaranClient({ initialData }: { initialData: TahunAjaranType[] }) {
  const [data, setData] = useState<TahunAjaranType[]>(initialData)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [namaTA, setNamaTA] = useState("")

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!namaTA) return

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("nama", namaTA)
      
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

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus Tahun Ajaran ini?")) return
    const res = await deleteTahunAjaran(id)
    if (res.success) {
      setData(data.filter(d => d.id !== id))
    } else {
      alert(res.error)
    }
  }

  const handleSetAktifTA = async (id: number) => {
    if (!confirm("Aktifkan Tahun Ajaran ini? Ini akan menonaktifkan tahun ajaran lainnya.")) return
    const res = await setTahunAjaranAktif(id)
    if (res.success) {
      window.location.reload()
    } else {
      alert(res.error)
    }
  }

  const handleSetAktifSemester = async (id: number) => {
    const res = await setSemesterAktif(id)
    if (res.success) {
      window.location.reload()
    } else {
      alert(res.error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Manajemen Tahun Ajaran</h2>
          <p className="text-sm text-slate-500 mt-1">Kelola data tahun ajaran dan semester aktif.</p>
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
              <TableHead>Status TA</TableHead>
              <TableHead>Semester Ganjil</TableHead>
              <TableHead>Semester Genap</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-slate-500">{item.id}</TableCell>
                  <TableCell className="font-bold text-slate-900">{item.nama}</TableCell>
                  <TableCell>
                    {item.isActive ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 shadow-none">Aktif</Badge>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => handleSetAktifTA(item.id)} className="h-7 text-xs">
                        Set Aktif
                      </Button>
                    )}
                  </TableCell>
                  {/* Semester Ganjil */}
                  <TableCell>
                    {(() => {
                      const sem = item.semester.find(s => s.nama === "GANJIL")
                      if (!sem) return "-"
                      return sem.isActive ? (
                        <div className="flex items-center text-emerald-600 text-sm font-medium">
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Aktif
                        </div>
                      ) : (
                        <button onClick={() => handleSetAktifSemester(sem.id)} className="flex items-center text-slate-400 hover:text-slate-600 text-sm transition-colors">
                          <Circle className="h-4 w-4 mr-1" /> Set Aktif
                        </button>
                      )
                    })()}
                  </TableCell>
                  {/* Semester Genap */}
                  <TableCell>
                    {(() => {
                      const sem = item.semester.find(s => s.nama === "GENAP")
                      if (!sem) return "-"
                      return sem.isActive ? (
                        <div className="flex items-center text-emerald-600 text-sm font-medium">
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Aktif
                        </div>
                      ) : (
                        <button onClick={() => handleSetAktifSemester(sem.id)} className="flex items-center text-slate-400 hover:text-slate-600 text-sm transition-colors">
                          <Circle className="h-4 w-4 mr-1" /> Set Aktif
                        </button>
                      )
                    })()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={item.isActive}
                      className={item.isActive ? "opacity-50" : "text-destructive hover:text-destructive hover:bg-destructive/10"}
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                  Belum ada data Tahun Ajaran.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Tahun Ajaran</DialogTitle>
            <DialogDescription>
              Masukkan tahun ajaran baru dengan format YYYY/YYYY.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Tahun Ajaran</label>
              <Input 
                placeholder="2024/2025" 
                value={namaTA}
                onChange={e => setNamaTA(e.target.value)}
                required
                pattern="\d{4}/\d{4}"
                title="Format harus YYYY/YYYY"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Menyimpan..." : "Simpan"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
