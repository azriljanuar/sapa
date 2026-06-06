"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Pencil, Trash2, Search, CheckCircle2, XCircle, Upload, FileDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { createSantri, updateSantri, deleteSantri, importSantriExcel } from "./actions"

const santriSchema = z.object({
  id: z.number().optional(),
  nisn: z.string().min(5, "NISN minimal 5 karakter"),
  namaLengkap: z.string().min(2, "Nama Lengkap minimal 2 karakter"),
  statusMukim: z.boolean(),
  riwayatKesehatan: z.string().optional().nullable(),
  nik: z.string().optional().nullable(),
  tempatLahir: z.string().optional().nullable(),
  tanggalLahir: z.string().optional().nullable(),
  jenisKelamin: z.string().optional().nullable(),
  alamat: z.string().optional().nullable(),
  noTelepon: z.string().optional().nullable(),
  kebutuhanKhusus: z.string().optional().nullable(),
  disabilitas: z.string().optional().nullable(),
  noKipPip: z.string().optional().nullable(),
  namaAyah: z.string().optional().nullable(),
  namaIbu: z.string().optional().nullable(),
})

type SantriType = {
  id: number
  nisn: string
  namaLengkap: string
  statusMukim: boolean
  riwayatKesehatan: string | null
  nik?: string | null
  tempatLahir?: string | null
  tanggalLahir?: Date | null
  jenisKelamin?: string | null
  alamat?: string | null
  noTelepon?: string | null
  kebutuhanKhusus?: string | null
  disabilitas?: string | null
  noKipPip?: string | null
  namaAyah?: string | null
  namaIbu?: string | null
}

export function SantriClient({ initialData }: { initialData: SantriType[] }) {
  const [data, setData] = useState<SantriType[]>(initialData)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterMukim, setFilterMukim] = useState("all") // "all", "mukim", "tidak"
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [editingData, setEditingData] = useState<SantriType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)

  const form = useForm<z.infer<typeof santriSchema>>({
    resolver: zodResolver(santriSchema),
    defaultValues: {
      nisn: "",
      namaLengkap: "",
      statusMukim: false,
      riwayatKesehatan: "",
      nik: "",
      tempatLahir: "",
      tanggalLahir: "",
      jenisKelamin: "",
      alamat: "",
      noTelepon: "",
      kebutuhanKhusus: "",
      disabilitas: "",
      noKipPip: "",
      namaAyah: "",
      namaIbu: "",
    },
  })

  // Filter data berdasarkan search dan mukim
  const filteredData = data.filter((item) => {
    const matchSearch = item.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.nisn.toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchMukim = true
    if (filterMukim === "mukim") matchMukim = item.statusMukim === true
    else if (filterMukim === "tidak") matchMukim = item.statusMukim === false

    return matchSearch && matchMukim
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleOpenDialog = (item?: SantriType) => {
    if (item) {
      setEditingData(item)
      form.reset({
        id: item.id,
        nisn: item.nisn,
        namaLengkap: item.namaLengkap,
        statusMukim: item.statusMukim,
        riwayatKesehatan: item.riwayatKesehatan || "",
        nik: item.nik || "",
        tempatLahir: item.tempatLahir || "",
        tanggalLahir: item.tanggalLahir ? new Date(item.tanggalLahir).toISOString().split('T')[0] : "",
        jenisKelamin: item.jenisKelamin || "",
        alamat: item.alamat || "",
        noTelepon: item.noTelepon || "",
        kebutuhanKhusus: item.kebutuhanKhusus || "",
        disabilitas: item.disabilitas || "",
        noKipPip: item.noKipPip || "",
        namaAyah: item.namaAyah || "",
        namaIbu: item.namaIbu || "",
      })
    } else {
      setEditingData(null)
      form.reset({
        nisn: "",
        namaLengkap: "",
        statusMukim: false,
        riwayatKesehatan: "",
        nik: "",
        tempatLahir: "",
        tanggalLahir: "",
        jenisKelamin: "",
        alamat: "",
        noTelepon: "",
        kebutuhanKhusus: "",
        disabilitas: "",
        noKipPip: "",
        namaAyah: "",
        namaIbu: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingData(null)
    form.reset()
  }

  const handleDownloadTemplate = () => {
    const link = document.createElement("a")
    link.href = "/Template_Santri.xlsx"
    link.download = "Template_Santri.xlsx"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importFile) return

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("file", importFile)
      
      const res = await importSantriExcel(formData)
      if (res.success) {
        alert(`Berhasil mengimpor ${res.count} data santri baru (duplikat diabaikan).`)
        window.location.reload()
      } else {
        alert(res.error)
      }
    } catch (error) {
      alert("Terjadi kesalahan saat mengimpor data")
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmit = async (values: z.infer<typeof santriSchema>) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("nisn", values.nisn)
      formData.append("namaLengkap", values.namaLengkap)
      formData.append("statusMukim", values.statusMukim.toString())
      if (values.riwayatKesehatan) formData.append("riwayatKesehatan", values.riwayatKesehatan)
      if (values.nik) formData.append("nik", values.nik)
      if (values.tempatLahir) formData.append("tempatLahir", values.tempatLahir)
      if (values.tanggalLahir) formData.append("tanggalLahir", values.tanggalLahir)
      if (values.jenisKelamin) formData.append("jenisKelamin", values.jenisKelamin)
      if (values.alamat) formData.append("alamat", values.alamat)
      if (values.noTelepon) formData.append("noTelepon", values.noTelepon)
      if (values.kebutuhanKhusus) formData.append("kebutuhanKhusus", values.kebutuhanKhusus)
      if (values.disabilitas) formData.append("disabilitas", values.disabilitas)
      if (values.noKipPip) formData.append("noKipPip", values.noKipPip)
      if (values.namaAyah) formData.append("namaAyah", values.namaAyah)
      if (values.namaIbu) formData.append("namaIbu", values.namaIbu)
      
      let res
      if (editingData && values.id) {
        formData.append("id", values.id.toString())
        res = await updateSantri(formData)
        if (res.success) {
          setData(data.map((d) => (d.id === values.id ? { ...d, ...values, riwayatKesehatan: values.riwayatKesehatan || null } as any : d)))
          handleCloseDialog()
        }
      } else {
        res = await createSantri(formData)
        if (res.success) {
          window.location.reload()
        }
      }
      
      if (res?.error) {
        alert(res.error)
      }
    } catch (error) {
      console.error(error)
      alert("Terjadi kesalahan!")
    } finally {
      setIsSubmitting(false)
    }
  }

  const [tableSelectedIds, setTableSelectedIds] = useState<number[]>([])

  const toggleTableSelection = (id: number) => {
    setTableSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleAllTableSelection = () => {
    if (tableSelectedIds.length === paginatedData.length) {
      setTableSelectedIds([])
    } else {
      setTableSelectedIds(paginatedData.map(a => a.id))
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return
    const res = await deleteSantri(id)
    if (res.success) {
      setData(data.filter((d) => d.id !== id))
      setTableSelectedIds(tableSelectedIds.filter(x => x !== id))
    } else {
      alert(res.error || "Gagal menghapus data")
    }
  }

  const handleDeleteBulk = async () => {
    if (tableSelectedIds.length === 0) return
    if (!confirm(`Apakah Anda yakin ingin menghapus ${tableSelectedIds.length} data terpilih?`)) return
    
    setIsSubmitting(true)
    try {
      const { deleteSantriBulk } = await import("./actions")
      const res = await deleteSantriBulk(tableSelectedIds)
      if (res.success) {
        setData(data.filter(d => !tableSelectedIds.includes(d.id)))
        setTableSelectedIds([])
      } else {
        alert(res.error || "Gagal menghapus data")
      }
    } catch (error) {
      alert("Terjadi kesalahan")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Data Santri</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola data santri untuk jenjang ini. Menampilkan {filteredData.length} data.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {tableSelectedIds.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleDeleteBulk}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={isSubmitting}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Hapus Terpilih ({tableSelectedIds.length})
            </Button>
          )}
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            value={filterMukim}
            onChange={(e) => {
              setFilterMukim(e.target.value)
              setCurrentPage(1)
            }}
          >
            <option value="all">Semua Status Mukim</option>
            <option value="mukim">Mukim</option>
            <option value="tidak">Tidak Mukim</option>
          </select>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari NISN / Nama..."
              className="pl-8 w-full sm:w-[200px] lg:w-[250px]"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Impor Excel
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Tambah
          </Button>
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
                  checked={paginatedData.length > 0 && tableSelectedIds.length === paginatedData.length}
                  onChange={toggleAllTableSelection}
                />
              </TableHead>
              <TableHead className="w-[80px]">No</TableHead>
              <TableHead>NISN</TableHead>
              <TableHead>Nama Lengkap</TableHead>
              <TableHead className="text-center">Status Mukim</TableHead>
              <TableHead className="w-[120px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((item, index) => (
                <TableRow key={item.id} className={tableSelectedIds.includes(item.id) ? "bg-slate-50" : ""}>
                  <TableCell className="text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300"
                      checked={tableSelectedIds.includes(item.id)}
                      onChange={() => toggleTableSelection(item.id)}
                    />
                  </TableCell>
                  <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                  <TableCell className="font-medium">{item.nisn}</TableCell>
                  <TableCell>{item.namaLengkap}</TableCell>
                  <TableCell className="text-center">
                    {item.statusMukim ? (
                      <span className="inline-flex items-center gap-1 text-sm text-green-600 font-medium">
                        <CheckCircle2 className="w-4 h-4" /> Mukim
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <XCircle className="w-4 h-4" /> Tidak
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(item)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                  Tidak ada data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Sebelumnya
          </Button>
          <div className="text-sm font-medium">
            Halaman {currentPage} dari {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Berikutnya
          </Button>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingData ? "Edit Data Santri" : "Tambah Data Santri"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="max-h-[60vh] overflow-y-auto space-y-4 px-1">
                <FormField
                  control={form.control}
                  name="nisn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NISN *</FormLabel>
                      <FormControl>
                        <Input placeholder="Masukkan NISN" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="namaLengkap"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap *</FormLabel>
                      <FormControl>
                        <Input placeholder="Masukkan Nama Lengkap" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="statusMukim"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Status Mukim</FormLabel>
                        <FormDescription>
                          Aktifkan jika santri tinggal di asrama (mukim).
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Optional Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nik"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NIK</FormLabel>
                        <FormControl>
                          <Input placeholder="NIK" {...field} value={field.value || ""} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="jenisKelamin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jenis Kelamin</FormLabel>
                        <FormControl>
                          <Input placeholder="Laki-laki / Perempuan" {...field} value={field.value || ""} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tempatLahir"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tempat Lahir</FormLabel>
                        <FormControl>
                          <Input placeholder="Tempat Lahir" {...field} value={field.value || ""} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tanggalLahir"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Lahir</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="noTelepon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>No Telepon</FormLabel>
                        <FormControl>
                          <Input placeholder="08xxx" {...field} value={field.value || ""} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="noKipPip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>No KIP / PIP</FormLabel>
                        <FormControl>
                          <Input placeholder="Nomor KIP/PIP" {...field} value={field.value || ""} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="alamat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat Lengkap</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Alamat..." className="resize-none" {...field} value={field.value || ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="namaAyah"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Ayah</FormLabel>
                        <FormControl>
                          <Input placeholder="Nama Ayah Kandung" {...field} value={field.value || ""} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="namaIbu"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Ibu</FormLabel>
                        <FormControl>
                          <Input placeholder="Nama Ibu Kandung" {...field} value={field.value || ""} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="kebutuhanKhusus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kebutuhan Khusus</FormLabel>
                      <FormControl>
                        <Input placeholder="Kebutuhan khusus (jika ada)" {...field} value={field.value || ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="disabilitas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disabilitas</FormLabel>
                      <FormControl>
                        <Input placeholder="Disabilitas (jika ada)" {...field} value={field.value || ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="riwayatKesehatan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Riwayat Kesehatan</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Masukkan riwayat kesehatan atau alergi (opsional)" 
                          className="resize-none h-24"
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" type="button" onClick={handleCloseDialog}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Impor Data Santri dari Excel</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleImportSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pilih File (.xlsx atau .csv)</label>
              <Input 
                type="file" 
                accept=".xlsx,.csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setImportFile(e.target.files[0])
                  }
                }}
                required
              />
              <div className="text-xs text-muted-foreground space-y-1 bg-blue-50/50 p-3 rounded-md border border-blue-100">
                <p>
                  <strong>✨ Auto-Mapping Aktif:</strong> Sistem kini otomatis mendeteksi struktur kolom. Anda dapat mengunggah file template maupun file <strong>Export Asli dari EMIS atau Dapodik</strong> secara langsung tanpa perlu mengubah <i>header</i>.
                </p>
                <p>
                  Data yang akan dibaca: NISN, Nama, NIK, TTL, Jenis Kelamin, Orang Tua, dan Kelas. Status Mukim akan disetel 'Tidak' secara default.
                </p>
              </div>
            </div>
            <div className="flex justify-between pt-4 items-center border-t border-slate-100">
              <Button type="button" variant="link" onClick={handleDownloadTemplate} className="px-0">
                <FileDown className="mr-2 h-4 w-4" /> Unduh Template
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" type="button" onClick={() => setIsImportDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting || !importFile}>
                  {isSubmitting ? "Mengimpor..." : "Mulai Impor"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
