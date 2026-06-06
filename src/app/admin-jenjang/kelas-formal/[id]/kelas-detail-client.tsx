"use client"

import { useState } from "react"
import { ArrowLeft, UserPlus, Trash2, CheckCircle2, XCircle, ArrowUpRight } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { addSantriToKelas, removeSantriFromKelas } from "./actions"
import { promoteSantriBulk } from "./promotion-actions"
import { luluskanSantriBulk } from "./actions"

type KelasType = {
  id: number
  namaKelas: string
  tahunAjaranId: number
  waliKelas: { id: number, nama: string } | null
}

type SantriType = {
  id: number
  nisn: string
  namaLengkap: string
  statusMukim: boolean
}

type NextClassType = {
  id: number
  namaKelas: string
}

export function KelasDetailClient({ 
  kelas, 
  anggota, 
  availableSantri,
  canPromote,
  canGraduate,
  nextTaId,
  nextTaClasses
}: { 
  kelas: KelasType
  anggota: SantriType[]
  availableSantri: SantriType[]
  canPromote?: boolean
  canGraduate?: boolean
  nextTaId?: number | null
  nextTaClasses?: NextClassType[]
}) {
  const [dataAnggota, setDataAnggota] = useState<SantriType[]>(anggota)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPromoDialogOpen, setIsPromoDialogOpen] = useState(false)
  
  const [selectedSantriIds, setSelectedSantriIds] = useState<number[]>([])
  const [tableSelectedIds, setTableSelectedIds] = useState<number[]>([])
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [targetKelasId, setTargetKelasId] = useState<number | null>(null)

  const toggleTableSelection = (id: number) => {
    setTableSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleAllTableSelection = () => {
    if (tableSelectedIds.length === dataAnggota.length) {
      setTableSelectedIds([])
    } else {
      setTableSelectedIds(dataAnggota.map(a => a.id))
    }
  }

  const handleAddSantri = async () => {
    if (selectedSantriIds.length === 0) return

    setIsSubmitting(true)
    try {
      const res = await addSantriToKelas(kelas.id, selectedSantriIds)
      if (res.success) {
        window.location.reload()
      } else {
        alert(res.error)
      }
    } catch (error) {
      console.error(error)
      alert("Terjadi kesalahan")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemove = async (santriId: number) => {
    if (!confirm("Keluarkan santri ini dari kelas?")) return
    const res = await removeSantriFromKelas(kelas.id, santriId)
    if (res.success) {
      setDataAnggota(dataAnggota.filter(a => a.id !== santriId))
      setTableSelectedIds(tableSelectedIds.filter(id => id !== santriId))
    } else {
      alert(res.error || "Gagal mengeluarkan santri")
    }
  }

  const handleRemoveBulk = async () => {
    if (tableSelectedIds.length === 0) return
    if (!confirm(`Keluarkan ${tableSelectedIds.length} santri terpilih dari kelas ini?`)) return
    
    setIsSubmitting(true)
    try {
      const { removeSantriFromKelasBulk } = await import("./actions")
      const res = await removeSantriFromKelasBulk(kelas.id, tableSelectedIds)
      if (res.success) {
        setDataAnggota(dataAnggota.filter(a => !tableSelectedIds.includes(a.id)))
        setTableSelectedIds([])
      } else {
        alert(res.error || "Gagal mengeluarkan santri")
      }
    } catch (error) {
      alert("Terjadi kesalahan")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePromote = async () => {
    if (tableSelectedIds.length === 0) return
    if (!targetKelasId) {
      alert("Pilih kelas tujuan terlebih dahulu.")
      return
    }

    if (!confirm(`Naikkan ${tableSelectedIds.length} santri ke kelas tujuan?`)) return

    setIsSubmitting(true)
    try {
      const res = await promoteSantriBulk(tableSelectedIds, targetKelasId)
      if (res.success) {
        alert("Berhasil menaikkan kelas!")
        setTableSelectedIds([])
        setIsPromoDialogOpen(false)
      } else {
        alert(res.error)
      }
    } catch (error) {
      alert("Terjadi kesalahan")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGraduate = async () => {
    if (tableSelectedIds.length === 0) return
    if (!confirm(`Luluskan ${tableSelectedIds.length} santri terpilih? Mereka akan dipindahkan ke Data Alumni.`)) return

    setIsSubmitting(true)
    try {
      const res = await luluskanSantriBulk(kelas.id, tableSelectedIds, kelas.tahunAjaranId)
      if (res.success) {
        alert("Berhasil meluluskan santri!")
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Link 
          href="/admin-jenjang/kelas-formal" 
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar Kelas
        </Link>
        <div className="flex flex-col sm:flex-row justify-between gap-4 border-b pb-4 items-start sm:items-end">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Kelas {kelas.namaKelas}</h2>
            <p className="text-muted-foreground mt-1">
              Wali Kelas: <span className="font-semibold text-foreground">{kelas.waliKelas?.nama || "Belum Diatur"}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {tableSelectedIds.length > 0 && (
              <Button 
                variant="destructive" 
                onClick={handleRemoveBulk}
                className="bg-red-500 hover:bg-red-600 text-white"
                disabled={isSubmitting}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Keluarkan Terpilih ({tableSelectedIds.length})
              </Button>
            )}

            {canPromote !== undefined && (
              <Button 
                variant="outline" 
                onClick={() => setIsPromoDialogOpen(true)}
                disabled={!canPromote || tableSelectedIds.length === 0}
                className={canPromote && tableSelectedIds.length > 0 ? "border-emerald-500 text-emerald-600 hover:bg-emerald-50" : ""}
                title={!canPromote ? "Naik kelas hanya bisa dilakukan di Semester Genap dan jika Tahun Ajaran berikutnya sudah dibuat." : "Naik Kelas"}
              >
                <ArrowUpRight className="mr-2 h-4 w-4" /> Naik Kelas ({tableSelectedIds.length})
              </Button>
            )}

            {canGraduate !== undefined && canGraduate && tableSelectedIds.length > 0 && (
              <Button 
                variant="outline"
                onClick={handleGraduate}
                disabled={isSubmitting}
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" /> Luluskan Angkatan ({tableSelectedIds.length})
              </Button>
            )}
            
            <Button onClick={() => { setSelectedSantriIds([]); setIsDialogOpen(true); }}>
              <UserPlus className="mr-2 h-4 w-4" /> Tambah Anggota
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px] text-center">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-gray-300"
                  checked={dataAnggota.length > 0 && tableSelectedIds.length === dataAnggota.length}
                  onChange={toggleAllTableSelection}
                />
              </TableHead>
              <TableHead className="w-[80px]">No</TableHead>
              <TableHead>NISN</TableHead>
              <TableHead>Nama Santri</TableHead>
              <TableHead className="text-center">Status Mukim</TableHead>
              <TableHead className="w-[120px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataAnggota.length > 0 ? (
              dataAnggota.map((item, index) => (
                <TableRow key={item.id} className={tableSelectedIds.includes(item.id) ? "bg-slate-50" : ""}>
                  <TableCell className="text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300"
                      checked={tableSelectedIds.includes(item.id)}
                      onChange={() => toggleTableSelection(item.id)}
                    />
                  </TableCell>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium text-slate-500">{item.nisn}</TableCell>
                  <TableCell className="font-semibold text-slate-900">{item.namaLengkap}</TableCell>
                  <TableCell className="text-center">
                    {item.statusMukim ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 shadow-none font-medium">Mukim</Badge>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 shadow-none font-medium text-xs">Tidak</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemove(item.id)}
                      title="Keluarkan dari kelas"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                  Belum ada anggota kelas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog Kenaikan Kelas */}
      <Dialog open={isPromoDialogOpen} onOpenChange={setIsPromoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kenaikan Kelas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-500">
              Anda akan memindahkan <strong>{tableSelectedIds.length} santri</strong> ke kelas baru pada Tahun Ajaran berikutnya.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pilih Kelas Tujuan</label>
              <Select 
                value={targetKelasId?.toString() || ""} 
                onValueChange={(val) => setTargetKelasId(Number(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kelas..." />
                </SelectTrigger>
                <SelectContent>
                  {nextTaClasses && nextTaClasses.length > 0 ? (
                    nextTaClasses.map(k => (
                      <SelectItem key={k.id} value={k.id.toString()}>{k.namaKelas}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="0" disabled>Belum ada kelas di TA berikutnya</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsPromoDialogOpen(false)}>Batal</Button>
              <Button onClick={handlePromote} disabled={isSubmitting || !targetKelasId}>
                {isSubmitting ? "Memproses..." : "Proses Kenaikan Kelas"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Tambah Anggota */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {/* ... (sisa dialog tambah anggota sama seperti sebelumnya) */}
          <DialogHeader>
            <DialogTitle>Tambah Anggota Kelas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <p className="text-sm text-muted-foreground">
              Pilih santri yang belum memiliki kelas untuk dimasukkan ke <strong>Kelas {kelas.namaKelas}</strong>.
            </p>
            <div className="border rounded-md max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Nama Santri</TableHead>
                    <TableHead>NISN</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableSantri.length > 0 ? (
                    availableSantri.map((santri) => (
                      <TableRow key={santri.id} className="cursor-pointer" onClick={() => {
                        setSelectedSantriIds(prev => 
                          prev.includes(santri.id) ? prev.filter(x => x !== santri.id) : [...prev, santri.id]
                        )
                      }}>
                        <TableCell>
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-gray-300"
                            checked={selectedSantriIds.includes(santri.id)}
                            readOnly
                          />
                        </TableCell>
                        <TableCell className="font-medium">{santri.namaLengkap}</TableCell>
                        <TableCell className="text-muted-foreground">{santri.nisn}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                        Tidak ada santri yang tersedia.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>Batal</Button>
            <Button type="button" onClick={handleAddSantri} disabled={isSubmitting || selectedSantriIds.length === 0}>
              Tambahkan ({selectedSantriIds.length})
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
