"use client"

import { useState } from "react"
import { Search, Send, FileEdit, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"
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
import { transferAlumniToJenjang, updateKeteranganLulus } from "./actions"

type AlumniType = {
  id: number
  nisn: string
  namaLengkap: string
  statusMukim: boolean
  keteranganLulus: string | null
}

type JenjangType = {
  id: number
  nama: string
}

export function AlumniClient({ 
  initialData, 
  jenjangList, 
  isMA 
}: { 
  initialData: AlumniType[]
  jenjangList: JenjangType[]
  isMA: boolean 
}) {
  const [data, setData] = useState<AlumniType[]>(initialData)
  const [search, setSearch] = useState("")
  
  const [tableSelectedIds, setTableSelectedIds] = useState<number[]>([])
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [targetJenjangId, setTargetJenjangId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Edit Keterangan state (untuk MA)
  const [editKeteranganId, setEditKeteranganId] = useState<number | null>(null)
  const [keteranganText, setKeteranganText] = useState("")

  const filteredData = data.filter((item) =>
    item.namaLengkap.toLowerCase().includes(search.toLowerCase()) ||
    item.nisn.toLowerCase().includes(search.toLowerCase())
  )

  const toggleTableSelection = (id: number) => {
    setTableSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleAllTableSelection = () => {
    if (tableSelectedIds.length === filteredData.length && filteredData.length > 0) {
      setTableSelectedIds([])
    } else {
      setTableSelectedIds(filteredData.map(a => a.id))
    }
  }

  const handleTransfer = async () => {
    if (tableSelectedIds.length === 0) return
    if (!targetJenjangId) {
      alert("Pilih jenjang tujuan terlebih dahulu.")
      return
    }

    if (!confirm(`Lanjutkan ${tableSelectedIds.length} alumni terpilih ke jenjang tujuan? Data akan disalin.`)) return

    setIsSubmitting(true)
    try {
      const res = await transferAlumniToJenjang(tableSelectedIds, targetJenjangId)
      if (res.success) {
        alert("Berhasil menduplikasi alumni ke jenjang tujuan!")
        setTableSelectedIds([])
        setIsTransferDialogOpen(false)
      } else {
        alert(res.error)
      }
    } catch (error) {
      alert("Terjadi kesalahan")
    } finally {
      setIsSubmitting(false)
    }
  }

  const saveKeterangan = async (id: number) => {
    const res = await updateKeteranganLulus(id, keteranganText)
    if (res.success) {
      setData(data.map(item => item.id === id ? { ...item, keteranganLulus: keteranganText } : item))
      setEditKeteranganId(null)
    } else {
      alert(res.error || "Gagal menyimpan keterangan")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Alumni</h1>
        <p className="text-muted-foreground mt-1">
          {isMA 
            ? "Kelola alumni jenjang akhir dan rekam jejak lulusan (Kuliah/Kerja)."
            : "Kelola alumni dan teruskan pendaftaran mereka ke jenjang berikutnya."
          }
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari NISN atau nama alumni..."
              className="pl-9 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          {!isMA && tableSelectedIds.length > 0 && (
            <Button 
              onClick={() => setIsTransferDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Send className="mr-2 h-4 w-4" /> Lanjutkan ke Jenjang... ({tableSelectedIds.length})
            </Button>
          )}
        </div>

        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  {!isMA && (
                    <TableHead className="w-[50px] text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300"
                        checked={filteredData.length > 0 && tableSelectedIds.length === filteredData.length}
                        onChange={toggleAllTableSelection}
                      />
                    </TableHead>
                  )}
                  <TableHead className="w-[80px]">No</TableHead>
                  <TableHead>NISN</TableHead>
                  <TableHead>Nama Alumni</TableHead>
                  <TableHead className="text-center">Status Mukim</TableHead>
                  {isMA && (
                    <TableHead>Keterangan Lulusan (Kuliah/Kerja)</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((item, index) => (
                    <TableRow key={item.id} className={tableSelectedIds.includes(item.id) ? "bg-slate-50" : ""}>
                      {!isMA && (
                        <TableCell className="text-center">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-gray-300"
                            checked={tableSelectedIds.includes(item.id)}
                            onChange={() => toggleTableSelection(item.id)}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="text-slate-500">{item.nisn}</TableCell>
                      <TableCell className="font-semibold text-slate-900">{item.namaLengkap}</TableCell>
                      <TableCell className="text-center">
                        {item.statusMukim ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 shadow-none font-medium">Mukim</Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 shadow-none font-medium text-xs">Tidak</Badge>
                        )}
                      </TableCell>
                      
                      {isMA && (
                        <TableCell>
                          {editKeteranganId === item.id ? (
                            <div className="flex items-center gap-2">
                              <Input 
                                value={keteranganText} 
                                onChange={(e) => setKeteranganText(e.target.value)} 
                                placeholder="Contoh: Kuliah di UIN, Bekerja di ..." 
                                className="h-8 text-sm"
                                autoFocus
                              />
                              <Button size="sm" variant="ghost" onClick={() => saveKeterangan(item.id)} className="h-8 w-8 p-0 text-emerald-600">
                                <CheckCircle2 className="h-5 w-5" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between group">
                              <span className={item.keteranganLulus ? "text-slate-700" : "text-slate-400 italic"}>
                                {item.keteranganLulus || "Belum ada data"}
                              </span>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  setKeteranganText(item.keteranganLulus || "")
                                  setEditKeteranganId(item.id)
                                }}
                              >
                                <FileEdit className="h-4 w-4 text-blue-600" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isMA ? 5 : 6} className="h-32 text-center text-slate-500">
                      Tidak ada data alumni.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Dialog Transfer Jenjang */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lanjutkan Alumni ke Jenjang</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-500">
              Data <strong>{tableSelectedIds.length} alumni</strong> akan disalin dan didaftarkan sebagai santri baru (aktif) di jenjang tujuan.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pilih Jenjang Tujuan</label>
              <Select 
                value={targetJenjangId?.toString() || ""} 
                onValueChange={(val) => setTargetJenjangId(Number(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Jenjang..." />
                </SelectTrigger>
                <SelectContent>
                  {jenjangList.length > 0 ? (
                    jenjangList.map(j => (
                      <SelectItem key={j.id} value={j.id.toString()}>{j.nama}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="0" disabled>Tidak ada jenjang lain</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsTransferDialogOpen(false)}>Batal</Button>
              <Button onClick={handleTransfer} disabled={isSubmitting || !targetJenjangId} className="bg-blue-600 hover:bg-blue-700">
                {isSubmitting ? "Memproses..." : "Lanjutkan Alumni"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
