"use client"

import { useState, useTransition } from "react"
import { LogOut, Loader2, CheckCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { guruCheckOut } from "./actions"

interface GuruCheckoutButtonProps {
  hasCheckedIn: boolean
  jamMasuk: string | null
  jamPulang: string | null
}

export function GuruCheckoutButton({
  hasCheckedIn,
  jamMasuk,
  jamPulang,
}: GuruCheckoutButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const handleCheckout = () => {
    if (!confirm("Konfirmasi: Apakah Anda yakin ingin melakukan check out presensi pulang sekarang?")) {
      return
    }

    setFeedback(null)
    startTransition(async () => {
      const res = await guruCheckOut()
      if (res.success) {
        setFeedback({ type: "success", message: res.message })
      } else {
        setFeedback({ type: "error", message: res.message })
      }
    })
  }

  // Jika sudah check out (jam pulang terisi)
  if (jamPulang) {
    const formattedPulang = new Date(jamPulang).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
              Sudah Check Out Pulang
            </div>
            <div className="text-[11px] text-emerald-600/90 dark:text-emerald-400/90">
              Tercatat pukul {formattedPulang} WIB. Terima kasih atas dedikasi Anda hari ini!
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Jika sudah masuk tapi belum check out
  if (hasCheckedIn) {
    const formattedMasuk = jamMasuk
      ? new Date(jamMasuk).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      : "-"

    return (
      <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-700 dark:text-amber-300">
                Presensi Masuk: {formattedMasuk} WIB
              </div>
              <div className="text-[11px] text-amber-600/90 dark:text-amber-400/90">
                Klik tombol di samping saat Anda selesai bertugas dan hendak pulang.
              </div>
            </div>
          </div>

          <Button
            onClick={handleCheckout}
            disabled={isPending}
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-4 py-2 h-auto rounded-lg shadow-2xs gap-1.5 transition-colors shrink-0"
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <LogOut className="w-3.5 h-3.5" />
                Check Out Pulang
              </>
            )}
          </Button>
        </div>

        {feedback && (
          <div
            className={`text-xs p-2 rounded-lg font-medium ${
              feedback.type === "success"
                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                : "bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30"
            }`}
          >
            {feedback.message}
          </div>
        )}
      </div>
    )
  }

  // Jika belum absen sama sekali
  return null
}
