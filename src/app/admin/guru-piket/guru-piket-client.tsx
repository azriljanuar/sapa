"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Search, Calendar, ShieldCheck, CheckSquare, Square, UserCheck } from "lucide-react"
import { Hari } from "@prisma/client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { saveGuruPiketAssignment, removeGuruPiketAssignment } from "./actions"

const ALL_HARI: { key: Hari; label: string }[] = [
  { key: "SENIN", label: "Senin" },
  { key: "SELASA", label: "Selasa" },
  { key: "RABU", label: "Rabu" },
  { key: "KAMIS", label: "Kamis" },
  { key: "JUMAT", label: "Jumat" },
  { key: "SABTU", label: "Sabtu" },
  { key: "MINGGU", label: "Minggu" },
]

type GuruPiketEntry = {
  guru: {
    id: number
    nama: string
    nip: string | null
    email: string
    noTelepon: string | null
    fotoWajah: string | null
  }
  assignments: { id: number; hari: Hari; keterangan: string | null }[]
  hariList: Hari[]
  keterangan: string | null
}

type AvailableGuru = {
  id: number
  nama: string
  nip: string | null
  fotoWajah: string | null
}

export function GuruPiketClient({
  initialData,
  guruList,
  activeTaName,
}: {
  initialData: GuruPiketEntry[]
  guruList: AvailableGuru[]
  activeTaName: string
}) {
  const [data, setData] = useState<GuruPiketEntry[]>(initialData)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterHari, setFilterHari] = useState<string>("ALL")

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<GuruPiketEntry | null>(null)

  // Form State
  const [selectedGuruId, setSelectedGuruId] = useState<number | null>(null)
  const [selectedHariList, setSelectedHariList] = useState<Hari[]>([])
  const [keterangan, setKeterangan] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleOpenAdd = () => {
    setSelectedGuruId(null)
    setSelectedHariList([])
    setKeterangan("")
    setErrorMessage(null)
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (entry: GuruPiketEntry) => {
    setSelectedGuruId(entry.guru.id)
    setSelectedHariList([...entry.hariList])
    setKeterangan(entry.keterangan || "")
    setErrorMessage(null)
    setIsDialogOpen(true)
  }

  const toggleHari = (h: Hari) => {
    if (selectedHariList.includes(h)) {
      setSelectedHariList(selectedHariList.filter((item) => item !== h))
    } else {
      setSelectedHariList([...selectedHariList, h])
    }
  }

  const handleSelectAllWorkdays = () => {
    const workdays: Hari[] = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"]
    const allSelected = workdays.every((h) => selectedHariList.includes(h))
    if (allSelected) {
      setSelectedHariList(selectedHariList.filter((h) => !workdays.includes(h)))
    } else {
      const merged = Array.from(new Set([...selectedHariList, ...workdays]))
      setSelectedHariList(merged)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!selectedGuruId) {
      setErrorMessage("Pilih guru terlebih dahulu")
      return
    }
    if (selectedHariList.length === 0) {
      setErrorMessage("Pilih minimal satu hari piket")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await saveGuruPiketAssignment({
        guruId: selectedGuruId,
        hariList: selectedHariList,
        keterangan,
      })

      if (!res.success) {
        setErrorMessage(res.error || "Gagal menyimpan penugasan")
        setIsSubmitting(false)
        return
      }

      // Update local state
      const targetGuru = guruList.find((g) => g.id === selectedGuruId)
      const existingIdx = data.findIndex((d) => d.guru.id === selectedGuruId)

      const updatedEntry: GuruPiketEntry = {
        guru: {
          id: selectedGuruId,
          nama: targetGuru?.nama || "Guru",
          nip: targetGuru?.nip || null,
          email: "",
          noTelepon: null,
          fotoWajah: targetGuru?.fotoWajah || null,
        },
        assignments: selectedHariList.map((h, i) => ({
          id: Date.now() + i,
          hari: h,
          keterangan,
        })),
        hariList: [...selectedHariList],
        keterangan: keterangan || null,
      }

      if (existingIdx >= 0) {
        const next = [...data]
        next[existingIdx] = updatedEntry
        setData(next)
      } else {
        setData([updatedEntry, ...data])
      }

      setIsDialogOpen(false)
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan sistem")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const res = await removeGuruPiketAssignment(deleteTarget.guru.id)
      if (res.success) {
        setData(data.filter((d) => d.guru.id !== deleteTarget.guru.id))
        setDeleteTarget(null)
      } else {
        alert(res.error || "Gagal menghapus data")
      }
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan")
    } finally {
      setIsDeleting(false)
    }
  }

  // Filtered Data
  const filteredData = data.filter((item) => {
    const matchSearch =
      item.guru.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.guru.nip && item.guru.nip.includes(searchQuery))
    const matchHari =
      filterHari === "ALL" || item.hariList.includes(filterHari as Hari)
    return matchSearch && matchHari
  })

  const getHariBadgeClass = (h: Hari) => {
    switch (h) {
      case "SENIN":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200"
      case "SELASA":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200"
      case "RABU":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200"
      case "KAMIS":
        return "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200"
      case "JUMAT":
        return "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200"
      case "SABTU":
        return "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200"
      case "MINGGU":
        return "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200"
      default:
        return ""
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Manajemen Guru Piket
            </h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              {activeTaName}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Atur dan tetapkan guru yang bertugas sebagai guru piket harian untuk memantau jadwal, kehadiran, dan kartu identitas.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-2 shadow-xs shrink-0">
          <Plus className="w-4 h-4" />
          Tambah Guru Piket
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-4 rounded-xl border border-border shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama guru atau NIP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            Filter Hari:
          </span>
          <Select value={filterHari} onValueChange={(val) => setFilterHari(val || "ALL")}>
            <SelectTrigger className="w-[160px] bg-background">
              <SelectValue placeholder="Semua Hari" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Hari</SelectItem>
              {ALL_HARI.map((h) => (
                <SelectItem key={h.key} value={h.key}>
                  {h.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-12 text-center">No</TableHead>
                <TableHead>Guru</TableHead>
                <TableHead>Hari Piket</TableHead>
                <TableHead>Keterangan / Pos</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <UserCheck className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="font-medium">Belum ada data guru piket</p>
                    <p className="text-xs text-muted-foreground/80 mt-1">
                      Klik tombol &quot;Tambah Guru Piket&quot; untuk menetapkan penugasan baru.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, index) => (
                  <TableRow key={item.guru.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-center font-medium text-muted-foreground text-sm">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border border-border shrink-0">
                          <AvatarImage src={item.guru.fotoWajah || undefined} alt={item.guru.nama} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                            {item.guru.nama.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-sm text-foreground">
                            {item.guru.nama}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.guru.nip ? `NIP: ${item.guru.nip}` : item.guru.email || "Guru"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5 max-w-md">
                        {item.hariList.map((h) => (
                          <span
                            key={h}
                            className={cn(
                              "text-xs px-2.5 py-0.5 rounded-full font-medium border",
                              getHariBadgeClass(h)
                            )}
                          >
                            {ALL_HARI.find((x) => x.key === h)?.label || h}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.keterangan || <span className="italic text-muted-foreground/60">-</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(item)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          title="Edit Hari Piket"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(item)}
                          className="h-8 w-8 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                          title="Hapus Penugasan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal Tambah / Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedGuruId && data.some((d) => d.guru.id === selectedGuruId)
                ? "Edit Penugasan Guru Piket"
                : "Tetapkan Guru Piket Baru"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {errorMessage && (
              <div className="p-3 text-xs bg-destructive/10 text-destructive rounded-lg border border-destructive/20 font-medium">
                {errorMessage}
              </div>
            )}

            {/* Pilih Guru */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Pilih Guru <span className="text-destructive">*</span>
              </label>
              <Select
                value={selectedGuruId ? String(selectedGuruId) : ""}
                onValueChange={(val) => setSelectedGuruId(val ? Number(val) : null)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="-- Pilih Guru dari Daftar --" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {guruList.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.nama} {g.nip ? `(${g.nip})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pilih Hari Piket (Multi Selection) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Hari Bertugas <span className="text-destructive">*</span>
                </label>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={handleSelectAllWorkdays}
                  className="h-auto p-0 text-xs text-primary"
                >
                  Pilih Senin - Sabtu
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {ALL_HARI.map((h) => {
                  const isSelected = selectedHariList.includes(h.key)
                  return (
                    <button
                      type="button"
                      key={h.key}
                      onClick={() => toggleHari(h.key)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all text-left",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-background text-muted-foreground border-input hover:bg-muted"
                      )}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 shrink-0 opacity-50" />
                      )}
                      <span>{h.label}</span>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Bisa memilih lebih dari satu hari dalam seminggu.
              </p>
            </div>

            {/* Keterangan */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Keterangan / Pos Penugasan (Opsional)
              </label>
              <Input
                placeholder="Contoh: Pos Piket Gerbang Utama / Pukul 07:00 - 14:00"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Simpan Penugasan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Hapus Penugasan Guru Piket</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-muted-foreground">
            Apakah Anda yakin ingin menghapus seluruh penugasan piket untuk{" "}
            <span className="font-semibold text-foreground">{deleteTarget?.guru.nama}</span> pada tahun ajaran ini?
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
