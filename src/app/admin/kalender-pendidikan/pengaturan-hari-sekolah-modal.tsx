"use client"

import { useState, useTransition } from "react"
import { Hari, SistemHariSekolah } from "@prisma/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Settings2, Info } from "lucide-react"
import { updateSistemHariSekolah } from "./actions"
import { HARI_MAP, HARI_LABEL_ID } from "@/lib/kaldik-types"

interface PengaturanHariSekolahModalProps {
  isOpen: boolean
  onClose: () => void
  tahunAjaranId: number
  tahunAjaranNama: string
  initialSistem: SistemHariSekolah
  initialHariLibur: Hari[]
  onSuccess?: () => void
}

export function PengaturanHariSekolahModal({
  isOpen,
  onClose,
  tahunAjaranId,
  tahunAjaranNama,
  initialSistem,
  initialHariLibur,
  onSuccess,
}: PengaturanHariSekolahModalProps) {
  const [sistem, setSistem] = useState<SistemHariSekolah>(initialSistem || "ENAM_HARI")
  const [hariLibur, setHariLibur] = useState<Hari[]>(initialHariLibur || ["MINGGU"])
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSistemChange = (val: SistemHariSekolah) => {
    setSistem(val)
    if (val === "ENAM_HARI") {
      setHariLibur(["MINGGU"])
    } else if (val === "LIMA_HARI") {
      setHariLibur(["SABTU", "MINGGU"])
    } else if (val === "PESANTREN_JUMAT") {
      setHariLibur(["JUMAT"])
    }
  }

  const toggleHari = (h: Hari) => {
    setHariLibur((prev) => {
      const exists = prev.includes(h)
      const updated = exists ? prev.filter((item) => item !== h) : [...prev, h]
      return updated.length > 0 ? updated : ["MINGGU"]
    })
    setSistem("CUSTOM")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    startTransition(async () => {
      const res = await updateSistemHariSekolah({
        tahunAjaranId,
        sistemHariSekolah: sistem,
        hariLiburRutin: hariLibur,
      })

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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary font-semibold text-lg">
            <Settings2 className="w-5 h-5" />
            <span>Sistem Hari Sekolah & Libur Rutin</span>
          </div>
          <DialogDescription>
            Konfigurasikan sistem operasional KBM untuk Tahun Ajaran <strong>{tahunAjaranNama}</strong>.
            Sistem ini menentukan perhitungan Hari Efektif Belajar (HEB) dan jadwal penolakan RFID otomatis.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {errorMsg && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Opsi Pilihan Cepat Sistem Hari Sekolah */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Pilih Skema Standar</Label>
            <div className="grid grid-cols-1 gap-2.5">
              <label
                onClick={() => handleSistemChange("ENAM_HARI")}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  sistem === "ENAM_HARI" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  name="sistemHari"
                  value="ENAM_HARI"
                  checked={sistem === "ENAM_HARI"}
                  onChange={() => handleSistemChange("ENAM_HARI")}
                  className="mt-0.5 accent-primary"
                />
                <div className="text-sm">
                  <div className="font-medium text-foreground">6 Hari Sekolah (Standar Kemenag / Madrasah)</div>
                  <div className="text-xs text-muted-foreground">KBM: Senin s.d. Sabtu • Libur Rutin: Hari Ahad (Minggu)</div>
                </div>
              </label>

              <label
                onClick={() => handleSistemChange("LIMA_HARI")}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  sistem === "LIMA_HARI" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  name="sistemHari"
                  value="LIMA_HARI"
                  checked={sistem === "LIMA_HARI"}
                  onChange={() => handleSistemChange("LIMA_HARI")}
                  className="mt-0.5 accent-primary"
                />
                <div className="text-sm">
                  <div className="font-medium text-foreground">5 Hari Sekolah (Full Day School)</div>
                  <div className="text-xs text-muted-foreground">KBM: Senin s.d. Jumat • Libur Rutin: Sabtu & Ahad</div>
                </div>
              </label>

              <label
                onClick={() => handleSistemChange("PESANTREN_JUMAT")}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  sistem === "PESANTREN_JUMAT" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  name="sistemHari"
                  value="PESANTREN_JUMAT"
                  checked={sistem === "PESANTREN_JUMAT"}
                  onChange={() => handleSistemChange("PESANTREN_JUMAT")}
                  className="mt-0.5 accent-primary"
                />
                <div className="text-sm">
                  <div className="font-medium text-foreground">Sistem Pesantren (Libur Hari Jumat)</div>
                  <div className="text-xs text-muted-foreground">KBM: Sabtu s.d. Kamis • Libur Rutin: Hari Jumat (Sayyidul Ayyam)</div>
                </div>
              </label>
            </div>
          </div>

          {/* Checklist Kustomisasi Hari Libur Rutin */}
          <div className="space-y-2 pt-2 border-t border-border">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Hari yang Dinyatakan Libur Rutin
            </Label>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {HARI_MAP.map((h) => {
                const checked = hariLibur.includes(h)
                return (
                  <label
                    key={h}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                      checked
                        ? "border-destructive/40 bg-destructive/10 text-destructive font-medium"
                        : "border-border bg-card hover:bg-muted text-foreground"
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleHari(h)}
                      className="data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
                    />
                    <span>{HARI_LABEL_ID[h]}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="p-3 bg-muted/60 rounded-xl flex items-start gap-2.5 text-xs text-muted-foreground">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              Hari yang dicentang sebagai hari libur rutin akan diwarnai merah pada kalender dan mesin RFID akan otomatis menolak tap masuk rutin santri, kecuali ada agenda fakultatif/ujian yang diaktifkan flag RFID-nya.
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
