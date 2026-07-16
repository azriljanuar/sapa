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
import { createSantri, updateSantri, deleteSantri } from "./actions"
import { Checkbox } from "@/components/ui/checkbox"

const santriSchema = z.object({
  id: z.number().optional(),
  nisn: z.string().min(5, "NISN minimal 5 karakter"),
  namaLengkap: z.string().min(2, "Nama Lengkap minimal 2 karakter"),
  jenjangIds: z.array(z.number()).min(1, "Minimal pilih satu jenjang pendidikan"),
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
  jenjangNames?: string
  jenjangIds?: number[]
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
  kelasFormalName?: string | null
  kelasFormalId?: number | null
}

export function SantriClient({ initialData, jenjangList, kelasList = [] }: { initialData: SantriType[], jenjangList: any[], kelasList: any[] }) {
  const [data, setData] = useState<SantriType[]>(initialData)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterMukim, setFilterMukim] = useState("all") // "all", "mukim", "tidak"
  
  // New filters
  const [filterJenjang, setFilterJenjang] = useState<string>("all")
  const [filterKelas, setFilterKelas] = useState<string>("all")
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingData, setEditingData] = useState<SantriType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof santriSchema>>({
    resolver: zodResolver(santriSchema),
    defaultValues: {
      nisn: "",
      namaLengkap: "",
      jenjangIds: [],
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

  // Filter data berdasarkan search, mukim, jenjang, dan kelas
  const filteredData = data.filter((item) => {
    const matchSearch = item.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.nisn.toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchMukim = true
    if (filterMukim === "mukim") matchMukim = item.statusMukim === true
    else if (filterMukim === "tidak") matchMukim = item.statusMukim === false
    
    let matchJenjang = true
    if (filterJenjang !== "all") {
      matchJenjang = item.jenjangIds?.includes(Number(filterJenjang)) || false
    }
    
    let matchKelas = true
    if (filterKelas !== "all") {
      matchKelas = item.kelasFormalId === Number(filterKelas)
    }

    return matchSearch && matchMukim && matchJenjang && matchKelas
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  
  // Options untuk kelas filter, tergantung jenjang yang dipilih
  const filteredKelasList = filterJenjang === "all" 
    ? kelasList 
    : kelasList.filter(k => k.jenjangId === Number(filterJenjang))

  const handleOpenDialog = (item?: SantriType) => {
    if (item) {
      setEditingData(item)
      form.reset({
        id: item.id,
        nisn: item.nisn,
        namaLengkap: item.namaLengkap,
        jenjangIds: item.jenjangIds || [],
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
        jenjangIds: [],
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

  const onSubmit = async (values: z.infer<typeof santriSchema>) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("nisn", values.nisn)
      formData.append("namaLengkap", values.namaLengkap)
      formData.append("statusMukim", values.statusMukim.toString())
      values.jenjangIds.forEach(id => {
        formData.append("jenjangIds", id.toString())
      })
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
        res = await updateSantri(values.id, formData)
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
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background max-w-[150px]"
            value={filterJenjang}
            onChange={(e) => {
              setFilterJenjang(e.target.value)
              setFilterKelas("all") // Reset kelas saat jenjang berubah
              setCurrentPage(1)
            }}
          >
            <option value="all">Semua Jenjang</option>
            {jenjangList.map(j => (
              <option key={j.id} value={j.id.toString()}>{j.nama}</option>
            ))}
          </select>

          {/* Filter Kelas (disabled jika Semua Jenjang dipilih dan kita ingin force filter jenjang dulu, tapi biarkan saja aktif dengan opsi terfilter) */}
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background max-w-[150px]"
            value={filterKelas}
            onChange={(e) => {
              setFilterKelas(e.target.value)
              setCurrentPage(1)
            }}
            disabled={filteredKelasList.length === 0}
          >
            <option value="all">Semua Kelas</option>
            {filteredKelasList.map((k: any) => (
              <option key={k.id} value={k.id.toString()}>{k.namaKelas}</option>
            ))}
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
              <TableHead>Jenjang</TableHead>
              <TableHead>Kelas</TableHead>
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
                  <TableCell className="text-xs text-slate-600">{item.jenjangNames || "-"}</TableCell>
                  <TableCell className="text-xs font-semibold text-slate-700">{item.kelasFormalName || "-"}</TableCell>
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
                <TableCell colSpan={7} className="h-24 text-center text-slate-500">
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
                  name="jenjangIds"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base">Jenjang Pendidikan *</FormLabel>
                        <FormDescription>
                          Pilih satu atau beberapa jenjang pendidikan untuk santri ini.
                        </FormDescription>
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
                                  className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(jenjang.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), jenjang.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== jenjang.id
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="font-normal cursor-pointer">
                                      {jenjang.nama}
                                    </FormLabel>
                                  </div>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
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

    </div>
  )
}
