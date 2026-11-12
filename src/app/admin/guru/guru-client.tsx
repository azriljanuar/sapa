"use client"

import { useState, useTransition } from "react"
import { 
  Search, CreditCard, KeyRound, FileDown, Plus, Pencil, Trash2, 
  Eye, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, User, Phone, Mail,
  GraduationCap, Briefcase, Calendar, MapPin
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
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
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RfidPairingModal } from "@/components/rfid/rfid-pairing-modal"
import { createGuru, updateGuru, deleteGuru, resetPasswordGuru, importGuruExcel, GuruFormValues } from "./actions"

export type GuruItem = {
  id: number
  nama: string
  nip: string | null
  nuptk: string | null
  nik: string | null
  email: string
  rfidCardId: string | null
  jenisKelamin: string | null
  noTelepon: string | null
  tempatLahir: string | null
  tanggalLahir: string | null
  pendidikanTerakhir: string | null
  jurusan: string | null
  statusPegawai: string | null
  alamatLengkap: string | null
  _count?: {
    waliKelas: number
    pengampu: number
  }
}

const emptyForm: GuruFormValues = {
  nama: "",
  email: "",
  nip: "",
  nuptk: "",
  nik: "",
  jenisKelamin: "Laki-laki",
  noTelepon: "",
  tempatLahir: "",
  tanggalLahir: "",
  pendidikanTerakhir: "S1",
  jurusan: "",
  statusPegawai: "Guru Tetap Yayasan",
  alamatLengkap: "",
  rfidCardId: "",
  password: "",
}

export function GuruClient({ initialData }: { initialData: GuruItem[] }) {
  const [data, setData] = useState<GuruItem[]>(initialData)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterGender, setFilterGender] = useState<string>("ALL")
  const [filterStatus, setFilterStatus] = useState<string>("ALL")

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [formData, setFormData] = useState<GuruFormValues>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)

  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [detailGuru, setDetailGuru] = useState<GuruItem | null>(null)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [guruToDelete, setGuruToDelete] = useState<GuruItem | null>(null)

  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<{ message?: string; errors?: string[] } | null>(null)

  const [isRfidModalOpen, setIsRfidModalOpen] = useState(false)
  const [rfidTarget, setRfidTarget] = useState<GuruItem | null>(null)

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Filter Guru
  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.nip && item.nip.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.nuptk && item.nuptk.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.rfidCardId && item.rfidCardId.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesGender =
      filterGender === "ALL" ||
      (filterGender === "L" && (item.jenisKelamin?.toLowerCase().startsWith("l") || item.jenisKelamin === "Laki-laki")) ||
      (filterGender === "P" && (item.jenisKelamin?.toLowerCase().startsWith("p") || item.jenisKelamin === "Perempuan"))

    const matchesStatus =
      filterStatus === "ALL" || item.statusPegawai === filterStatus

    return matchesSearch && matchesGender && matchesStatus
  })

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormMode("create")
    setFormData(emptyForm)
    setFormError(null)
    setIsFormOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (guru: GuruItem) => {
    setFormMode("edit")
    setFormData({
      id: guru.id,
      nama: guru.nama,
      email: guru.email,
      nip: guru.nip || "",
      nuptk: guru.nuptk || "",
      nik: guru.nik || "",
      jenisKelamin: guru.jenisKelamin || "Laki-laki",
      noTelepon: guru.noTelepon || "",
      tempatLahir: guru.tempatLahir || "",
      tanggalLahir: guru.tanggalLahir || "",
      pendidikanTerakhir: guru.pendidikanTerakhir || "S1",
      jurusan: guru.jurusan || "",
      statusPegawai: guru.statusPegawai || "Guru Tetap Yayasan",
      alamatLengkap: guru.alamatLengkap || "",
      rfidCardId: guru.rfidCardId || "",
      password: "", // Kosongkan saat edit, hanya diisi jika ingin ganti password
    })
    setFormError(null)
    setIsFormOpen(true)
  }

  // Submit Form (Create / Edit)
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formData.nama.trim()) {
      setFormError("Nama lengkap wajib diisi")
      return
    }
    if (!formData.email.trim()) {
      setFormError("Email wajib diisi")
      return
    }

    startTransition(async () => {
      if (formMode === "create") {
        const res = await createGuru(formData)
        if (res.success) {
          setIsFormOpen(false)
          // Refresh window / update local state
          window.location.reload()
        } else {
          setFormError(res.error || "Gagal menambahkan guru")
        }
      } else {
        const res = await updateGuru(formData)
        if (res.success) {
          setIsFormOpen(false)
          window.location.reload()
        } else {
          setFormError(res.error || "Gagal memperbarui data guru")
        }
      }
    })
  }

  // Handle Delete Guru
  const handleDeleteConfirm = () => {
    if (!guruToDelete) return

    startTransition(async () => {
      const res = await deleteGuru(guruToDelete.id)
      if (res.success) {
        setData((prev) => prev.filter((g) => g.id !== guruToDelete.id))
        setIsDeleteOpen(false)
        setGuruToDelete(null)
      } else {
        alert(res.error || "Gagal menghapus guru")
      }
    })
  }

  // Handle Import Excel
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importFile) {
      alert("Pilih file Excel terlebih dahulu")
      return
    }

    const fd = new FormData()
    fd.append("file", importFile)

    startTransition(async () => {
      const res = await importGuruExcel(fd)
      if (res.success) {
        setImportResult({ message: res.message, errors: res.errors })
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        setImportResult({ message: res.error, errors: [] })
      }
    })
  }

  // Handle Download Template Excel
  const handleDownloadTemplate = () => {
    window.open("/api/admin/guru/template", "_blank")
  }

  // Handle Download Export Akun
  const handleDownloadExport = () => {
    const url = `/api/admin/guru/export-akun`
    const link = document.createElement("a")
    link.href = url
    link.download = ""
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setIsExportDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Data Guru</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola data pendidik, penugasan kartu RFID, akun portal guru, dan riwayat mengajar.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleOpenCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
          >
            <Plus className="mr-2 h-4 w-4" /> Tambah Guru
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setImportFile(null)
              setImportResult(null)
              setIsImportOpen(true)
            }}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <Upload className="mr-2 h-4 w-4 text-emerald-600" /> Impor Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsExportDialogOpen(true)}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <KeyRound className="mr-2 h-4 w-4 text-blue-600" /> Ekspor Akun
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Cari NIP, NUPTK, Nama Guru, Email, atau UID RFID..."
            className="pl-9 bg-slate-50/50 border-slate-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-[140px]">
            <Select value={filterGender} onValueChange={(val) => setFilterGender(val || "ALL")}>
              <SelectTrigger className="bg-slate-50/50 border-slate-200 text-xs">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Gender</SelectItem>
                <SelectItem value="L">Laki-laki</SelectItem>
                <SelectItem value="P">Perempuan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-[160px]">
            <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val || "ALL")}>
              <SelectTrigger className="bg-slate-50/50 border-slate-200 text-xs">
                <SelectValue placeholder="Status Pegawai" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="PNS">PNS</SelectItem>
                <SelectItem value="PPPK">PPPK</SelectItem>
                <SelectItem value="Guru Tetap Yayasan">Tetap Yayasan</SelectItem>
                <SelectItem value="GTT">GTT / Honorer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-xs text-muted-foreground whitespace-nowrap pl-1">
            Total: <span className="font-semibold text-slate-900">{filteredData.length}</span> Guru
          </div>
        </div>
      </div>

      {/* Guru Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="w-[50px] text-center font-semibold">No</TableHead>
                <TableHead className="min-w-[220px] font-semibold">Nama Lengkap & NIP</TableHead>
                <TableHead className="min-w-[180px] font-semibold">Kontak</TableHead>
                <TableHead className="min-w-[150px] font-semibold">Status Pegawai</TableHead>
                <TableHead className="min-w-[140px] font-semibold">Kartu RFID</TableHead>
                <TableHead className="w-[150px] text-right font-semibold">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <TableCell className="text-center font-medium text-slate-500 text-xs">
                      {index + 1}
                    </TableCell>
                    
                    {/* Nama & NIP */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                          {item.nama.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                            <span className="truncate">{item.nama}</span>
                            {item.jenisKelamin && (
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                item.jenisKelamin.toLowerCase().startsWith("l")
                                  ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                                  : "bg-pink-50 text-pink-700 border border-pink-200/60"
                              }`}>
                                {item.jenisKelamin.toLowerCase().startsWith("l") ? "L" : "P"}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">
                            {item.nip ? `NIP. ${item.nip}` : item.nuptk ? `NUPTK. ${item.nuptk}` : "NIP belum diset"}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Kontak */}
                    <TableCell>
                      <div className="space-y-0.5 text-xs">
                        <div className="text-slate-800 flex items-center gap-1.5 truncate max-w-[180px]">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate" title={item.email}>{item.email}</span>
                        </div>
                        {item.noTelepon ? (
                          <div className="text-slate-500 flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{item.noTelepon}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No HP belum ada</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Status Pegawai */}
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline" className="font-normal text-xs bg-slate-50 text-slate-700 border-slate-200">
                          {item.statusPegawai || "Guru Pengajar"}
                        </Badge>
                        {item.pendidikanTerakhir && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-slate-400" />
                            <span>{item.pendidikanTerakhir} {item.jurusan ? `- ${item.jurusan}` : ""}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* RFID Status */}
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className={
                          item.rfidCardId
                            ? "border-emerald-500/30 text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100 font-mono text-xs gap-1.5 h-7 px-2.5"
                            : "text-muted-foreground hover:text-indigo-600 border-dashed text-xs gap-1.5 h-7 px-2.5"
                        }
                        onClick={() => {
                          setRfidTarget(item)
                          setIsRfidModalOpen(true)
                        }}
                        title={
                          item.rfidCardId
                            ? `RFID: ${item.rfidCardId} (Klik untuk ganti atau lepas kartu)`
                            : "Klik untuk mendaftarkan kartu RFID"
                        }
                      >
                        <CreditCard className="w-3 h-3 text-primary" />
                        {item.rfidCardId ? item.rfidCardId : "+ Daftarkan"}
                      </Button>
                    </TableCell>

                    {/* Action Column */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Detail */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                          onClick={() => {
                            setDetailGuru(item)
                            setIsDetailOpen(true)
                          }}
                          title="Lihat Detail Profil Guru"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Detail</span>
                        </Button>

                        {/* Edit */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                          onClick={() => handleOpenEdit(item)}
                          title="Edit Data Guru"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>

                        {/* Reset Password */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                          onClick={async () => {
                            if (!confirm(`Reset password akun guru "${item.nama}" ke default ("password123")?`)) return
                            const res = await resetPasswordGuru(item.id)
                            if (res.success) {
                              alert(`Password akun guru "${item.nama}" berhasil direset ke "password123"!`)
                            } else {
                              alert(res.error || "Gagal mereset password")
                            }
                          }}
                          title="Reset Password Akun ke default (password123)"
                        >
                          <KeyRound className="h-4 w-4" />
                          <span className="sr-only">Reset Password</span>
                        </Button>

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => {
                            setGuruToDelete(item)
                            setIsDeleteOpen(true)
                          }}
                          title="Hapus Data Guru"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Hapus</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <User className="w-8 h-8 text-slate-300" />
                      <p className="font-medium text-slate-600">Tidak ada data guru yang cocok.</p>
                      <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau filter status.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL TAMBAH / EDIT GURU */}
      {/* ========================================================================= */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              {formMode === "create" ? (
                <>
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                    <Plus className="h-4 w-4" />
                  </div>
                  <span>Tambah Guru Baru</span>
                </>
              ) : (
                <>
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                    <Pencil className="h-4 w-4" />
                  </div>
                  <span>Edit Data Guru</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <Tabs defaultValue="utama" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-100">
                <TabsTrigger value="utama">Data Utama</TabsTrigger>
                <TabsTrigger value="kepegawaian">Kepegawaian</TabsTrigger>
                <TabsTrigger value="biodata">Biodata & Kontak</TabsTrigger>
              </TabsList>

              {/* TAB 1: DATA UTAMA */}
              <TabsContent value="utama" className="space-y-3.5 pt-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-semibold">Nama Lengkap & Gelar <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="Contoh: Ust. H. Abdullah, M.Pd.I"
                      value={formData.nama}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Email Resmi (Username Login) <span className="text-red-500">*</span></Label>
                    <Input
                      type="email"
                      placeholder="Contoh: guru@sapa.sch.id"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      {formMode === "create" ? "Password Akun" : "Ganti Password (Opsional)"}
                    </Label>
                    <Input
                      type="password"
                      placeholder={formMode === "create" ? "Default: password123" : "Kosongkan jika tidak diubah"}
                      value={formData.password || ""}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Jenis Kelamin</Label>
                    <Select
                      value={formData.jenisKelamin || "Laki-laki"}
                      onValueChange={(val) => setFormData({ ...formData, jenisKelamin: val || "Laki-laki" })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Jenis Kelamin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                        <SelectItem value="Perempuan">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">UID Kartu RFID (Opsional)</Label>
                    <Input
                      placeholder="Scan atau ketik UID RFID..."
                      value={formData.rfidCardId || ""}
                      onChange={(e) => setFormData({ ...formData, rfidCardId: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* TAB 2: KEPEGAWAIAN */}
              <TabsContent value="kepegawaian" className="space-y-3.5 pt-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">NIP</Label>
                    <Input
                      placeholder="Nomor Induk Pegawai..."
                      value={formData.nip || ""}
                      onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">NUPTK</Label>
                    <Input
                      placeholder="Nomor Unik Pendidik & Tenaga Kependidikan..."
                      value={formData.nuptk || ""}
                      onChange={(e) => setFormData({ ...formData, nuptk: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Status Kepegawaian</Label>
                    <Select
                      value={formData.statusPegawai || "Guru Tetap Yayasan"}
                      onValueChange={(val) => setFormData({ ...formData, statusPegawai: val || "Guru Tetap Yayasan" })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PNS">PNS</SelectItem>
                        <SelectItem value="PPPK">PPPK</SelectItem>
                        <SelectItem value="Guru Tetap Yayasan">Guru Tetap Yayasan</SelectItem>
                        <SelectItem value="GTT">GTT (Guru Tidak Tetap)</SelectItem>
                        <SelectItem value="Honorer">Honorer</SelectItem>
                        <SelectItem value="Lainnya">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Pendidikan Terakhir</Label>
                    <Select
                      value={formData.pendidikanTerakhir || "S1"}
                      onValueChange={(val) => setFormData({ ...formData, pendidikanTerakhir: val || "S1" })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Pendidikan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SMA/MA">SMA / MA</SelectItem>
                        <SelectItem value="D3">Diploma 3 (D3)</SelectItem>
                        <SelectItem value="S1">Sarjana (S1)</SelectItem>
                        <SelectItem value="S2">Magister (S2)</SelectItem>
                        <SelectItem value="S3">Doktor (S3)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-semibold">Jurusan / Program Studi</Label>
                    <Input
                      placeholder="Contoh: Pendidikan Agama Islam / Pendidikan Bahasa Arab"
                      value={formData.jurusan || ""}
                      onChange={(e) => setFormData({ ...formData, jurusan: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* TAB 3: BIODATA & KONTAK */}
              <TabsContent value="biodata" className="space-y-3.5 pt-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">NIK (No. KTP)</Label>
                    <Input
                      placeholder="16 digit NIK..."
                      value={formData.nik || ""}
                      onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">No. Telepon / WhatsApp</Label>
                    <Input
                      placeholder="Contoh: 08123456789"
                      value={formData.noTelepon || ""}
                      onChange={(e) => setFormData({ ...formData, noTelepon: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Tempat Lahir</Label>
                    <Input
                      placeholder="Kota/Kabupaten lahir..."
                      value={formData.tempatLahir || ""}
                      onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Tanggal Lahir</Label>
                    <Input
                      type="date"
                      value={formData.tanggalLahir || ""}
                      onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-semibold">Alamat Lengkap</Label>
                    <Textarea
                      placeholder="Alamat domisili guru..."
                      rows={2}
                      value={formData.alamatLengkap || ""}
                      onChange={(e) => setFormData({ ...formData, alamatLengkap: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isPending}>
                Batal
              </Button>
              <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {isPending ? "Menyimpan..." : formMode === "create" ? "Simpan Guru" : "Perbarui Data"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL DETAIL GURU */}
      {/* ========================================================================= */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-600" />
              Profil Lengkap Guru
            </DialogTitle>
          </DialogHeader>

          {detailGuru && (
            <div className="space-y-4 pt-1">
              {/* Header Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                  {detailGuru.nama.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-900 text-base leading-tight truncate">{detailGuru.nama}</h3>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    {detailGuru.nip ? `NIP: ${detailGuru.nip}` : "NIP belum diset"}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="text-[11px] bg-white">
                      {detailGuru.statusPegawai || "Guru"}
                    </Badge>
                    {detailGuru.rfidCardId && (
                      <Badge variant="outline" className="text-[11px] bg-emerald-50 text-emerald-700 border-emerald-200 font-mono">
                        RFID: {detailGuru.rfidCardId}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white border rounded-lg space-y-1">
                  <span className="text-slate-400 font-medium">Email Akun</span>
                  <p className="font-semibold text-slate-800 break-all">{detailGuru.email}</p>
                </div>
                <div className="p-3 bg-white border rounded-lg space-y-1">
                  <span className="text-slate-400 font-medium">No. Telepon / WA</span>
                  <p className="font-semibold text-slate-800">{detailGuru.noTelepon || "-"}</p>
                </div>
                <div className="p-3 bg-white border rounded-lg space-y-1">
                  <span className="text-slate-400 font-medium">NUPTK</span>
                  <p className="font-semibold text-slate-800">{detailGuru.nuptk || "-"}</p>
                </div>
                <div className="p-3 bg-white border rounded-lg space-y-1">
                  <span className="text-slate-400 font-medium">NIK</span>
                  <p className="font-semibold text-slate-800">{detailGuru.nik || "-"}</p>
                </div>
                <div className="p-3 bg-white border rounded-lg space-y-1">
                  <span className="text-slate-400 font-medium">Jenis Kelamin</span>
                  <p className="font-semibold text-slate-800">{detailGuru.jenisKelamin || "-"}</p>
                </div>
                <div className="p-3 bg-white border rounded-lg space-y-1">
                  <span className="text-slate-400 font-medium">Pendidikan</span>
                  <p className="font-semibold text-slate-800">{detailGuru.pendidikanTerakhir || "-"} {detailGuru.jurusan ? `(${detailGuru.jurusan})` : ""}</p>
                </div>
                <div className="p-3 bg-white border rounded-lg space-y-1 col-span-2">
                  <span className="text-slate-400 font-medium">Tempat, Tanggal Lahir</span>
                  <p className="font-semibold text-slate-800">
                    {detailGuru.tempatLahir ? `${detailGuru.tempatLahir}, ` : ""}
                    {detailGuru.tanggalLahir || "-"}
                  </p>
                </div>
                <div className="p-3 bg-white border rounded-lg space-y-1 col-span-2">
                  <span className="text-slate-400 font-medium">Alamat Lengkap</span>
                  <p className="font-semibold text-slate-800">{detailGuru.alamatLengkap || "-"}</p>
                </div>
              </div>

              {/* Assignment Counts */}
              {detailGuru._count && (
                <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg flex items-center justify-around text-center text-xs">
                  <div>
                    <span className="text-slate-500 block">Wali Kelas</span>
                    <strong className="text-base text-indigo-700">{detailGuru._count.waliKelas}</strong>
                  </div>
                  <div className="h-8 w-px bg-indigo-200" />
                  <div>
                    <span className="text-slate-500 block">Mata Pelajaran Diampu</span>
                    <strong className="text-base text-indigo-700">{detailGuru._count.pengampu}</strong>
                  </div>
                </div>
              )}

              <DialogFooter className="pt-2 border-t">
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                  Tutup
                </Button>
                <Button 
                  onClick={() => {
                    setIsDetailOpen(false)
                    handleOpenEdit(detailGuru)
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit Data
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL HAPUS GURU */}
      {/* ========================================================================= */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Hapus Data Guru
            </DialogTitle>
          </DialogHeader>

          {guruToDelete && (
            <div className="space-y-3 pt-2 text-sm">
              <p className="text-slate-600">
                Apakah Anda yakin ingin menghapus data guru <strong className="text-slate-900">{guruToDelete.nama}</strong>?
              </p>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 space-y-1">
                <p className="font-semibold">⚠️ Perhatian:</p>
                <p>Seluruh riwayat mengajar, absensi, dan akun portal guru ini akan dihapus secara permanen dari sistem.</p>
              </div>

              <DialogFooter className="pt-3 border-t">
                <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isPending}>
                  Batal
                </Button>
                <Button 
                  onClick={handleDeleteConfirm} 
                  disabled={isPending}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isPending ? "Menghapus..." : "Ya, Hapus Guru"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL IMPOR EXCEL GURU */}
      {/* ========================================================================= */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              Impor Data Guru dari Excel
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleImportSubmit} className="space-y-4 pt-2">
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-lg text-xs text-emerald-900 space-y-2">
              <div className="font-semibold flex items-center justify-between">
                <span>Panduan Format Berkas Excel</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="h-7 text-xs bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                >
                  <FileDown className="w-3.5 h-3.5 mr-1" /> Unduh Template
                </Button>
              </div>
              <p className="text-slate-600">
                Kolom wajib adalah <strong>Nama Lengkap</strong> dan <strong>Email</strong> (sebagai username akun guru). Kolom NIP, NUPTK, No HP, Status Pegawai, dan lainnya bersifat opsional.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Pilih File Excel (.xlsx / .xls)</Label>
              <Input
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                required
              />
            </div>

            {importResult && (
              <div className="p-3 bg-slate-50 border rounded-lg text-xs space-y-1.5">
                <p className="font-semibold text-slate-800">{importResult.message}</p>
                {importResult.errors && importResult.errors.length > 0 && (
                  <ul className="list-disc list-inside text-red-600 space-y-0.5">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <DialogFooter className="pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setIsImportOpen(false)} disabled={isPending}>
                Tutup
              </Button>
              <Button type="submit" disabled={isPending || !importFile} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {isPending ? "Mengimpor..." : "Mulai Impor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL EKSPOR AKUN GURU */}
      {/* ========================================================================= */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="h-5 w-5 text-blue-600" />
              Ekspor Akun Guru (Username & Password)
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3.5 text-xs text-blue-900 space-y-2">
              <div className="font-semibold flex items-center gap-1.5 text-blue-800">
                <span>ℹ️</span> Format Kredensial Login Guru
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                <li><strong>Username:</strong> Email resmi masing-masing guru (guru juga dapat login menggunakan NIP jika terisi).</li>
                <li><strong>Password Default:</strong> <code className="bg-white px-1.5 py-0.5 rounded text-blue-700 font-mono font-bold">password123</code></li>
                <li><strong>Format File:</strong> Excel (.xlsx) dengan kolom No, NIP, Nama Lengkap, Username (Email), Password Default, dan Status Akun.</li>
              </ul>
            </div>

            <div className="flex items-center justify-between text-sm py-2 px-3 bg-slate-50 rounded-md border border-slate-200">
              <span className="text-slate-600">Total guru yang akan diekspor:</span>
              <span className="font-bold text-slate-900">{data.length} Guru</span>
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

      {/* ========================================================================= */}
      {/* MODAL PAIRING RFID GURU */}
      {/* ========================================================================= */}
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
                nama: rfidTarget.nama,
                nomorInduk: rfidTarget.nip || "-",
                currentRfid: rfidTarget.rfidCardId,
                tipe: "GURU",
              }
            : null
        }
        onSuccess={(newRfid) => {
          if (rfidTarget) {
            setData((prev) =>
              prev.map((g) =>
                g.id === rfidTarget.id ? { ...g, rfidCardId: newRfid } : g
              )
            )
          }
        }}
      />
    </div>
  )
}
