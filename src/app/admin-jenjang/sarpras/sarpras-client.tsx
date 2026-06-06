"use client"

import { useState } from "react"
import { Plus, Search, Edit2, Trash2, Box } from "lucide-react"

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
  DialogFooter,
} from "@/components/ui/dialog"
import { createSarprasJenjang, updateSarprasJenjang, deleteSarprasJenjang } from "./actions"
import { SarprasJenjang } from "@/generated/prisma/client"

export function SarprasJenjangClient({ initialData, jenjangName }: { initialData: SarprasJenjang[], jenjangName: string }) {
  const [data, setData] = useState<SarprasJenjang[]>(initialData)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingItem, setEditingItem] = useState<SarprasJenjang | null>(null)

  const filteredData = data.filter((item) => 
    item.namaBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.kategori && item.kategori.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleOpenDialog = (item?: SarprasJenjang) => {
    setEditingItem(item || null)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingItem(null)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus data sarpras ini?")) {
      const res = await deleteSarprasJenjang(id)
      if (res.success) {
        setData(data.filter((d) => d.id !== id))
      } else {
        alert(res.error)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    
    try {
      if (editingItem) {
        formData.append("id", editingItem.id.toString())
        const res = await updateSarprasJenjang(formData)
        if (res.success) {
          alert("Data berhasil diperbarui")
          window.location.reload()
        } else {
          alert(res.error)
        }
      } else {
        const res = await createSarprasJenjang(formData)
        if (res.success) {
          alert("Data berhasil ditambahkan")
          window.location.reload()
        } else {
          alert(res.error)
        }
      }
    } catch (error) {
      console.error(error)
      alert("Terjadi kesalahan")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Box className="h-6 w-6 text-blue-600" />
            Data Sarana Prasarana
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Kelola inventaris dan aset milik jenjang {jenjangName}.
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Barang
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama barang atau kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          <div className="text-sm text-slate-500">
            Total {filteredData.length} barang
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Nama Barang</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Kondisi</TableHead>
              <TableHead>Tahun</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">{item.kodeBarang || "-"}</TableCell>
                  <TableCell className="font-medium text-slate-900">{item.namaBarang}</TableCell>
                  <TableCell>{item.kategori || "-"}</TableCell>
                  <TableCell>{item.jumlah}</TableCell>
                  <TableCell>
                    <div className="text-xs space-y-1">
                      <div className="text-emerald-600">Baik: {item.kondisiBaik}</div>
                      <div className="text-red-600">Rusak: {item.kondisiRusak}</div>
                    </div>
                  </TableCell>
                  <TableCell>{item.tahunPerolehan || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(item)}
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  Tidak ada data sarpras yang ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Barang" : "Tambah Barang Baru"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nama Barang *</label>
                  <Input name="namaBarang" defaultValue={editingItem?.namaBarang} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kode Barang</label>
                  <Input name="kodeBarang" defaultValue={editingItem?.kodeBarang || ""} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kategori</label>
                  <Input name="kategori" defaultValue={editingItem?.kategori || ""} placeholder="Elektronik, Bangunan, dll" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tahun Perolehan</label>
                  <Input name="tahunPerolehan" type="number" defaultValue={editingItem?.tahunPerolehan || ""} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Total Jumlah *</label>
                  <Input name="jumlah" type="number" defaultValue={editingItem?.jumlah || 0} required min={0} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kondisi Baik</label>
                  <Input name="kondisiBaik" type="number" defaultValue={editingItem?.kondisiBaik || 0} min={0} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kondisi Rusak</label>
                  <Input name="kondisiRusak" type="number" defaultValue={editingItem?.kondisiRusak || 0} min={0} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sumber Dana</label>
                <Input name="sumberDana" defaultValue={editingItem?.sumberDana || ""} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Keterangan</label>
                <Input name="keterangan" defaultValue={editingItem?.keterangan || ""} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
