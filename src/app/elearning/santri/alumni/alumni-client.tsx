"use client"

import { useState } from "react"
import { GraduationCap, MapPin, Building, Phone, Mail, Edit, Printer } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { updateProfilAlumniSantri } from "./actions"

export function AlumniClient({ santri, alumniJenjangs }: { santri: any, alumniJenjangs: any[] }) {
  const [data, setData] = useState(alumniJenjangs)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedJenjang, setSelectedJenjang] = useState<any | null>(null)
  const [isSaving, setIsSaving] = useState(false)

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

  const openEditDialog = (item: any) => {
    setSelectedJenjang(item)
    setEditForm({
      statusLanjutan: item.statusLanjutan || "",
      namaInstansi: item.namaInstansi || "",
      programStudi: item.programStudi || "",
      kotaDomisiliSekarang: item.kotaDomisiliSekarang || "",
      kontakWA: item.kontakWA || "",
      email: item.email || ""
    })
    setIsEditDialogOpen(true)
  }

  const handleSave = async () => {
    if (!selectedJenjang) return
    setIsSaving(true)
    try {
      const res = await updateProfilAlumniSantri(selectedJenjang.jenjangId, {
        statusLanjutan: editForm.statusLanjutan || null,
        namaInstansi: editForm.namaInstansi,
        programStudi: editForm.programStudi,
        kotaDomisiliSekarang: editForm.kotaDomisiliSekarang,
        kontakWA: editForm.kontakWA,
        email: editForm.email
      })
      if (res.success) {
        setData(data.map(item => item.jenjangId === selectedJenjang.jenjangId ? { 
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
        alert(res.error)
      }
    } catch (error) {
      alert("Terjadi kesalahan!")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Portal Alumni</h1>
          <p className="text-slate-500 mt-1">Kelola data purna studi dan unduh dokumen kelulusan Anda.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {data.map((item) => (
          <Card key={item.jenjangId} className="overflow-hidden border-emerald-100 shadow-sm">
            <div className="h-2 w-full bg-emerald-500" />
            <CardHeader className="bg-emerald-50/50 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Alumni {item.jenjang.nama}</CardTitle>
                    <CardDescription>Status: {item.statusMukim ? "Mukim" : "Non-Mukim"}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => openEditDialog(item)}
                  >
                    <Edit className="h-4 w-4 mr-2" /> Perbarui Data
                  </Button>
                  <a href={`/elearning/santri/alumni/cetak-skl/${item.jenjangId}`} target="_blank">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                      <Printer className="h-4 w-4 mr-2" /> Cetak SKL
                    </Button>
                  </a>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Status Lanjutan</p>
                  <Badge variant="secondary" className="capitalize">
                    {item.statusLanjutan?.replace("_", " ").toLowerCase() || "Belum ada data"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1 flex items-center gap-2"><Building className="h-3.5 w-3.5"/> Instansi/Kampus</p>
                  <p className="font-medium text-slate-900">{item.namaInstansi || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Program Studi</p>
                  <p className="font-medium text-slate-900">{item.programStudi || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1 flex items-center gap-2"><MapPin className="h-3.5 w-3.5"/> Domisili Saat Ini</p>
                  <p className="font-medium text-slate-900">{item.kotaDomisiliSekarang || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1 flex items-center gap-2"><Phone className="h-3.5 w-3.5"/> Kontak WA</p>
                  <p className="font-medium text-slate-900">{item.kontakWA || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1 flex items-center gap-2"><Mail className="h-3.5 w-3.5"/> Email Alternatif</p>
                  <p className="font-medium text-slate-900">{item.email || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md md:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Perbarui Data Kelulusan</DialogTitle>
            <DialogDescription>
              Mohon lengkapi data kelanjutan studi atau aktivitas Anda saat ini.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1 space-y-2">
                <label className="text-sm font-medium">Status Lanjutan</label>
                <Select 
                  value={editForm.statusLanjutan} 
                  onValueChange={(val) => setEditForm(prev => ({ ...prev, statusLanjutan: val as string }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KULIAH">Melanjutkan Studi</SelectItem>
                    <SelectItem value="KERJA">Bekerja</SelectItem>
                    <SelectItem value="WIRAUSAHA">Wirausaha</SelectItem>
                    <SelectItem value="LAINNYA">Mengabdi di Pesantren / Lainnya</SelectItem>
                    <SelectItem value="TIDAK_LANJUT">Tidak Melanjutkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 md:col-span-1 space-y-2">
                <label className="text-sm font-medium">Nama Instansi / Kampus</label>
                <Input 
                  placeholder="Cth: UIN Sunan Kalijaga" 
                  value={editForm.namaInstansi}
                  onChange={e => setEditForm(prev => ({ ...prev, namaInstansi: e.target.value }))}
                />
              </div>
              <div className="col-span-2 md:col-span-1 space-y-2">
                <label className="text-sm font-medium">Program Studi / Pekerjaan</label>
                <Input 
                  placeholder="Cth: Teknik Informatika" 
                  value={editForm.programStudi}
                  onChange={e => setEditForm(prev => ({ ...prev, programStudi: e.target.value }))}
                />
              </div>
              <div className="col-span-2 md:col-span-1 space-y-2">
                <label className="text-sm font-medium">Kota Domisili Sekarang</label>
                <Input 
                  placeholder="Cth: Yogyakarta" 
                  value={editForm.kotaDomisiliSekarang}
                  onChange={e => setEditForm(prev => ({ ...prev, kotaDomisiliSekarang: e.target.value }))}
                />
              </div>
              <div className="col-span-2 md:col-span-1 space-y-2">
                <label className="text-sm font-medium">No WhatsApp Aktif</label>
                <Input 
                  placeholder="0812xxx" 
                  value={editForm.kontakWA}
                  onChange={e => setEditForm(prev => ({ ...prev, kontakWA: e.target.value }))}
                />
              </div>
              <div className="col-span-2 md:col-span-1 space-y-2">
                <label className="text-sm font-medium">Email Alternatif Aktif</label>
                <Input 
                  placeholder="email@contoh.com" 
                  value={editForm.email}
                  onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
              {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
