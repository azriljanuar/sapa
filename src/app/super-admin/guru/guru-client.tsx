"use client"

import { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Pencil, Trash2, Search, Upload, FileDown, ChevronLeft, ChevronRight, KeyRound } from "lucide-react"

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
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createGuru, updateGuru, deleteGuru, bulkDeleteGuru, importGuruExcel, resetPasswordGuru } from "./actions"

const guruSchema = z.object({
  id: z.number().optional(),
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  nip: z.string().optional(),
  email: z.string().email("Format email tidak valid"),
  jenisKelamin: z.string().optional(),
  jenjangIds: z.array(z.number()).min(1, "Minimal pilih 1 jenjang"),
})

type GuruType = {
  id: number
  nama: string
  nip?: string | null
  email: string
  jenisKelamin?: string | null
  jenjangIds: number[]
  jenjangNames: string
}

type JenjangType = {
  id: number
  nama: string
}

export function GuruClient({ initialData, jenjangList }: { initialData: GuruType[], jenjangList: JenjangType[] }) {
  const [data, setData] = useState<GuruType[]>(initialData)
  
  // Pagination & Filters state
  const [searchTerm, setSearchTerm] = useState("")
  const [filterJenjang, setFilterJenjang] = useState<string>("ALL")
  const [filterGender, setFilterGender] = useState<string>("ALL")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Dialogs state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [editingData, setEditingData] = useState<GuruType | null>(null)
  
  // Form & Import state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  
  // Bulk actions state
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const form = useForm<z.infer<typeof guruSchema>>({
    resolver: zodResolver(guruSchema),
    defaultValues: {
      nama: "",
      nip: "",
      email: "",
      jenisKelamin: "",
      jenjangIds: [],
    },
  })

  // Filtering Logic
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.nip && item.nip.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.jenjangNames.toLowerCase().includes(searchTerm.toLowerCase())
                          
      const matchJenjang = filterJenjang === "ALL" ? true : item.jenjangIds.includes(Number(filterJenjang))
      const matchGender = filterGender === "ALL" ? true : item.jenisKelamin === filterGender
      
      return matchSearch && matchJenjang && matchGender
    })
  }, [data, searchTerm, filterJenjang, filterGender])

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredData.slice(start, start + itemsPerPage)
  }, [filteredData, currentPage, itemsPerPage])

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [searchTerm, filterJenjang, filterGender])

  // Select logic
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedData.map(item => item.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (checked: boolean, id: number) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} data guru secara permanen dari SELURUH sistem?`)) return
    
    setIsSubmitting(true)
    const res = await bulkDeleteGuru(selectedIds)
    if (res.success) {
      setData(data.filter((d) => !selectedIds.includes(d.id)))
      setSelectedIds([])
    } else {
      alert(res.error || "Gagal menghapus data massal")
    }
    setIsSubmitting(false)
  }

  const handleOpenDialog = (item?: GuruType) => {
    if (item) {
      setEditingData(item)
      form.reset({ 
        id: item.id, 
        nama: item.nama, 
        nip: item.nip || "", 
        email: item.email, 
        jenisKelamin: item.jenisKelamin || "",
        jenjangIds: item.jenjangIds 
      })
    } else {
      setEditingData(null)
      form.reset({ nama: "", nip: "", email: "", jenisKelamin: "", jenjangIds: [] })
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
    link.href = "/Template_Guru.xlsx"
    link.download = "Template_Guru.xlsx"
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
      
      const res = await importGuruExcel(formData)
      if (res.success) {
        alert(`Berhasil mengimpor ${res.count} data guru.`)
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

  const onSubmit = async (values: z.infer<typeof guruSchema>) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("nama", values.nama)
      if (values.nip) formData.append("nip", values.nip)
      formData.append("email", values.email)
      if (values.jenisKelamin) formData.append("jenisKelamin", values.jenisKelamin)
      values.jenjangIds.forEach(id => {
        formData.append("jenjangIds", id.toString())
      })
      
      let res
      if (editingData && values.id) {
        formData.append("id", values.id.toString())
        res = await updateGuru(formData)
      } else {
        res = await createGuru(formData)
      }
      
      if (res.success) {
        window.location.reload()
      } else if (res?.error) {
        alert(res.error)
      }
    } catch (error) {
      console.error(error)
      alert("Terjadi kesalahan!")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data guru ini secara permanen dari SELURUH sistem?")) return
    const res = await deleteGuru(id)
    if (res.success) {
      setData(data.filter((d) => d.id !== id))
      setSelectedIds(selectedIds.filter(itemId => itemId !== id))
    } else {
      alert(res.error || "Gagal menghapus data")
    }
  }

  const handleResetPassword = async (id: number, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin mereset password akun guru atas nama ${nama} menjadi "password123"?`)) return
    
    setIsSubmitting(true)
    const res = await resetPasswordGuru(id)
    if (res.success) {
      alert(`Password akun guru ${nama} berhasil direset menjadi: password123`)
    } else {
      alert(res.error || "Gagal mereset password")
    }
    setIsSubmitting(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manajemen Guru (Asatidz)</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola data seluruh guru dan penugasan jenjangnya secara terpusat.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Impor Excel
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Guru
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-lg border shadow-sm items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari NIP / Nama / Jenjang..."
            className="pl-8 w-full bg-slate-50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterJenjang} onValueChange={(val) => setFilterJenjang(val || "ALL")}>
          <SelectTrigger className="w-full sm:w-[180px] bg-slate-50">
            <SelectValue placeholder="Filter Jenjang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Jenjang</SelectItem>
            {jenjangList.map(j => (
              <SelectItem key={j.id} value={j.id.toString()}>{j.nama}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterGender} onValueChange={(val) => setFilterGender(val || "ALL")}>
          <SelectTrigger className="w-full sm:w-[160px] bg-slate-50">
            <SelectValue placeholder="Filter Jenis Kelamin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua L/P</SelectItem>
            <SelectItem value="L">Laki-laki (L)</SelectItem>
            <SelectItem value="P">Perempuan (P)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-blue-50 text-blue-800 p-3 rounded-lg border border-blue-200 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-medium">Terpilih {selectedIds.length} data guru</span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={isSubmitting}>
            <Trash2 className="mr-2 h-4 w-4" /> Hapus Terpilih
          </Button>
        </div>
      )}

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[50px] text-center">
                <Checkbox 
                  checked={paginatedData.length > 0 && selectedIds.length === paginatedData.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="w-[60px]">No</TableHead>
              <TableHead>NIP</TableHead>
              <TableHead>Nama Lengkap</TableHead>
              <TableHead>L/P</TableHead>
              <TableHead>Jenjang Penugasan</TableHead>
              <TableHead className="w-[100px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((item, index) => (
                <TableRow key={item.id} className="hover:bg-slate-50/50">
                  <TableCell className="text-center">
                    <Checkbox 
                      checked={selectedIds.includes(item.id)}
                      onCheckedChange={(checked) => handleSelectOne(checked as boolean, item.id)}
                      aria-label={`Select ${item.nama}`}
                    />
                  </TableCell>
                  <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                  <TableCell className="font-medium">{item.nip || "-"}</TableCell>
                  <TableCell>{item.nama}</TableCell>
                  <TableCell>{item.jenisKelamin || "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.jenjangNames ? item.jenjangNames.split(', ').map((jn, i) => (
                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {jn}
                        </span>
                      )) : <span className="text-xs text-muted-foreground">-</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Reset Password"
                        className="h-8 w-8 text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                        onClick={() => handleResetPassword(item.id, item.nama)}
                      >
                        <KeyRound className="h-4 w-4" />
                        <span className="sr-only">Reset Password</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit Guru"
                        className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => handleOpenDialog(item)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Hapus Guru"
                        className="h-8 w-8 text-slate-500 hover:text-destructive hover:bg-red-50"
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
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <Search className="h-8 w-8 text-slate-300 mb-2" />
                    <p>Tidak ada data guru yang ditemukan.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50">
            <div className="text-sm text-slate-500">
              Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} data
            </div>
            <div className="flex gap-1">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center px-2 text-sm font-medium">
                {currentPage} / {totalPages}
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingData ? "Edit Data Guru" : "Tambah Data Guru"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nip"
                  render={({ field }) => (
                    <FormItem className="col-span-2 sm:col-span-1">
                      <FormLabel>NIP</FormLabel>
                      <FormControl>
                        <Input placeholder="NIP Guru" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="jenisKelamin"
                  render={({ field }) => (
                    <FormItem className="col-span-2 sm:col-span-1">
                      <FormLabel>Jenis Kelamin</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih L/P" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="L">Laki-laki</SelectItem>
                          <SelectItem value="P">Perempuan</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="nama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama Lengkap Guru" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Email Guru" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="jenjangIds"
                render={() => (
                  <FormItem className="border rounded-md p-3 bg-slate-50">
                    <div className="mb-3">
                      <FormLabel className="text-base font-semibold">Jenjang Penugasan</FormLabel>
                      <div className="text-[0.8rem] text-muted-foreground leading-tight mt-1">
                        Pilih jenjang pendidikan tempat guru ini mengajar. Anda bisa memilih lebih dari satu.
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {jenjangList.map((jenjang) => (
                        <FormField
                          key={jenjang.id}
                          control={form.control}
                          name="jenjangIds"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={jenjang.id}
                                className="flex flex-row items-center space-x-2 space-y-0 p-2 border rounded bg-white hover:bg-slate-50 transition-colors"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(jenjang.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, jenjang.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== jenjang.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer w-full text-sm">
                                  {jenjang.nama}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage className="pt-2" />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2 pt-4 border-t mt-6">
                <Button variant="outline" type="button" onClick={handleCloseDialog}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : "Simpan Data Guru"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog Import */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Impor Data Guru dari Excel</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleImportSubmit} className="space-y-4 pt-2">
            <div className="space-y-3 bg-slate-50 p-4 rounded-md border">
              <label className="text-sm font-semibold">Pilih File (.xlsx atau .csv)</label>
              <Input 
                type="file" 
                accept=".xlsx,.csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setImportFile(e.target.files[0])
                  }
                }}
                required
                className="bg-white"
              />
              <div className="text-sm text-slate-600 bg-blue-50 p-3 rounded text-justify leading-relaxed">
                <p className="font-medium text-blue-900 mb-1">Format Kolom Wajib:</p>
                <ul className="list-disc list-inside space-y-1 ml-1 text-xs text-blue-800">
                  <li><strong>NIP</strong>: Nomor Induk Pegawai</li>
                  <li><strong>Nama</strong>: Nama lengkap beserta gelar</li>
                  <li><strong>Email</strong>: Email unik untuk login</li>
                  <li><strong>Jenis Kelamin</strong>: Isi dengan <strong>L</strong> atau <strong>P</strong></li>
                  <li><strong>Jenjang</strong>: Singkatan jenjang (pisahkan dengan koma jika lebih dari satu, contoh: <code className="bg-white px-1 rounded border">MTs, MA</code>)</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-between pt-4 items-center mt-2">
              <Button type="button" variant="link" onClick={handleDownloadTemplate} className="px-0 text-blue-600">
                <FileDown className="mr-2 h-4 w-4" /> Unduh Template Excel
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
