"use client"

import { useState, useRef, useEffect } from "react"
import { QRCodeSVG } from "qrcode.react"
import { toPng } from "html-to-image"
import jsPDF from "jspdf"
import { TipeKartu } from "@prisma/client"
import { 
  Download, Eye, Search, Printer, 
  IdCard, Users, GraduationCap, X, RefreshCw 
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  getPiketTemplateAction,
  getPiketGuruListAction,
  getPiketSantriListAction,
} from "./actions"

export function GuruPiketKartuClient({
  activeTaName,
}: {
  activeTaName: string
}) {
  const [activeTab, setActiveTab] = useState<"SANTRI" | "GURU">("SANTRI")

  const [guruTemplate, setGuruTemplate] = useState<{ frontUrl: string | null; backUrl: string | null }>({
    frontUrl: null,
    backUrl: null,
  })
  const [santriTemplate, setSantriTemplate] = useState<{ frontUrl: string | null; backUrl: string | null }>({
    frontUrl: null,
    backUrl: null,
  })

  const [guruList, setGuruList] = useState<any[]>([])
  const [santriList, setSantriList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const frontRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  // State for preview modal
  const [previewUser, setPreviewUser] = useState<{ user: any; tipe: TipeKartu } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [tGuru, tSantri, gurus, santris] = await Promise.all([
        getPiketTemplateAction("GURU"),
        getPiketTemplateAction("SANTRI"),
        getPiketGuruListAction(),
        getPiketSantriListAction(),
      ])

      if (tGuru) setGuruTemplate({ frontUrl: tGuru.frontUrl, backUrl: tGuru.backUrl })
      if (tSantri) setSantriTemplate({ frontUrl: tSantri.frontUrl, backUrl: tSantri.backUrl })
      setGuruList(gurus)
      setSantriList(santris)
    } catch (err) {
      console.error("Gagal memuat data kartu identitas:", err)
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = async () => {
    if (!frontRef.current || !backRef.current || !previewUser) return
    setDownloading(true)
    try {
      const frontDataUrl = await toPng(frontRef.current, { cacheBust: true, quality: 1, pixelRatio: 2 })
      const backDataUrl = await toPng(backRef.current, { cacheBust: true, quality: 1, pixelRatio: 2 })

      // CR80 dimensions in mm: 54mm x 85.6mm (portrait)
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [54, 85.6],
      })

      // Add front page
      pdf.addImage(frontDataUrl, "PNG", 0, 0, 54, 85.6)

      // Add back page
      pdf.addPage()
      pdf.addImage(backDataUrl, "PNG", 0, 0, 54, 85.6)

      const name = previewUser.user.nama || previewUser.user.namaLengkap
      const fileName = `ID_Card_${previewUser.tipe}_${name.replace(/\s+/g, "_")}.pdf`
      pdf.save(fileName)
    } catch (err) {
      console.error(err)
      alert("Gagal mengunduh kartu dalam format PDF")
    } finally {
      setDownloading(false)
    }
  }

  const renderCardPreviewFront = (user: any, tipe: TipeKartu, template: any, innerRef?: any) => (
    <div
      ref={innerRef}
      className="relative w-[340px] h-[540px] bg-white rounded-xl shadow-lg overflow-hidden shrink-0 border"
    >
      {template.frontUrl && (
        <img
          src={template.frontUrl}
          className="absolute inset-0 w-full h-full object-cover"
          alt="Template Depan"
        />
      )}

      {/* Container Foto dan Teks */}
      <div className="absolute inset-0 flex flex-col items-center pt-[180px]">
        {/* Foto Wajah */}
        <div className="w-[120px] h-[150px] bg-slate-200 rounded-lg overflow-hidden border-2 border-white shadow-md">
          {user.fotoWajah ? (
            <img src={user.fotoWajah} alt="Foto" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
              No Photo
            </div>
          )}
        </div>

        {/* Data Diri */}
        <div className="mt-8 text-center px-4 w-full">
          <h2 className="text-xl font-bold text-slate-800 uppercase leading-tight line-clamp-2">
            {user.nama || user.namaLengkap}
          </h2>
          <p className="text-xs font-semibold text-slate-600 mt-2">
            {tipe === "GURU" ? "NIP / NIK" : "NISN"}
          </p>
          <p className="text-sm text-slate-900 font-bold font-mono">
            {tipe === "GURU" ? user.nip || "-" : user.nisn || "-"}
          </p>
          {tipe === "SANTRI" && user.namaKelas && (
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Kelas: {user.namaKelas}
            </p>
          )}
        </div>
      </div>
    </div>
  )

  const renderCardPreviewBack = (user: any, tipe: TipeKartu, template: any, innerRef?: any) => {
    const qrData = JSON.stringify({
      type: tipe,
      id: user.id,
      identity: tipe === "GURU" ? user.nip : user.nisn,
      name: user.nama || user.namaLengkap,
    })

    return (
      <div
        ref={innerRef}
        className="relative w-[340px] h-[540px] bg-white rounded-xl shadow-lg overflow-hidden shrink-0 border"
      >
        {template.backUrl && (
          <img
            src={template.backUrl}
            className="absolute inset-0 w-full h-full object-cover"
            alt="Template Belakang"
          />
        )}

        {/* Container QR Code di Belakang */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <QRCodeSVG value={qrData} size={150} level="M" />
          </div>
          <p className="mt-4 text-xs font-mono text-slate-600 bg-white/90 px-3 py-1 rounded-full border shadow-xs">
            ID: {user.id.toString().padStart(6, "0")}
          </p>
        </div>
      </div>
    )
  }

  const activeTemplate = previewUser?.tipe === "GURU" ? guruTemplate : santriTemplate

  const filteredSantri = santriList.filter((s) => {
    const query = searchQuery.toLowerCase()
    return (
      s.namaLengkap.toLowerCase().includes(query) ||
      s.nisn.includes(query) ||
      (s.namaKelas && s.namaKelas.toLowerCase().includes(query))
    )
  })

  const filteredGuru = guruList.filter((g) => {
    const query = searchQuery.toLowerCase()
    return (
      g.nama.toLowerCase().includes(query) ||
      (g.nip && g.nip.includes(query))
    )
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Cetak Kartu Identitas (Piket)
            </h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              {activeTaName}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Fasilitas pencetakan dan preview ID Card untuk santri atau guru di pos piket.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={loading}
          className="gap-2 shrink-0"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Segarkan Data
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <TabsList className="bg-muted p-1">
            <TabsTrigger value="SANTRI" className="gap-2">
              <GraduationCap className="w-4 h-4" />
              Kartu Santri ({santriList.length})
            </TabsTrigger>
            <TabsTrigger value="GURU" className="gap-2">
              <Users className="w-4 h-4" />
              Kartu Guru ({guruList.length})
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={activeTab === "SANTRI" ? "Cari nama santri, NISN, kelas..." : "Cari nama guru, NIP..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
        </div>

        {/* Tab Santri */}
        <TabsContent value="SANTRI" className="mt-4">
          <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-12 text-center">No</TableHead>
                  <TableHead>Santri</TableHead>
                  <TableHead>NISN</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                      Memuat data santri...
                    </TableCell>
                  </TableRow>
                ) : filteredSantri.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      Tidak ada santri ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSantri.map((s, idx) => (
                    <TableRow key={s.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-center font-medium text-muted-foreground text-sm">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9 border shrink-0">
                            <AvatarImage src={s.fotoWajah || undefined} alt={s.namaLengkap} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                              {s.namaLengkap.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-sm text-foreground">
                            {s.namaLengkap}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {s.nisn}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {s.namaKelas}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewUser({ user: s, tipe: "SANTRI" })}
                          className="gap-1.5 text-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Lihat Kartu
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Tab Guru */}
        <TabsContent value="GURU" className="mt-4">
          <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-12 text-center">No</TableHead>
                  <TableHead>Guru</TableHead>
                  <TableHead>NIP</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                      Memuat data guru...
                    </TableCell>
                  </TableRow>
                ) : filteredGuru.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      Tidak ada guru ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGuru.map((g, idx) => (
                    <TableRow key={g.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-center font-medium text-muted-foreground text-sm">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9 border shrink-0">
                            <AvatarImage src={g.fotoWajah || undefined} alt={g.nama} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                              {g.nama.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-sm text-foreground">
                            {g.nama}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {g.nip || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewUser({ user: g, tipe: "GURU" })}
                          className="gap-1.5 text-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Lihat Kartu
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Preview & Download ID Card */}
      <Dialog open={!!previewUser} onOpenChange={(open) => !open && setPreviewUser(null)}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Preview Kartu Identitas: {previewUser?.user.nama || previewUser?.user.namaLengkap}
            </DialogTitle>
          </DialogHeader>

          {previewUser && (
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
                {/* Bagian Depan */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Bagian Depan
                  </span>
                  {renderCardPreviewFront(
                    previewUser.user,
                    previewUser.tipe,
                    activeTemplate,
                    frontRef
                  )}
                </div>

                {/* Bagian Belakang */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Bagian Belakang (QR Code)
                  </span>
                  {renderCardPreviewBack(
                    previewUser.user,
                    previewUser.tipe,
                    activeTemplate,
                    backRef
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPreviewUser(null)}>
              Tutup
            </Button>
            <Button onClick={downloadPDF} disabled={downloading} className="gap-2">
              <Download className="w-4 h-4" />
              {downloading ? "Mengunduh PDF..." : "Unduh Kartu (PDF)"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
