"use client"

import { useState } from "react"
import Link from "next/link"
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
import { transferAlumniToJenjang, updateKeteranganLulus, updateProfilAlumni } from "./actions"

type AlumniType = {
  id: number
  nisn: string
  namaLengkap: string
  statusMukim: boolean
  keteranganLulus: string | null
  statusLanjutan: any | null
  namaInstansi: string | null
  programStudi: string | null
  kotaDomisiliSekarang: string | null
  kontakWA: string | null
  email: string | null
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

  // Edit Profil state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedAlumni, setSelectedAlumni] = useState<AlumniType | null>(null)
  const [editForm, setEditForm] = useState<{
    statusLanjutan: string;
    namaInstansi: string;
    programStudi: string;
    kotaDomisiliSekarang: string;
    kontakWA: string;
    email: string;
  }>({
    statusLanjutan: "",
    namaInstansi: "",
    programStudi: "",
    kotaDomisiliSekarang: "",
    kontakWA: "",
    email: ""
  })
  const [isSavingProfile, setIsSavingProfile] = useState(false)

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

  const openEditDialog = (alumni: AlumniType) => {
    setSelectedAlumni(alumni)
    setEditForm({
      statusLanjutan: alumni.statusLanjutan || "",
      namaInstansi: alumni.namaInstansi || "",
      programStudi: alumni.programStudi || "",
      kotaDomisiliSekarang: alumni.kotaDomisiliSekarang || "",
      kontakWA: alumni.kontakWA || "",
      email: alumni.email || ""
    })
    setIsEditDialogOpen(true)
  }

  const handleSaveProfile = async () => {
    if (!selectedAlumni) return
    setIsSavingProfile(true)
    try {
      const res = await updateProfilAlumni(selectedAlumni.id, {
        statusLanjutan: editForm.statusLanjutan || null,
        namaInstansi: editForm.namaInstansi,
        programStudi: editForm.programStudi,
        kotaDomisiliSekarang: editForm.kotaDomisiliSekarang,
        kontakWA: editForm.kontakWA,
        email: editForm.email
      })
      if (res.success) {
        setData(data.map(item => item.id === selectedAlumni.id ? { 
          ...item, 
          statusLanjutan: editForm.statusLanjutan,
          namaInstansi: editForm.namaInstansi,
          programStudi: editForm.programStudi,
          kotaDomisiliSekarang: editForm.kotaDomisiliSekarang,
          kontakWA: editForm.kontakWA,
          email: editForm.email
        } : item))
        setIsEditDialogOpen(false)
      } else {
        alert(res.error || "Gagal menyimpan profil")
      }
    } catch (error) {
      alert("Terjadi kesalahan")
    } finally {
      setIsSavingProfile(false)
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
          <div className="flex gap-2">
            {!isMA && tableSelectedIds.length > 0 && (
              <Button 
                onClick={() => setIsTransferDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send className="mr-2 h-4 w-4" /> Lanjutkan ({tableSelectedIds.length})
              </Button>
            )}
            
            <a href="/admin-jenjang/alumni/export" target="_blank">
              <Button variant="outline" className="text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                Export Excel
              </Button>
            </a>
          </div>
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
                  <TableHead className="text-right">Aksi</TableHead>
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
                      
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin-jenjang/alumni/${item.id}`}>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 text-xs font-semibold text-slate-700 hover:text-indigo-700"
                            >
                              Detail
                            </Button>
                          </Link>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 text-xs font-semibold"
                            onClick={() => openEditDialog(item)}
                          >
                            <FileEdit className="h-4 w-4 mr-1" /> Profil
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isMA ? 6 : 6} className="h-32 text-center text-slate-500">
                      Tidak ada data alumni.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Dialog Edit Profil Alumni */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Lengkapi Profil Alumni</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status Lanjutan</label>
                <Select 
                  value={editForm.statusLanjutan} 
                  onValueChange={(val) => setEditForm(prev => ({ ...prev, statusLanjutan: val as string }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KULIAH">Kuliah / Melanjutkan Studi</SelectItem>
                    <SelectItem value="KERJA">Bekerja</SelectItem>
                    <SelectItem value="WIRAUSAHA">Wirausaha</SelectItem>
                    <SelectItem value="TIDAK_LANJUT">Tidak Melanjutkan</SelectItem>
                    <SelectItem value="LAINNYA">Lainnya / Mengabdi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Instansi / Kampus</label>
                <Input 
                  value={editForm.namaInstansi} 
                  onChange={(e) => setEditForm(prev => ({ ...prev, namaInstansi: e.target.value }))}
                  placeholder="Contoh: UI / PT Telkom"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Program Studi (Bila Kuliah)</label>
                <Input 
                  value={editForm.programStudi} 
                  onChange={(e) => setEditForm(prev => ({ ...prev, programStudi: e.target.value }))}
                  placeholder="Contoh: Teknik Informatika"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Kota Domisili Sekarang</label>
                <Input 
                  value={editForm.kotaDomisiliSekarang} 
                  onChange={(e) => setEditForm(prev => ({ ...prev, kotaDomisiliSekarang: e.target.value }))}
                  placeholder="Contoh: Jakarta Selatan"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Kontak WA</label>
                <Input 
                  value={editForm.kontakWA} 
                  onChange={(e) => setEditForm(prev => ({ ...prev, kontakWA: e.target.value }))}
                  placeholder="Contoh: 0812345678"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Alternatif</label>
                <Input 
                  value={editForm.email} 
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Contoh: email@domain.com"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Batal</Button>
              <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {isSavingProfile ? "Menyimpan..." : "Simpan Profil"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


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
                  <SelectValue placeholder="Pilih Jenjang...">
                    {(val: string) => {
                      const j = jenjangList.find(jen => jen.id.toString() === val)
                      return j ? j.nama : "Pilih Jenjang..."
                    }}
                  </SelectValue>
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
