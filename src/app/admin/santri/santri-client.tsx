"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Pencil, Trash2, Search, CheckCircle2, XCircle, Upload, FileDown, ArrowRight, CreditCard, KeyRound } from "lucide-react"
import { RfidPairingModal } from "@/components/rfid/rfid-pairing-modal"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  tahunMasukId: z.coerce.number().optional().nullable(),
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
  tahunMasukId?: number | null
  statusKeluar?: string | null
  namaSekolahTujuan?: string | null
  tanggalPindah?: string | null
  alasanPindah?: string | null
  tahunLulusId?: number | null
  tahunLulusNama?: string | null
  statusLanjutan?: string | null
  namaInstansi?: string | null
  programStudi?: string | null
  rfidCardId?: string | null
  kelasId?: number | null
  namaKelas?: string | null
}

export function SantriClient({ 
  initialData, 
  tahunAjarans,
  alumniData = [],
  kelasList = []
}: { 
  initialData: SantriType[]
  tahunAjarans: { id: number, nama: string }[]
  alumniData?: SantriType[]
  kelasList?: { id: number; namaKelas: string }[]
}) {
  const [data, setData] = useState<SantriType[]>(initialData)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterKelas, setFilterKelas] = useState("all") // "all", "none", or namaKelas
  const [filterJk, setFilterJk] = useState("all") // "all", "L", "P"
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [exportKelas, setExportKelas] = useState("all")
  const [isPindahDialogOpen, setIsPindahDialogOpen] = useState(false)
  const [editingData, setEditingData] = useState<SantriType | null>(null)
  const [pindahData, setPindahData] = useState<SantriType | null>(null)
  const [rfidTarget, setRfidTarget] = useState<SantriType | null>(null)
  const [isRfidModalOpen, setIsRfidModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  
  // Tab state
  const [activeTab, setActiveTab] = useState("aktif")

  const form = useForm<z.infer<typeof santriSchema>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(santriSchema) as any,
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
      tahunMasukId: null,
    },
  })

  // Filter data (Search, Kelas, Jenis Kelamin)
  const searchFilter = (item: SantriType) => {
    const query = searchTerm.toLowerCase().trim()
    const matchSearch = !query ||
      item.namaLengkap.toLowerCase().includes(query) ||
      item.nisn.toLowerCase().includes(query)

    let matchKelas = true
    if (filterKelas === "none") {
      matchKelas = !item.namaKelas
    } else if (filterKelas !== "all") {
      matchKelas = item.namaKelas === filterKelas
    }

    let matchJk = true
    if (filterJk === "L") {
      const jk = (item.jenisKelamin || "").toLowerCase()
      matchJk = jk === "l" || jk.startsWith("laki")
    } else if (filterJk === "P") {
      const jk = (item.jenisKelamin || "").toLowerCase()
      matchJk = jk === "p" || jk.startsWith("perem")
    }

    return matchSearch && matchKelas && matchJk
  }

  const aktifData = data.filter(item => !item.statusKeluar).filter(searchFilter)
  const pindahDataFiltered = data.filter(item => item.statusKeluar).filter(searchFilter)
  const alumniDataFiltered = alumniData.filter(searchFilter)

  const currentFilteredData = 
    activeTab === "aktif" 
      ? aktifData 
      : activeTab === "pindah" 
        ? pindahDataFiltered 
        : alumniDataFiltered

  // Pagination logic
  const totalPages = Math.ceil(currentFilteredData.length / itemsPerPage)
  const paginatedData = currentFilteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

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
        tahunMasukId: item.tahunMasukId || null,
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
        tahunMasukId: null,
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingData(null)
    form.reset()
  }

  const [tableSelectedIds, setTableSelectedIds] = useState<number[]>([])

  const toggleTableSelection = (id: number) => {
    setTableSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleAllTableSelection = () => {
    if (tableSelectedIds.length === paginatedData.length && paginatedData.length > 0) {
      setTableSelectedIds([])
    } else {
      setTableSelectedIds(paginatedData.map(a => a.id))
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus santri ini?")) return
    setIsSubmitting(true)
    try {
      const res = await deleteSantri(id)
      if (res.success) {
        setData(data.filter((item) => item.id !== id))
        setTableSelectedIds(prev => prev.filter(x => x !== id))
      } else {
        alert(res.error)
      }
    } catch (error) {
      alert("Terjadi kesalahan")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteBulk = async () => {
    if (tableSelectedIds.length === 0) return
    if (!confirm(`Hapus ${tableSelectedIds.length} santri terpilih?`)) return
    
    setIsSubmitting(true)
    try {
      const { deleteSantriBulk } = await import("./actions")
      const res = await deleteSantriBulk(tableSelectedIds)
      if (res.success) {
        setData(data.filter(item => !tableSelectedIds.includes(item.id)))
        setTableSelectedIds([])
      } else {
        alert(res.error || "Gagal menghapus santri")
      }
    } catch (error) {
      alert("Terjadi kesalahan")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownloadTemplate = () => {
    const link = document.createElement("a")
    link.href = "/Template_Santri.xlsx"
    link.download = "Template_Santri.xlsx"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadExport = () => {
    const url = `/api/admin/santri/export-akun?kelas=${encodeURIComponent(exportKelas)}`
    const link = document.createElement("a")
    link.href = url
    link.download = ""
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setIsExportDialogOpen(false)
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
        alert(`Berhasil mengimpor ${res.count} data santri!`)
        setIsImportDialogOpen(false)
        setImportFile(null)
        window.location.reload()
      } else {
        alert(res.error || "Gagal mengimpor data santri")
      }
    } catch (error) {
      alert("Terjadi kesalahan saat mengimpor file")
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmit = async (values: z.infer<typeof santriSchema>) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      if (editingData?.id) formData.append("id", editingData.id.toString())
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
      if (values.tahunMasukId) formData.append("tahunMasukId", values.tahunMasukId.toString())

      if (editingData) {
        const res = await updateSantri(formData)
        if (res.success) {
          setData(
            data.map((item) =>
              item.id === editingData.id
                ? {
                    ...item,
                    nisn: values.nisn,
                    namaLengkap: values.namaLengkap,
                    statusMukim: values.statusMukim,
                    riwayatKesehatan: values.riwayatKesehatan || null,
                    nik: values.nik || null,
                    tempatLahir: values.tempatLahir || null,
                    tanggalLahir: values.tanggalLahir ? new Date(values.tanggalLahir) : null,
                    jenisKelamin: values.jenisKelamin || null,
                    alamat: values.alamat || null,
                    noTelepon: values.noTelepon || null,
                    kebutuhanKhusus: values.kebutuhanKhusus || null,
                    disabilitas: values.disabilitas || null,
                    noKipPip: values.noKipPip || null,
                    namaAyah: values.namaAyah || null,
                    namaIbu: values.namaIbu || null,
                    tahunMasukId: values.tahunMasukId || null,
                  }
                : item
            )
          )
          handleCloseDialog()
        } else {
          alert(res.error)
        }
      } else {
        const res = await createSantri(formData)
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Data Santri</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola data santri untuk jenjang ini. Menampilkan {currentFilteredData.length} data.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "aktif" && tableSelectedIds.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleDeleteBulk}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={isSubmitting}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Hapus Terpilih ({tableSelectedIds.length})
            </Button>
          )}
          {/* Filter Per Kelas */}
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background text-foreground"
            value={filterKelas}
            onChange={(e) => {
              setFilterKelas(e.target.value)
              setCurrentPage(1)
            }}
          >
            <option value="all">Semua Kelas</option>
            <option value="none">Belum Ada Kelas</option>
            {kelasList.map((k) => (
              <option key={k.id} value={k.namaKelas}>
                {k.namaKelas}
              </option>
            ))}
          </select>

          {/* Filter Jenis Kelamin */}
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background text-foreground"
            value={filterJk}
            onChange={(e) => {
              setFilterJk(e.target.value)
              setCurrentPage(1)
            }}
          >
            <option value="all">Semua Gender</option>
            <option value="L">Laki-laki (L)</option>
            <option value="P">Perempuan (P)</option>
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
          {activeTab === "aktif" && (
            <>
              <Button 
                variant="outline" 
                onClick={() => {
                  setExportKelas(filterKelas)
                  setIsExportDialogOpen(true)
                }}
                className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
              >
                <KeyRound className="mr-2 h-4 w-4" /> Ekspor Akun
              </Button>
              <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" /> Impor Excel
              </Button>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Tambah
              </Button>
            </>
          )}
          {activeTab === "alumni" && (
            <Link href="/admin/alumni">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Kelola di Data Alumni
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(1); setTableSelectedIds([]); }}>
        <TabsList className="mb-4">
          <TabsTrigger value="aktif">Santri Aktif ({aktifData.length})</TabsTrigger>
          <TabsTrigger value="pindah">Pindah Sekolah ({pindahDataFiltered.length})</TabsTrigger>
          <TabsTrigger value="alumni">Alumni / Lulus ({alumniDataFiltered.length})</TabsTrigger>
        </TabsList>

        {activeTab === "alumni" && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3.5 mb-3 bg-indigo-50/70 border border-indigo-200 rounded-lg text-indigo-900 text-sm">
            <span>
              Menampilkan <strong>{alumniDataFiltered.length} alumni</strong> yang telah dinyatakan lulus dari jenjang ini.
            </span>
            <Link href="/admin/alumni" className="inline-flex items-center gap-1 font-semibold text-indigo-700 hover:text-indigo-900 underline">
              Buka menu Data Alumni lengkap <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        <div className="rounded-md border bg-white shadow-sm overflow-x-auto -mx-4 sm:mx-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] text-center">
                  {activeTab !== "alumni" && (
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300"
                      checked={paginatedData.length > 0 && tableSelectedIds.length === paginatedData.length}
                      onChange={toggleAllTableSelection}
                    />
                  )}
                </TableHead>
                <TableHead className="w-[80px]">No</TableHead>
                <TableHead>NISN</TableHead>
                <TableHead>Nama Lengkap</TableHead>
                {activeTab === "aktif" ? (
                  <TableHead className="text-center">Kelas</TableHead>
                ) : activeTab === "pindah" ? (
                  <TableHead>Sekolah Tujuan / Tgl</TableHead>
                ) : (
                  <TableHead className="text-center">Tahun Lulus</TableHead>
                )}
                <TableHead className="w-[180px] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((item, index) => (
                  <TableRow key={item.id} className={tableSelectedIds.includes(item.id) ? "bg-slate-50" : ""}>
                    <TableCell className="text-center">
                      {activeTab !== "alumni" && (
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-gray-300"
                          checked={tableSelectedIds.includes(item.id)}
                          onChange={() => toggleTableSelection(item.id)}
                        />
                      )}
                    </TableCell>
                    <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                    <TableCell className="font-medium font-mono text-xs">{item.nisn}</TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{item.namaLengkap}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        {item.jenisKelamin && (
                          <span className={item.jenisKelamin.toLowerCase().startsWith('l') ? "text-blue-600 dark:text-blue-400 font-medium" : "text-pink-600 dark:text-pink-400 font-medium"}>
                            {item.jenisKelamin.toLowerCase().startsWith('l') ? 'Laki-laki' : 'Perempuan'}
                          </span>
                        )}
                        {item.statusMukim && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">· Mukim</span>
                        )}
                      </div>
                      {activeTab === "pindah" && (
                        <div className="text-xs text-amber-600 mt-1 font-semibold">{item.statusKeluar?.replace(/_/g, ' ')}</div>
                      )}
                      {activeTab === "alumni" && item.namaInstansi && (
                        <div className="text-xs text-slate-500 mt-0.5">{item.namaInstansi} {item.programStudi ? `(${item.programStudi})` : ''}</div>
                      )}
                    </TableCell>
                    
                    {activeTab === "aktif" ? (
                      <TableCell className="text-center">
                        {item.namaKelas ? (
                          <Badge variant="outline" className="font-semibold bg-primary/5 text-primary border-primary/20 text-xs">
                            {item.namaKelas}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Belum Ada Kelas</span>
                        )}
                      </TableCell>
                    ) : activeTab === "pindah" ? (
                      <TableCell>
                        <div className="text-sm">{item.namaSekolahTujuan || "-"}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {item.tanggalPindah ? new Date(item.tanggalPindah).toLocaleDateString('id-ID') : "-"}
                        </div>
                      </TableCell>
                    ) : (
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-medium bg-slate-50 text-slate-700">
                          {item.tahunLulusNama || "Lulus"}
                        </Badge>
                      </TableCell>
                    )}

                    <TableCell className="text-right">
                      {activeTab === "aktif" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-8 px-2"
                            onClick={() => { setPindahData(item); setIsPindahDialogOpen(true); }}
                            title="Proses Pindah Sekolah / Keluar"
                          >
                            Keluar
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={item.rfidCardId ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" : "text-muted-foreground hover:text-primary"}
                            onClick={() => { setRfidTarget(item); setIsRfidModalOpen(true); }}
                            title={item.rfidCardId ? `RFID: ${item.rfidCardId} (Klik untuk kelola)` : "Daftarkan Kartu RFID"}
                          >
                            <CreditCard className="h-4 w-4" />
                            <span className="sr-only">RFID</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-amber-600 hover:bg-amber-50"
                            onClick={async () => {
                              if (!confirm(`Reset password akun ${item.namaLengkap} ke default ("password123")?`)) return
                              const { resetPasswordSantri } = await import("./actions")
                              const res = await resetPasswordSantri(item.id)
                              if (res.success) {
                                alert(`Password akun ${item.namaLengkap} berhasil direset ke "password123"!`)
                              } else {
                                alert(res.error || "Gagal mereset password")
                              }
                            }}
                            title="Reset Password Akun ke default (password123)"
                          >
                            <KeyRound className="h-4 w-4" />
                            <span className="sr-only">Reset Password</span>
                          </Button>
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
                      ) : activeTab === "pindah" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              if (!confirm("Batalkan status pindah dan kembalikan santri menjadi aktif?")) return
                              const { batalkanKeluarSantri } = await import("./actions")
                              const res = await batalkanKeluarSantri(item.id)
                              if (res.success) {
                                setData(data.map(d => d.id === item.id ? { ...d, statusKeluar: null, namaSekolahTujuan: null, tanggalPindah: null, alasanPindah: null } : d))
                              } else alert(res.error)
                            }}
                          >
                            Batalkan
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/alumni/${item.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs font-semibold text-indigo-700 hover:text-indigo-800"
                            >
                              Detail Alumni
                            </Button>
                          </Link>
                        </div>
                      )}
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
      </Tabs>

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
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {editingData ? "Edit Data Santri" : "Tambah Data Santri"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Tabs defaultValue="bio" className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-4">
                  <TabsTrigger value="bio">Bio</TabsTrigger>
                  <TabsTrigger value="akademik">Akademik</TabsTrigger>
                  <TabsTrigger value="orangtua">Orang Tua</TabsTrigger>
                  <TabsTrigger value="medis">Medis</TabsTrigger>
                  <TabsTrigger value="kehadiran">Kehadiran</TabsTrigger>
                </TabsList>
                
                <div className="max-h-[50vh] overflow-y-auto px-1">
                  <TabsContent value="bio" className="space-y-4 mt-0">
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
                            <FormLabel>No Telepon Siswa (opsional)</FormLabel>
                            <FormControl>
                              <Input placeholder="08xxx" {...field} value={field.value || ""} />
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
                  </TabsContent>

                  <TabsContent value="akademik" className="space-y-4 mt-0">
                    <FormField
                      control={form.control}
                      name="tahunMasukId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tahun Masuk (Tahun Ajaran)</FormLabel>
                          <Select 
                            onValueChange={(val) => field.onChange(val === "null" ? null : Number(val))} 
                            value={field.value != null ? String(field.value) : "null"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih Tahun Masuk (jika ada)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="null">Belum Diatur</SelectItem>
                              {tahunAjarans.map(ta => (
                                <SelectItem key={ta.id} value={ta.id.toString()}>{ta.nama}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                  </TabsContent>

                  <TabsContent value="orangtua" className="space-y-4 mt-0">
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
                  </TabsContent>

                  <TabsContent value="medis" className="space-y-4 mt-0">
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
                  </TabsContent>

                  <TabsContent value="kehadiran" className="space-y-4 mt-0">
                    <div className="bg-white p-4 rounded-xl border border-slate-100">
                      <h3 className="font-semibold text-sm mb-4">Agustus 2026</h3>
                      <div className="grid grid-cols-7 gap-1 text-center mb-1">
                        {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => (
                          <div key={day} className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{day}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {/* Dummy offset */}
                        <div className="aspect-square"></div>
                        <div className="aspect-square"></div>
                        <div className="aspect-square"></div>
                        <div className="aspect-square"></div>
                        <div className="aspect-square"></div>
                        {Array.from({ length: 31 }).map((_, i) => {
                          const isWeekend = (i + 1) % 7 === 0 || (i + 2) % 7 === 0
                          if (isWeekend) return <div key={i} className="aspect-square flex items-center justify-center rounded text-xs font-medium bg-slate-50 border border-slate-100 text-slate-400">{i+1}</div>
                          
                          const isAbsent = i === 4 || i === 12 || i === 18
                          return (
                            <div 
                              key={i} 
                              className={`aspect-square flex items-center justify-center rounded text-xs font-medium border ${
                                isAbsent 
                                  ? "bg-red-50 border-red-200 text-red-600" 
                                  : "bg-emerald-50 border-emerald-200 text-emerald-700"
                              }`}
                            >
                              {i+1}
                            </div>
                          )
                        })}
                      </div>
                      <div className="mt-4 flex gap-4 border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <div className="w-3 h-3 rounded-sm bg-emerald-50 border border-emerald-200"></div> Hadir
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <div className="w-3 h-3 rounded-sm bg-red-50 border border-red-200"></div> Absen
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
                
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

      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="h-5 w-5 text-blue-600" />
              Ekspor Akun Siswa (Username & Password)
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Pilih Filter Kelas</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background text-foreground"
                value={exportKelas}
                onChange={(e) => setExportKelas(e.target.value)}
              >
                <option value="all">
                  Semua Kelas ({data.filter(s => !s.statusKeluar).length} Siswa)
                </option>
                {kelasList.map((k) => {
                  const count = data.filter(s => !s.statusKeluar && s.namaKelas === k.namaKelas).length
                  return (
                    <option key={k.id} value={k.namaKelas}>
                      Kelas {k.namaKelas} ({count} Siswa)
                    </option>
                  )
                })}
                <option value="none">
                  Belum Ada Kelas ({data.filter(s => !s.statusKeluar && !s.namaKelas).length} Siswa)
                </option>
              </select>
            </div>

            {/* Info Box */}
            <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3.5 text-xs text-blue-900 space-y-2">
              <div className="font-semibold flex items-center gap-1.5 text-blue-800">
                <span>ℹ️</span> Format Kredensial Siswa
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                <li><strong>Username:</strong> NISN masing-masing siswa (disimpan sebagai teks agar angka 0 di depan tidak terpotong)</li>
                <li><strong>Password Default:</strong> <code className="bg-white px-1.5 py-0.5 rounded text-blue-700 font-mono font-bold">password123</code></li>
                <li><strong>Format File:</strong> Excel (.xlsx) dengan kolom No, NISN (Username), Nama Lengkap, Kelas, Jenis Kelamin, Status Mukim, Password Default, dan Status Akun.</li>
              </ul>
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between text-sm py-2 px-3 bg-slate-50 rounded-md border border-slate-200">
              <span className="text-slate-600">Siswa yang akan diekspor:</span>
              <span className="font-bold text-slate-900">
                {(() => {
                  if (exportKelas === "none") {
                    return data.filter(s => !s.statusKeluar && !s.namaKelas).length
                  }
                  if (exportKelas !== "all") {
                    return data.filter(s => !s.statusKeluar && s.namaKelas === exportKelas).length
                  }
                  return data.filter(s => !s.statusKeluar).length
                })()} Siswa
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setIsExportDialogOpen(false)}>
                Batal
              </Button>
              <Button 
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleDownloadExport}
              >
                <FileDown className="mr-2 h-4 w-4" /> Unduh Excel (.xlsx)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPindahDialogOpen} onOpenChange={setIsPindahDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proses Pindah Sekolah / Keluar</DialogTitle>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault()
            if (!pindahData) return
            const form = e.target as HTMLFormElement
            const statusKeluar = (form.elements.namedItem("statusKeluar") as HTMLSelectElement).value
            const namaSekolahTujuan = (form.elements.namedItem("namaSekolahTujuan") as HTMLInputElement).value
            const tanggalPindah = (form.elements.namedItem("tanggalPindah") as HTMLInputElement).value
            const alasanPindah = (form.elements.namedItem("alasanPindah") as HTMLTextAreaElement).value
            
            setIsSubmitting(true)
            try {
              const { prosesKeluarSantri } = await import("./actions")
              const res = await prosesKeluarSantri({
                santriId: pindahData.id,
                statusKeluar: statusKeluar as any,
                namaSekolahTujuan,
                tanggalPindah,
                alasanPindah
              })
              if (res.success) {
                setData(data.map(d => d.id === pindahData.id ? { 
                  ...d, 
                  statusKeluar, 
                  namaSekolahTujuan, 
                  tanggalPindah, 
                  alasanPindah 
                } : d))
                setIsPindahDialogOpen(false)
                setPindahData(null)
              } else {
                alert(res.error)
              }
            } catch(err) {
              alert("Terjadi kesalahan")
            } finally {
              setIsSubmitting(false)
            }
          }} className="space-y-4 pt-2">
            <div className="bg-amber-50 p-3 rounded-md border border-amber-100 text-sm text-amber-800 mb-4">
              Anda akan memproses keluar santri <strong>{pindahData?.namaLengkap}</strong> ({pindahData?.nisn}).
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status Keluar *</label>
              <select name="statusKeluar" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                <option value="PINDAH_SEKOLAH">Pindah Sekolah</option>
                <option value="MENGUNDURKAN_DIRI">Mengundurkan Diri</option>
                <option value="DIKELUARKAN">Dikeluarkan</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Sekolah Tujuan (Jika Pindah)</label>
              <Input name="namaSekolahTujuan" placeholder="Misal: MTs Negeri 1 Jakarta" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Efektif Keluar</label>
              <Input type="date" name="tanggalPindah" defaultValue={new Date().toISOString().split('T')[0]} required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Alasan / Keterangan Tambahan</label>
              <Textarea name="alasanPindah" placeholder="Tuliskan keterangan detail jika diperlukan..." />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" type="button" onClick={() => setIsPindahDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} variant="destructive">
                {isSubmitting ? "Memproses..." : "Konfirmasi Keluar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Pairing RFID Santri */}
      <RfidPairingModal
        isOpen={isRfidModalOpen}
        onClose={() => {
          setIsRfidModalOpen(false)
          setRfidTarget(null)
        }}
        target={
          rfidTarget
            ? {
                id: rfidTarget.id,
                nama: rfidTarget.namaLengkap,
                nomorInduk: rfidTarget.nisn,
                currentRfid: rfidTarget.rfidCardId,
                tipe: "SANTRI",
              }
            : null
        }
        onSuccess={(newRfid) => {
          if (rfidTarget) {
            setData((prev) =>
              prev.map((s) =>
                s.id === rfidTarget.id ? { ...s, rfidCardId: newRfid } : s
              )
            )
          }
        }}
      />
    </div>
  )
}
