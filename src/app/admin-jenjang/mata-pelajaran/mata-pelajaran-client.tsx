"use client"

import { useState } from "react"
import { Plus, Trash2, Edit } from "lucide-react"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
} from "@/components/ui/dialog"

import { createMataPelajaran, updateMataPelajaran, deleteMataPelajaran } from "./actions"

type MataPelajaranType = {
  id: number
  nama: string
  kode: string | null
  kkm: number | null
}

export function MataPelajaranClient({ initialData }: { initialData: MataPelajaranType[] }) {
  const [data, setData] = useState<MataPelajaranType[]>(initialData)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // State for form
  const [editId, setEditId] = useState<number | null>(null)
  const [nama, setNama] = useState("")
  const [kode, setKode] = useState("")
  const [kkm, setKkm] = useState("")

  const openAddDialog = () => {
    setEditId(null)
    setNama("")
    setKode("")
    setKkm("")
    setIsDialogOpen(true)
  }

  const openEditDialog = (item: MataPelajaranType) => {
    setEditId(item.id)
    setNama(item.nama)
    setKode(item.kode || "")
    setKkm(item.kkm ? item.kkm.toString() : "")
    setIsDialogOpen(true)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nama) return

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("nama", nama)
      if (kode) formData.append("kode", kode)
      if (kkm) formData.append("kkm", kkm)
      
      if (editId) {
        const res = await updateMataPelajaran(editId, formData)
        if (res.success) {
          window.location.reload()
        } else {
          alert(res.error)
        }
      } else {
        const res = await createMataPelajaran(formData)
        if (res.success) {
          window.location.reload()
        } else {
          alert(res.error)
        }
      }
    } catch (error) {
      alert("Terjadi kesalahan")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus mata pelajaran ini?")) return
    const res = await deleteMataPelajaran(id)
    if (res.success) {
      setData(data.filter(d => d.id !== id))
    } else {
      alert(res.error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800">Daftar Mata Pelajaran</h2>
        <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Data
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Kode</TableHead>
              <TableHead>Mata Pelajaran</TableHead>
              <TableHead>KKM</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-slate-500">{item.id}</TableCell>
                  <TableCell>
                    {item.kode ? (
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-mono">{item.kode}</span>
                    ) : "-"}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900">{item.nama}</TableCell>
                  <TableCell>{item.kkm || "-"}</TableCell>
                  <TableCell className="text-right space-x-2 whitespace-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `/admin-jenjang/mata-pelajaran/${item.id}`}
                      className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      Atur Kelas & Guru
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(item)}
                      className="text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                      className="text-slate-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                  Belum ada data mata pelajaran.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Mata Pelajaran</Label>
              <Input
                id="nama"
                placeholder="Contoh: Matematika"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kode">Kode (Opsional)</Label>
                <Input
                  id="kode"
                  placeholder="Contoh: MTK"
                  value={kode}
                  onChange={(e) => setKode(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kkm">KKM (Opsional)</Label>
                <Input
                  id="kkm"
                  type="number"
                  placeholder="Contoh: 75"
                  value={kkm}
                  onChange={(e) => setKkm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
