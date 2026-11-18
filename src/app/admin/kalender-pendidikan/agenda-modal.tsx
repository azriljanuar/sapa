"use client"

import { useState, useEffect, useTransition } from "react"
import { KategoriKaldik, KaldikAgenda } from "@prisma/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, CalendarPlus, Radio, Sparkles } from "lucide-react"
import { upsertKaldikAgenda } from "./actions"
import { KATEGORI_KALDIK_LABEL } from "@/lib/kaldik-types"

interface AgendaModalProps {
  isOpen: boolean
  onClose: () => void
  tahunAjaranId: number
  semesterId: number | null
  initialData?: KaldikAgenda | null
  presetDate?: string // YYYY-MM-DD jika diklik dari kalender
  onSuccess?: () => void
}

const COLOR_PALETTE = [
  { name: "Hijau Emerald (HEB/HEF)", hex: "#059669" },
  { name: "Biru Indigo (Asesmen/Ujian)", hex: "#4f46e5" },
  { name: "Ungu Violet (Kegiatan Madrasah)", hex: "#7c3aed" },
  { name: "Merah Crimson (Libur Nasional)", hex: "#dc2626" },
  { name: "Kuning Amber (Libur Semester)", hex: "#d97706" },
  { name: "Oranye (Libur Ramadhan)", hex: "#ea580c" },
  { name: "Biru Laut", hex: "#0284c7" },
  { name: "Abu-abu", hex: "#64748b" },
]

export function AgendaModal({
  isOpen,
  onClose,
  tahunAjaranId,
  semesterId,
  initialData,
  presetDate,
  onSuccess,
}: AgendaModalProps) {
  const [kategori, setKategori] = useState<KategoriKaldik>("NON_EFEKTIF")
  const [nama, setNama] = useState("")
  const [kodeSingkatan, setKodeSingkatan] = useState("")
  const [tanggalMulai, setTanggalMulai] = useState("")
  const [tanggalAkhir, setTanggalAkhir] = useState("")
  const [warnaHex, setWarnaHex] = useState("#4f46e5")
  const [allowAbsensiRfid, setAllowAbsensiRfid] = useState(false)
  const [keterangan, setKeterangan] = useState("")

  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (initialData) {
      setKategori(initialData.kategori)
      setNama(initialData.nama)
      setKodeSingkatan(initialData.kodeSingkatan || "")
      setTanggalMulai(new Date(initialData.tanggalMulai).toISOString().split("T")[0])
      setTanggalAkhir(new Date(initialData.tanggalAkhir).toISOString().split("T")[0])
      setWarnaHex(initialData.warnaHex || "#4f46e5")
      setAllowAbsensiRfid(initialData.allowAbsensiRfid)
      setKeterangan(initialData.keterangan || "")
    } else {
      const todayStr = presetDate || new Date().toISOString().split("T")[0]
      setKategori("NON_EFEKTIF")
      setNama("")
      setKodeSingkatan("")
      setTanggalMulai(todayStr)
      setTanggalAkhir(todayStr)
      setWarnaHex(KATEGORI_KALDIK_LABEL.NON_EFEKTIF.defaultWarna)
      setAllowAbsensiRfid(false)
      setKeterangan("")
    }
    setErrorMsg(null)
  }, [initialData, presetDate, isOpen])

  const handleKategoriChange = (newKat: KategoriKaldik) => {
    setKategori(newKat)
    const meta = KATEGORI_KALDIK_LABEL[newKat]
    if (meta) {
      setWarnaHex(meta.defaultWarna)
      if (!initialData) {
        setKodeSingkatan(meta.singkatan)
        // Otomatis centang RFID jika Asesmen/Matsama/Libur Semester
        if (newKat === "NON_EFEKTIF" || newKat === "HEF" || newKat === "LIBUR_SEMESTER") {
          setAllowAbsensiRfid(true)
        } else {
          setAllowAbsensiRfid(false)
        }
      }
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg(null)

    const formData = new FormData()
    if (initialData?.id) {
      formData.set("id", String(initialData.id))
    }
    formData.set("tahunAjaranId", String(tahunAjaranId))
    if (semesterId) {
      formData.set("semesterId", String(semesterId))
    }
    formData.set("kategori", kategori)
    formData.set("nama", nama)
    formData.set("kodeSingkatan", kodeSingkatan)
    formData.set("tanggalMulai", tanggalMulai)
    formData.set("tanggalAkhir", tanggalAkhir)
    formData.set("warnaHex", warnaHex)
    formData.set("allowAbsensiRfid", allowAbsensiRfid ? "true" : "false")
    formData.set("keterangan", keterangan)

    startTransition(async () => {
      const res = await upsertKaldikAgenda(formData)
      if (res.success) {
        if (onSuccess) onSuccess()
        onClose()
      } else {
        setErrorMsg(res.message)
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary font-semibold text-lg">
            <CalendarPlus className="w-5 h-5" />
            <span>{initialData ? "Ubah Agenda Kalender Pendidikan" : "Tambah Agenda Kalender Pendidikan"}</span>
          </div>
          <DialogDescription>
            Tentukan agenda resmi madrasah/pesantren sesuai klasifikasi Ditjen Pendis Kemenag RI.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {errorMsg && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Kategori Agenda Standar Kemenag */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Kategori Standar Kemenag *</Label>
            <Select value={kategori} onValueChange={(val) => handleKategoriChange(val as KategoriKaldik)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Kategori Agenda" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(KATEGORI_KALDIK_LABEL).map(([key, item]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.defaultWarna }}
                      />
                      <span className="font-medium">{item.label}</span>
                      <span className="text-xs text-muted-foreground">({item.singkatan})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {KATEGORI_KALDIK_LABEL[kategori]?.deskripsi}
            </p>
          </div>

          {/* Nama Agenda & Singkatan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-sm font-semibold">Nama Agenda / Kegiatan *</Label>
              <Input
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Misal: Asesmen Sumatif Akhir Semester (ASAS)"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Kode Singkatan</Label>
              <Input
                value={kodeSingkatan}
                onChange={(e) => setKodeSingkatan(e.target.value)}
                placeholder="Misal: ASAS"
              />
            </div>
          </div>

          {/* Rentang Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Tanggal Mulai *</Label>
              <Input
                type="date"
                value={tanggalMulai}
                onChange={(e) => {
                  setTanggalMulai(e.target.value)
                  if (!tanggalAkhir || tanggalAkhir < e.target.value) {
                    setTanggalAkhir(e.target.value)
                  }
                }}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Tanggal Selesai *</Label>
              <Input
                type="date"
                value={tanggalAkhir}
                onChange={(e) => setTanggalAkhir(e.target.value)}
                min={tanggalMulai}
                required
              />
            </div>
          </div>

          {/* Pilihan Warna Badge / Kalender */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Warna Penanda Kalender</Label>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  onClick={() => setWarnaHex(c.hex)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    warnaHex === c.hex ? "scale-110 border-foreground shadow-sm" : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              <div className="flex items-center gap-1.5 ml-2">
                <input
                  type="color"
                  value={warnaHex}
                  onChange={(e) => setWarnaHex(e.target.value)}
                  className="w-8 h-8 rounded border border-border cursor-pointer p-0.5"
                />
                <span className="text-xs font-mono text-muted-foreground">{warnaHex}</span>
              </div>
            </div>
          </div>

          {/* Flag Fleksibel Presensi RFID */}
          <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl space-y-1.5">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <Checkbox
                checked={allowAbsensiRfid}
                onCheckedChange={(c) => setAllowAbsensiRfid(!!c)}
                className="mt-0.5"
              />
              <div className="text-sm">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-primary" />
                  <span>Izinkan Presensi RFID Berjalan</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Centang opsi ini jika santri, dewan guru, atau petugas piket <strong>tetap wajib/diizinkan tap kartu RFID</strong> pada tanggal ini (contoh: masa ujian asesmen, kegiatan pondok ramadhan, atau libur semester).
                </div>
              </div>
            </label>
          </div>

          {/* Keterangan Tambahan */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Catatan / Keterangan Tambahan</Label>
            <Textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Catatan pelaksanaan, instruksi pakaian santri, atau ketentuan khusus..."
              rows={2}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {initialData ? "Simpan Perubahan" : "Tambahkan Agenda"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
