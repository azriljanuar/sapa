"use client"

import { useState, useTransition } from "react"
import { Clock, Settings, Save, Loader2, CheckCircle2, AlertCircle, Info, Edit, UserCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Hari } from "@prisma/client"
import { updatePengaturanAbsensi, updateKehadiranGuruManual } from "./actions"
import { ManajemenHariLibur } from "./manajemen-hari-libur"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface PengaturanAbsensiData {
  id: number
  jamMasukMulai: string
  jamMasukBatas: string
  jamPulangMulai: string
  jamPulangSelesai: string
  toleransiTerlambat: number
}

interface GuruItem {
  id: number
  nama: string
  nip?: string | null
  status?: string | null
  jamMasuk?: string | null
  jamPulang?: string | null
  keterangan?: string | null
}

interface HariLiburData {
  mingguan: Hari[]
  kondisional: any[]
  semester: any[]
}

interface ManajemenAbsensiTabProps {
  initialConfig: PengaturanAbsensiData
  initialHariLibur?: HariLiburData
  jenjangId?: number
  guruList?: GuruItem[]
  selectedTanggal?: string
  onRefreshGuru?: () => void
  onRefreshHariLibur?: () => void
}

export function ManajemenAbsensiTab({
  initialConfig,
  initialHariLibur = { mingguan: [], kondisional: [], semester: [] },
  jenjangId,
  guruList = [],
  selectedTanggal = new Date().toISOString().split("T")[0],
  onRefreshGuru,
  onRefreshHariLibur,
}: ManajemenAbsensiTabProps) {
  const [config, setConfig] = useState<PengaturanAbsensiData>(initialConfig)
  const [isPending, startTransition] = useTransition()
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // State untuk Dialog Edit Kehadiran Guru Manual
  const [editingGuru, setEditingGuru] = useState<GuruItem | null>(null)
  const [editStatus, setEditStatus] = useState<"HADIR" | "IZIN" | "SAKIT" | "ALPA">("HADIR")
  const [editJamMasuk, setEditJamMasuk] = useState<string>("")
  const [editJamPulang, setEditJamPulang] = useState<string>("")
  const [editKeterangan, setEditKeterangan] = useState<string>("")
  const [isSubmittingGuru, startSubmitGuru] = useTransition()
  const [guruModalMessage, setGuruModalMessage] = useState<string | null>(null)

  const handleSaveConfig = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatusMessage(null)

    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await updatePengaturanAbsensi(formData)
      if (res.success) {
        setStatusMessage({ type: "success", text: res.message })
      } else {
        setStatusMessage({ type: "error", text: res.message })
      }
    })
  }

  const openEditGuruModal = (guru: GuruItem) => {
    setEditingGuru(guru)
    setEditStatus((guru.status as any) || "HADIR")
    
    // Parse jam masuk jika ada
    if (guru.jamMasuk) {
      const d = new Date(guru.jamMasuk)
      const hh = String(d.getHours()).padStart(2, "0")
      const mm = String(d.getMinutes()).padStart(2, "0")
      setEditJamMasuk(`${hh}:${mm}`)
    } else {
      setEditJamMasuk("")
    }

    // Parse jam pulang jika ada
    if (guru.jamPulang) {
      const d = new Date(guru.jamPulang)
      const hh = String(d.getHours()).padStart(2, "0")
      const mm = String(d.getMinutes()).padStart(2, "0")
      setEditJamPulang(`${hh}:${mm}`)
    } else {
      setEditJamPulang("")
    }

    setEditKeterangan(guru.keterangan || "")
    setGuruModalMessage(null)
  }

  const handleSaveGuruManual = () => {
    if (!editingGuru) return
    setGuruModalMessage(null)

    const formData = new FormData()
    formData.set("guruId", editingGuru.id.toString())
    formData.set("tanggal", selectedTanggal)
    formData.set("status", editStatus)
    formData.set("jamMasuk", editJamMasuk)
    formData.set("jamPulang", editJamPulang)
    formData.set("keterangan", editKeterangan)

    startSubmitGuru(async () => {
      const res = await updateKehadiranGuruManual(formData)
      if (res.success) {
        setEditingGuru(null)
        if (onRefreshGuru) onRefreshGuru()
      } else {
        setGuruModalMessage(res.message)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Kartu Informasi Kebijakan Absensi Guru & Santri */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">Kebijakan Presensi Terkini</h4>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">
              • <strong>Absensi Guru:</strong> Setiap scan kartu RFID guru akan selalu tercatat <strong>HADIR</strong>. Guru dapat melakukan check out pulang langsung secara mandiri melalui tombol di dashboard guru masing-masing.<br />
              • <strong>Absensi Santri:</strong> Santri yang scan RFID melebihi batas jam masuk akan otomatis berstatus <strong>TERLAMBAT</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Form Pengaturan Jam Masuk & Pulang */}
      <Card className="border-border shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <Settings className="w-5 h-5" />
            <CardTitle className="text-lg">Pengaturan Jam Masuk & Pulang</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Atur rentang jam operasional absensi mesin RFID dan sistem presensi sekolah.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveConfig} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Kolom 1: Jam Masuk */}
              <div className="space-y-4 p-4 rounded-xl bg-muted/40 border border-border/60">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Presensi Masuk
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="jamMasukMulai" className="text-xs font-semibold">
                    Jam Mulai Buka Absen Masuk
                  </Label>
                  <Input
                    id="jamMasukMulai"
                    name="jamMasukMulai"
                    type="time"
                    value={config.jamMasukMulai}
                    onChange={(e) => setConfig({ ...config, jamMasukMulai: e.target.value })}
                    required
                    className="bg-background text-sm font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Mesin RFID mulai menerima scan masuk sejak jam ini.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="jamMasukBatas" className="text-xs font-semibold">
                    Batas Jam Masuk (Toleransi Santri)
                  </Label>
                  <Input
                    id="jamMasukBatas"
                    name="jamMasukBatas"
                    type="time"
                    value={config.jamMasukBatas}
                    onChange={(e) => setConfig({ ...config, jamMasukBatas: e.target.value })}
                    required
                    className="bg-background text-sm font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Santri yang scan setelah jam ini otomatis berstatus <strong>TERLAMBAT</strong>.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="toleransiTerlambat" className="text-xs font-semibold">
                    Toleransi Keterlambatan Santri (Menit)
                  </Label>
                  <Input
                    id="toleransiTerlambat"
                    name="toleransiTerlambat"
                    type="number"
                    min="0"
                    max="120"
                    value={config.toleransiTerlambat}
                    onChange={(e) => setConfig({ ...config, toleransiTerlambat: parseInt(e.target.value) || 0 })}
                    className="bg-background text-sm font-mono"
                  />
                </div>
              </div>

              {/* Kolom 2: Jam Pulang */}
              <div className="space-y-4 p-4 rounded-xl bg-muted/40 border border-border/60">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Presensi Pulang
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="jamPulangMulai" className="text-xs font-semibold">
                    Jam Mulai Buka Absen Pulang
                  </Label>
                  <Input
                    id="jamPulangMulai"
                    name="jamPulangMulai"
                    type="time"
                    value={config.jamPulangMulai}
                    onChange={(e) => setConfig({ ...config, jamPulangMulai: e.target.value })}
                    required
                    className="bg-background text-sm font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Waktu awal diperbolehkannya tap RFID pulang dan check out pulang.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="jamPulangSelesai" className="text-xs font-semibold">
                    Jam Selesai / Tutup Absen Pulang
                  </Label>
                  <Input
                    id="jamPulangSelesai"
                    name="jamPulangSelesai"
                    type="time"
                    value={config.jamPulangSelesai}
                    onChange={(e) => setConfig({ ...config, jamPulangSelesai: e.target.value })}
                    required
                    className="bg-background text-sm font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Batas akhir waktu pelayanan tap kepulangan santri & pendidik.
                  </p>
                </div>
              </div>

            </div>

            {statusMessage && (
              <div
                className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  statusMessage.type === "success"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                }`}
              >
                {statusMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                {statusMessage.text}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-5 py-2.5 rounded-lg shadow-xs gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Simpan Pengaturan Jam Absensi
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Bagian Manajemen Hari Libur (Mingguan, Kondisional, Semester) */}
      <ManajemenHariLibur
        initialMingguan={initialHariLibur.mingguan}
        initialKondisional={initialHariLibur.kondisional}
        initialSemester={initialHariLibur.semester}
        jenjangId={jenjangId}
        onRefresh={onRefreshHariLibur}
      />

      {/* Bagian Koreksi Manual Kehadiran Guru */}
      {guruList && guruList.length > 0 && (
        <Card className="border-border shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-primary">
                  <UserCheck className="w-5 h-5" />
                  <CardTitle className="text-lg">Koreksi Kehadiran Guru Manual</CardTitle>
                </div>
                <CardDescription className="text-xs mt-0.5">
                  Kelola dan sesuaikan status kehadiran guru untuk tanggal {selectedTanggal} jika ada izin, sakit, atau kendala kartu RFID.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Nama Guru</th>
                      <th className="px-4 py-3 font-semibold text-center">Status</th>
                      <th className="px-4 py-3 font-semibold">Jam Masuk / Pulang</th>
                      <th className="px-4 py-3 font-semibold">Keterangan</th>
                      <th className="px-4 py-3 font-semibold text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {guruList.map((g) => (
                      <tr key={g.id} className="hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">
                          {g.nama}
                          {g.nip && <div className="text-[11px] text-muted-foreground font-mono">{g.nip}</div>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              g.status === "HADIR"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : g.status === "IZIN"
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                : g.status === "SAKIT"
                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                : g.status === "ALPA"
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {g.status || "Belum Absen"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono">
                          {g.jamMasuk ? (
                            <span>
                              {new Date(g.jamMasuk).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                              {g.jamPulang && (
                                <span className="text-muted-foreground">
                                  {" "}— {new Date(g.jamPulang).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground italic truncate max-w-[200px]">
                          {g.keterangan || "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1.5 shadow-2xs"
                            onClick={() => openEditGuruModal(g)}
                          >
                            <Edit className="w-3.5 h-3.5 text-primary" />
                            Koreksi
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Dialog Koreksi Kehadiran Guru */}
      <Dialog open={!!editingGuru} onOpenChange={(open) => !open && setEditingGuru(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Koreksi Kehadiran Guru
            </DialogTitle>
          </DialogHeader>

          {editingGuru && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted/40 rounded-lg border border-border text-xs space-y-1">
                <div><strong>Nama:</strong> {editingGuru.nama}</div>
                <div><strong>Tanggal:</strong> {selectedTanggal}</div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="statusGuru" className="text-xs font-semibold">
                  Status Kehadiran
                </Label>
                <select
                  id="statusGuru"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="HADIR">HADIR</option>
                  <option value="IZIN">IZIN</option>
                  <option value="SAKIT">SAKIT</option>
                  <option value="ALPA">ALPA</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="jamMasukGuru" className="text-xs font-semibold">
                    Jam Masuk (HH:mm)
                  </Label>
                  <Input
                    id="jamMasukGuru"
                    type="time"
                    value={editJamMasuk}
                    onChange={(e) => setEditJamMasuk(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="jamPulangGuru" className="text-xs font-semibold">
                    Jam Pulang (HH:mm)
                  </Label>
                  <Input
                    id="jamPulangGuru"
                    type="time"
                    value={editJamPulang}
                    onChange={(e) => setEditJamPulang(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ketGuru" className="text-xs font-semibold">
                  Keterangan / Alasan
                </Label>
                <Input
                  id="ketGuru"
                  type="text"
                  placeholder="Contoh: Izin dinas luar, sakit demam, dll."
                  value={editKeterangan}
                  onChange={(e) => setEditKeterangan(e.target.value)}
                  className="text-xs"
                />
              </div>

              {guruModalMessage && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs rounded-lg">
                  {guruModalMessage}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingGuru(null)}
              disabled={isSubmittingGuru}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveGuruManual}
              disabled={isSubmittingGuru}
              className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
            >
              {isSubmittingGuru ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
