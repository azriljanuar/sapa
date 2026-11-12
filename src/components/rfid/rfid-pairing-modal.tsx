"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CreditCard,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Radio,
} from "lucide-react"
import { pairRfidCard } from "@/lib/rfid-actions"

export type RfidTarget = {
  id: number
  nama: string
  nomorInduk: string
  currentRfid?: string | null
  tipe: "SANTRI" | "GURU"
}

interface RfidPairingModalProps {
  isOpen: boolean
  onClose: () => void
  target: RfidTarget | null
  onSuccess?: (newRfid: string | null) => void
}

export function RfidPairingModal({
  isOpen,
  onClose,
  target,
  onSuccess,
}: RfidPairingModalProps) {
  const [rfidInput, setRfidInput] = useState("")
  const [isDetecting, setIsDetecting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (target) {
      setRfidInput(target.currentRfid || "")
      setErrorMsg(null)
      setSuccessMsg(null)
    }
  }, [target, isOpen])

  if (!target) return null

  const handleDetectLastTap = async () => {
    setIsDetecting(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const res = await fetch("/api/absensi-rfid/last-tap")
      const data = await res.json()

      if (data.success && data.rfidUid) {
        setRfidInput(data.rfidUid)
        setSuccessMsg(
          `Kartu UID "${data.rfidUid}" berhasil terdeteksi dari ${
            data.kodePerangkat || "perangkat IoT"
          }!`
        )
      } else {
        setErrorMsg(
          data.message ||
            "Belum ada kartu baru yang ditap di alat. Tempelkan kartu ke alat ESP32 terlebih dahulu."
        )
      }
    } catch (err: any) {
      setErrorMsg("Gagal menghubungi server: " + (err.message || "Error jaringan"))
    } finally {
      setIsDetecting(false)
    }
  }

  const handleSave = async (uidToSave?: string | null) => {
    const finalUid = uidToSave !== undefined ? uidToSave : rfidInput
    setIsSaving(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const res = await pairRfidCard({
        id: target.id,
        tipe: target.tipe,
        rfidCardId: finalUid,
      })

      if (res.success) {
        onSuccess?.(finalUid ? finalUid.trim().toUpperCase() : null)
        onClose()
      } else {
        setErrorMsg(res.error || "Gagal menyimpan kartu RFID.")
      }
    } catch (err: any) {
      setErrorMsg("Terjadi kesalahan: " + (err.message || "Unknown error"))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                Daftarkan Kartu RFID {target.tipe === "SANTRI" ? "Santri" : "Guru"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Hubungkan kartu pintar fisik dengan data pengguna di sistem SAPA.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Info Pengguna */}
          <div className="p-3 bg-muted/50 rounded-xl border border-border flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                {target.tipe === "SANTRI" ? "Nama Santri (NISN)" : "Nama Guru (NIP)"}
              </div>
              <div className="font-bold text-foreground text-sm mt-0.5">
                {target.nama}
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                {target.nomorInduk || "-"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground mb-1">Status Kartu:</div>
              {target.currentRfid ? (
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-mono text-xs">
                  {target.currentRfid}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground text-xs">
                  Belum Terdaftar
                </Badge>
              )}
            </div>
          </div>

          {/* Form Input & Deteksi Otomatis */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              Nomor UID Kartu RFID
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Contoh: A1B2C3D4"
                value={rfidInput}
                onChange={(e) => setRfidInput(e.target.value.toUpperCase())}
                className="font-mono uppercase tracking-wider"
              />
              <Button
                type="button"
                variant="outline"
                className="shrink-0 gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                onClick={handleDetectLastTap}
                disabled={isDetecting || isSaving}
                title="Tarik UID kartu yang baru saja ditap di alat ESP32"
              >
                {isDetecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Ambil Tap Alat</span>
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Radio className="w-3 h-3 text-primary shrink-0" />
              Tempelkan kartu baru ke kotak ESP32, lalu klik tombol &quot;Ambil Tap Alat&quot;.
            </p>
          </div>

          {/* Pesan Sukses / Error */}
          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {target.currentRfid && (
            <Button
              type="button"
              variant="destructive"
              className="sm:mr-auto bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20"
              onClick={() => handleSave(null)}
              disabled={isSaving}
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Lepas Kartu
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving || !rfidInput.trim()}
            className="bg-primary text-primary-foreground font-semibold"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Kartu"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
