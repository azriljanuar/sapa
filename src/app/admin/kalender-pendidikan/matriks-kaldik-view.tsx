"use client"

import { MatriksSemesterSummary } from "@/lib/kaldik-types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Printer, CalendarCheck, BookOpen, Clock, AlertTriangle } from "lucide-react"

interface MatriksKaldikViewProps {
  summary: MatriksSemesterSummary
}

export function MatriksKaldikView({ summary }: MatriksKaldikViewProps) {
  const {
    tahunAjaranNama,
    semesterNama,
    sistemHariSekolah,
    daftarBulan,
    totalHk,
    totalLiburRutin,
    totalLiburResmi,
    totalNonEfektif,
    totalHef,
    totalHeb,
    totalMeb,
    totalMte,
    rataRataHebPerBulan,
  } = summary

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Kartu Ringkasan MEB & HEB Standar Kemenag */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-primary/10 border-primary/20 shadow-none">
          <CardHeader className="pb-1">
            <CardDescription className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center justify-between">
              <span>Hari Efektif Belajar</span>
              <BookOpen className="w-4 h-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {totalHeb} <span className="text-sm font-medium text-muted-foreground">Hari</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Rata-rata: {rataRataHebPerBulan} hari / bulan
          </CardContent>
        </Card>

        <Card className="bg-primary/10 border-primary/20 shadow-none">
          <CardHeader className="pb-1">
            <CardDescription className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center justify-between">
              <span>Minggu Efektif (MEB)</span>
              <CalendarCheck className="w-4 h-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {totalMeb} <span className="text-sm font-medium text-muted-foreground">Minggu</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Syarat Kemenag: $\ge 3$ hari HEB / minggu
          </CardContent>
        </Card>

        <Card className="bg-amber-500/10 border-amber-500/20 shadow-none">
          <CardHeader className="pb-1">
            <CardDescription className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center justify-between">
              <span>Minggu Tdk Efektif</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {totalMte} <span className="text-sm font-medium text-muted-foreground">Minggu</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Matsama, Asesmen & Libur Semester
          </CardContent>
        </Card>

        <Card className="bg-muted/60 border-border shadow-none">
          <CardHeader className="pb-1">
            <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Total Hari Kalender</span>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {totalHk} <span className="text-sm font-medium text-muted-foreground">Hari</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Sistem: {sistemHariSekolah.replace("_", " ")}
          </CardContent>
        </Card>
      </div>

      {/* Tabel Matriks Rekapitulasi Standar Lampiran Kemenag */}
      <Card className="shadow-xs overflow-hidden print:shadow-none print:border-none">
        <CardHeader className="pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-bold text-foreground">
              Tabel Matriks Analisis Alokasi Waktu & Minggu Efektif
            </CardTitle>
            <CardDescription className="text-xs">
              Tahun Ajaran {tahunAjaranNama} • Semester {semesterNama} (Standar Ditjen Pendis Kemenag RI)
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 print:hidden self-start sm:self-auto">
            <Printer className="w-4 h-4" />
            <span>Cetak Rekap Kaldik</span>
          </Button>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <Table className="w-full text-xs text-left border-collapse">
            <TableHeader>
              <TableRow className="bg-muted/70 text-foreground font-semibold border-b border-border">
                <TableHead className="py-2.5 px-3 border-r border-border text-center w-10">No</TableHead>
                <TableHead className="py-2.5 px-3 border-r border-border min-w-[130px]">Nama Bulan</TableHead>
                <TableHead className="py-2.5 px-2.5 border-r border-border text-center" title="Hari Kalender">HK</TableHead>
                <TableHead className="py-2.5 px-2.5 border-r border-border text-center text-destructive" title="Libur Rutin Mingguan">Libur Rutin</TableHead>
                <TableHead className="py-2.5 px-2.5 border-r border-border text-center text-amber-700 dark:text-amber-400" title="Libur Nasional, Ramadhan, Semester">Libur Resmi</TableHead>
                <TableHead className="py-2.5 px-2.5 border-r border-border text-center text-indigo-700 dark:text-indigo-400" title="Matsama, Asesmen, Rapor">Non-Efektif</TableHead>
                <TableHead className="py-2.5 px-2.5 border-r border-border text-center text-primary" title="Hari Efektif Fakultatif">HEF</TableHead>
                <TableHead className="py-2.5 px-3 border-r border-border text-center font-bold bg-primary/10 text-primary" title="Hari Efektif Belajar">HEB</TableHead>
                <TableHead className="py-2.5 px-3 border-r border-border text-center font-bold bg-primary/10 text-primary" title="Minggu Efektif Belajar">MEB</TableHead>
                <TableHead className="py-2.5 px-3 border-r border-border text-center text-muted-foreground" title="Minggu Tidak Efektif">MTE</TableHead>
                <TableHead className="py-2.5 px-3 min-w-[200px]">Keterangan Kegiatan / Dominan MTE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {daftarBulan.map((b, idx) => (
                <TableRow key={`${b.tahun}-${b.bulan}`} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <TableCell className="py-2.5 px-3 border-r border-border text-center text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="py-2.5 px-3 border-r border-border font-medium text-foreground">{b.namaBulan}</TableCell>
                  <TableCell className="py-2.5 px-2.5 border-r border-border text-center">{b.hk}</TableCell>
                  <TableCell className="py-2.5 px-2.5 border-r border-border text-center text-destructive">{b.liburRutin}</TableCell>
                  <TableCell className="py-2.5 px-2.5 border-r border-border text-center">{b.liburResmi}</TableCell>
                  <TableCell className="py-2.5 px-2.5 border-r border-border text-center">{b.nonEfektif}</TableCell>
                  <TableCell className="py-2.5 px-2.5 border-r border-border text-center">{b.hef}</TableCell>
                  <TableCell className="py-2.5 px-3 border-r border-border text-center font-bold bg-primary/5 text-primary">{b.heb}</TableCell>
                  <TableCell className="py-2.5 px-3 border-r border-border text-center font-bold bg-primary/5 text-primary">{b.meb}</TableCell>
                  <TableCell className="py-2.5 px-3 border-r border-border text-center text-muted-foreground">{b.mte}</TableCell>
                  <TableCell className="py-2.5 px-3 text-muted-foreground">
                    {b.keteranganMte.length > 0 ? (
                      <div className="space-y-0.5">
                        {b.keteranganMte.map((k, i) => (
                          <div key={i} className="text-[11px] leading-snug truncate max-w-[280px]">
                            • {k}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-primary">Proses Pembelajaran Penuh</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-muted font-bold text-foreground border-t-2 border-border">
                <TableCell colSpan={2} className="py-3 px-3 border-r border-border text-center uppercase tracking-wider text-xs">
                  Jumlah Semester {semesterNama}
                </TableCell>
                <TableCell className="py-3 px-2.5 border-r border-border text-center">{totalHk}</TableCell>
                <TableCell className="py-3 px-2.5 border-r border-border text-center text-destructive">{totalLiburRutin}</TableCell>
                <TableCell className="py-3 px-2.5 border-r border-border text-center">{totalLiburResmi}</TableCell>
                <TableCell className="py-3 px-2.5 border-r border-border text-center">{totalNonEfektif}</TableCell>
                <TableCell className="py-3 px-2.5 border-r border-border text-center">{totalHef}</TableCell>
                <TableCell className="py-3 px-3 border-r border-border text-center bg-primary/20 text-primary text-sm">
                  {totalHeb}
                </TableCell>
                <TableCell className="py-3 px-3 border-r border-border text-center bg-primary/20 text-primary text-sm">
                  {totalMeb}
                </TableCell>
                <TableCell className="py-3 px-3 border-r border-border text-center text-muted-foreground text-sm">
                  {totalMte}
                </TableCell>
                <TableCell className="py-3 px-3 text-xs font-normal text-muted-foreground">
                  Validasi: HK ({totalHk}) = HEB ({totalHeb}) + HEF ({totalHef}) + Non-Efektif ({totalNonEfektif}) + Total Libur ({totalLiburRutin + totalLiburResmi})
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
