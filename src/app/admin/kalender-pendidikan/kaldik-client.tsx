"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Hari, KaldikAgenda, SistemHariSekolah } from "@prisma/client"
import { MatriksSemesterSummary, KATEGORI_KALDIK_LABEL } from "@/lib/kaldik-types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CalendarDays,
  Plus,
  Settings2,
  Sparkles,
  Radio,
  Trash2,
  Edit,
  Table,
  Calendar,
  ListOrdered,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowUpDown,
} from "lucide-react"
import { KalenderVisualView } from "./kalender-visual-view"
import { MatriksKaldikView } from "./matriks-kaldik-view"
import { AgendaModal } from "./agenda-modal"
import { PengaturanHariSekolahModal } from "./pengaturan-hari-sekolah-modal"
import { deleteKaldikAgenda, applyTemplateKaldikKemenag } from "./actions"
import { setSelectedSemesterCookie } from "@/lib/ta-actions"

interface TahunAjaranWithSemesters {
  id: number
  nama: string
  isActive: boolean
  semester: {
    id: number
    nama: string
    isActive: boolean
  }[]
}

interface KaldikClientProps {
  summary: MatriksSemesterSummary
  allAgendas: KaldikAgenda[]
  allTahunAjarans: TahunAjaranWithSemesters[]
  currentSemesterId: number | null
}

export default function KaldikClient({
  summary,
  allAgendas,
  allTahunAjarans = [],
  currentSemesterId,
}: KaldikClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("kalender")

  // Modals state
  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false)
  const [editingAgenda, setEditingAgenda] = useState<KaldikAgenda | null>(null)
  const [presetDate, setPresetDate] = useState<string | undefined>(undefined)

  const [isSettingModalOpen, setIsSettingModalOpen] = useState(false)
  const [isPendingTemplate, startTransitionTemplate] = useTransition()
  const [isPendingDelete, startTransitionDelete] = useTransition()
  const [isPendingSwitch, startTransitionSwitch] = useTransition()

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Current selected TA
  const activeTaObj = allTahunAjarans.find((ta) => ta.id === summary.tahunAjaranId) || allTahunAjarans[0]
  const availableSemesters = activeTaObj?.semester || []

  const handlePeriodChange = (taId: number, semId?: number) => {
    startTransitionSwitch(async () => {
      const targetTa = allTahunAjarans.find((t) => t.id === taId)
      const targetSem = semId
        ? targetTa?.semester.find((s) => s.id === semId)
        : targetTa?.semester[0]

      if (targetSem) {
        await setSelectedSemesterCookie(targetSem.id)
      }

      router.push(`/admin/kalender-pendidikan?taId=${taId}${targetSem ? `&semesterId=${targetSem.id}` : ""}`)
    })
  }

  const handleOpenAddModal = (dateStr?: string) => {
    setEditingAgenda(null)
    setPresetDate(dateStr)
    setIsAgendaModalOpen(true)
  }

  const handleOpenEditModal = (agenda: KaldikAgenda) => {
    setEditingAgenda(agenda)
    setPresetDate(undefined)
    setIsAgendaModalOpen(true)
  }

  const handleDeleteAgenda = (agenda: KaldikAgenda) => {
    if (!confirm(`Konfirmasi: Apakah Anda yakin ingin menghapus agenda "${agenda.nama}"?`)) {
      return
    }

    setFeedback(null)
    startTransitionDelete(async () => {
      const res = await deleteKaldikAgenda(agenda.id)
      if (res.success) {
        setFeedback({ type: "success", text: res.message })
        router.refresh()
      } else {
        setFeedback({ type: "error", text: res.message })
      }
    })
  }

  const handleApplyTemplate = () => {
    if (
      !confirm(
        `Apakah Anda ingin menerapkan agenda acuan resmi Kemenag untuk Semester ${summary.semesterNama}? Agenda bawaan akan otomatis ditambahkan.`
      )
    ) {
      return
    }

    setFeedback(null)
    startTransitionTemplate(async () => {
      const res = await applyTemplateKaldikKemenag(
        summary.tahunAjaranId,
        summary.semesterNama as "GANJIL" | "GENAP"
      )
      if (res.success) {
        setFeedback({ type: "success", text: res.message })
        router.refresh()
      } else {
        setFeedback({ type: "error", text: res.message })
      }
    })
  }

  const formatTanggalRange = (mulai: Date | string, akhir: Date | string) => {
    const d1 = new Date(mulai).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    const d2 = new Date(akhir).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    return d1 === d2 ? d1 : `${d1} s.d. ${d2}`
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Utama Modul Kaldik */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <CalendarDays className="h-7 w-7 text-primary" />
              Kalender Pendidikan (Kaldik)
            </h1>
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
              Standar Kemenag RI
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Penanggalan akademik madrasah/pesantren • Sesuai Tahun Ajaran dan Semester yang sedang berjalan
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSettingModalOpen(true)}
            className="gap-1.5"
          >
            <Settings2 className="w-4 h-4 text-muted-foreground" />
            <span>Sistem Hari Sekolah</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleApplyTemplate}
            disabled={isPendingTemplate}
            className="gap-1.5"
          >
            {isPendingTemplate ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-600" />
            )}
            <span>Template Kemenag</span>
          </Button>

          <Button size="sm" onClick={() => handleOpenAddModal()} className="gap-1.5">
            <Plus className="w-4 h-4" />
            <span>Tambah Agenda</span>
          </Button>
        </div>
      </div>

      {/* Bar Pemilih Periode Akademik (Tahun Ajaran & Semester) */}
      <div className="bg-card p-3 sm:p-4 rounded-xl border border-border shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Pemilih Tahun Ajaran */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
              Tahun Ajaran:
            </span>
            <Select
              value={String(summary.tahunAjaranId)}
              onValueChange={(val) => {
                if (val) handlePeriodChange(parseInt(val))
              }}
              disabled={isPendingSwitch}
            >
              <SelectTrigger className="w-[140px] sm:w-[160px] h-9 text-xs sm:text-sm font-semibold">
                <SelectValue placeholder="Pilih Tahun Ajaran" />
              </SelectTrigger>
              <SelectContent>
                {allTahunAjarans.map((ta) => (
                  <SelectItem key={ta.id} value={String(ta.id)}>
                    <div className="flex items-center gap-1.5">
                      <span>{ta.nama}</span>
                      {ta.isActive && (
                        <span className="text-[10px] text-primary font-bold">(Aktif)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pemilih Semester */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
              Semester:
            </span>
            <Select
              value={String(currentSemesterId || summary.semesterId || "")}
              onValueChange={(val) => {
                if (val) handlePeriodChange(summary.tahunAjaranId, parseInt(val))
              }}
              disabled={isPendingSwitch}
            >
              <SelectTrigger className="w-[150px] sm:w-[170px] h-9 text-xs sm:text-sm font-semibold">
                <SelectValue placeholder="Pilih Semester" />
              </SelectTrigger>
              <SelectContent>
                {availableSemesters.map((sem) => (
                  <SelectItem key={sem.id} value={String(sem.id)}>
                    <span>Semester {sem.nama}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Info Cepat Status Periode */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isPendingSwitch ? (
            <div className="flex items-center gap-1 text-primary">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Memuat periode...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-medium border-border">
                {summary.sistemHariSekolah === "ENAM_HARI"
                  ? "6 Hari Sekolah (Senin-Sabtu)"
                  : summary.sistemHariSekolah === "LIMA_HARI"
                  ? "5 Hari Sekolah (Senin-Jumat)"
                  : summary.sistemHariSekolah === "PESANTREN_JUMAT"
                  ? "Pesantren (Libur Jumat)"
                  : "Kustom"}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Alert Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-sm ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-950 dark:text-emerald-100"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-800 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold hover:underline opacity-80"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Tab Konten Utama */}
      <Tabs defaultValue="kalender" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="kalender" className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>Kalender Visual</span>
          </TabsTrigger>
          <TabsTrigger value="matriks" className="flex items-center gap-1.5">
            <Table className="w-4 h-4" />
            <span>Matriks Kemenag (MEB/HEB)</span>
          </TabsTrigger>
          <TabsTrigger value="agenda" className="flex items-center gap-1.5">
            <ListOrdered className="w-4 h-4" />
            <span>Daftar Agenda ({allAgendas.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Kalender Visual */}
        <TabsContent value="kalender">
          <KalenderVisualView
            daftarBulan={summary.daftarBulan}
            hariLiburRutin={summary.hariLiburRutin}
            onSelectDate={(dateStr) => handleOpenAddModal(dateStr)}
            onEditAgenda={(agenda) => handleOpenEditModal(agenda)}
          />
        </TabsContent>

        {/* Tab 2: Matriks Kemenag */}
        <TabsContent value="matriks">
          <MatriksKaldikView summary={summary} />
        </TabsContent>

        {/* Tab 3: Daftar Agenda Lengkap */}
        <TabsContent value="agenda">
          <Card className="shadow-xs overflow-hidden">
            <CardHeader className="pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-bold">Daftar Agenda & Libur Kaldik</CardTitle>
                <CardDescription className="text-xs">
                  Seluruh agenda terdaftar pada Tahun Ajaran {summary.tahunAjaranNama} (Semester {summary.semesterNama})
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => handleOpenAddModal()} className="gap-1.5 self-start sm:self-auto">
                <Plus className="w-4 h-4" />
                <span>Tambah Agenda</span>
              </Button>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              {allAgendas.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Belum ada agenda yang ditambahkan untuk Tahun Ajaran ini. Klik tombol <strong>Template Kemenag</strong> untuk menambahkan acuan agenda otomatis atau klik <strong>Tambah Agenda</strong>.
                </div>
              ) : (
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/70 text-foreground font-semibold border-b border-border">
                      <th className="py-2.5 px-3 border-r border-border w-10 text-center">No</th>
                      <th className="py-2.5 px-3 border-r border-border min-w-[220px]">Nama Agenda</th>
                      <th className="py-2.5 px-3 border-r border-border min-w-[130px]">Kategori</th>
                      <th className="py-2.5 px-3 border-r border-border min-w-[180px]">Rentang Tanggal</th>
                      <th className="py-2.5 px-3 border-r border-border text-center min-w-[100px]">Presensi RFID</th>
                      <th className="py-2.5 px-3 border-r border-border">Keterangan</th>
                      <th className="py-2.5 px-3 text-center w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allAgendas.map((item, idx) => {
                      const meta = KATEGORI_KALDIK_LABEL[item.kategori]
                      const color = item.warnaHex || meta?.defaultWarna || "#3b82f6"

                      return (
                        <tr key={item.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-3 border-r border-border text-center text-muted-foreground">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 border-r border-border">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: color }}
                              />
                              <span className="font-semibold text-foreground">{item.nama}</span>
                              {item.kodeSingkatan && (
                                <Badge variant="outline" className="text-[10px] py-0 px-1 border-muted-foreground/30">
                                  {item.kodeSingkatan}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 border-r border-border">
                            <span className="font-medium text-foreground">{meta?.label || item.kategori}</span>
                          </td>
                          <td className="py-2.5 px-3 border-r border-border font-medium text-foreground">
                            {formatTanggalRange(item.tanggalMulai, item.tanggalAkhir)}
                          </td>
                          <td className="py-2.5 px-3 border-r border-border text-center">
                            {item.allowAbsensiRfid ? (
                              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-transparent shadow-none gap-1">
                                <Radio className="w-3 h-3" />
                                <span>Diizinkan</span>
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground border-border shadow-none">
                                Ditolak
                              </Badge>
                            )}
                          </td>
                          <td className="py-2.5 px-3 border-r border-border text-muted-foreground max-w-[220px] truncate">
                            {item.keterangan || "-"}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => handleOpenEditModal(item)}
                                title="Edit Agenda"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteAgenda(item)}
                                disabled={isPendingDelete}
                                title="Hapus Agenda"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Form Tambah / Edit Agenda */}
      <AgendaModal
        isOpen={isAgendaModalOpen}
        onClose={() => setIsAgendaModalOpen(false)}
        tahunAjaranId={summary.tahunAjaranId}
        semesterId={summary.semesterId}
        initialData={editingAgenda}
        presetDate={presetDate}
        onSuccess={() => {
          router.refresh()
          setFeedback({ type: "success", text: "Data agenda berhasil disimpan." })
        }}
      />

      {/* Modal Pengaturan Sistem Hari Sekolah */}
      <PengaturanHariSekolahModal
        isOpen={isSettingModalOpen}
        onClose={() => setIsSettingModalOpen(false)}
        tahunAjaranId={summary.tahunAjaranId}
        tahunAjaranNama={summary.tahunAjaranNama}
        initialSistem={summary.sistemHariSekolah}
        initialHariLibur={summary.hariLiburRutin}
        onSuccess={() => {
          router.refresh()
          setFeedback({ type: "success", text: "Pengaturan hari sekolah berhasil diperbarui." })
        }}
      />
    </div>
  )
}
