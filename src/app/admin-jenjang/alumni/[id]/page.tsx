import { getLoggedInAdminJenjang } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, FileText, Printer, Edit, GraduationCap, MapPin, Phone, Mail, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AlumniDetailPage({ params }: { params: { id: string } }) {
  const admin = await getLoggedInAdminJenjang()
  if (!admin.jenjangId) redirect("/login")

  const santriId = parseInt(params.id)
  if (isNaN(santriId)) notFound()

  const santri = await prisma.santri.findUnique({
    where: { id: santriId },
    include: {
      jenjangs: {
        where: { jenjangId: admin.jenjangId },
        include: { jenjang: true, tahunMasuk: true, tahunLulus: true }
      }
    }
  })

  if (!santri || santri.jenjangs.length === 0) {
    notFound()
  }

  const alumniData = santri.jenjangs[0]
  if (!alumniData.isAlumni) {
    return <div className="p-6 text-center text-red-500">Santri ini bukan alumni di jenjang ini.</div>
  }
  
  const dateFormatter = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  const ttlDate = santri.tanggalLahir ? dateFormatter.format(santri.tanggalLahir) : "-"

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Link href="/admin-jenjang/alumni">
          <Button variant="outline" size="icon" className="rounded-full">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Detail Profil Alumni</h1>
          <p className="text-muted-foreground text-sm">Informasi akademik dan kelanjutan studi alumni</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kolom Kiri: Biodata Dasar */}
        <div className="space-y-6 md:col-span-1">
          <Card>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto bg-slate-100 rounded-full h-24 w-24 flex items-center justify-center mb-3">
                <GraduationCap className="h-10 w-10 text-slate-400" />
              </div>
              <CardTitle className="text-xl">{santri.namaLengkap}</CardTitle>
              <div className="flex justify-center gap-2 mt-1">
                <Badge variant="secondary" className="font-mono">{santri.nisn}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 border-t text-sm">
              <div>
                <p className="text-slate-500 mb-1 flex items-center gap-2"><MapPin className="h-3.5 w-3.5"/> Tempat, Tgl Lahir</p>
                <p className="font-medium">
                  {santri.tempatLahir ? santri.tempatLahir + ", " : ""}
                  {ttlDate}
                </p>
              </div>
              <div>
                <p className="text-slate-500 mb-1 flex items-center gap-2"><Phone className="h-3.5 w-3.5"/> No. Telepon (Santri/Wali)</p>
                <p className="font-medium">{santri.noTelepon || "-"}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Status Mukim saat Lulus</p>
                <p className="font-medium">{alumniData.statusMukim ? "Ya (Mukim)" : "Tidak (Non-Mukim)"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Detail Alumni & Aksi SKL */}
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-5 w-5 text-indigo-500" />
                  Rekam Jejak Lulusan
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">Data pasca kelulusan dari {alumniData.jenjang.nama}</p>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Status Lanjutan</p>
                  <p className="font-medium capitalize">{alumniData.statusLanjutan?.replace("_", " ").toLowerCase() || "Belum ada data"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Instansi / Kampus</p>
                  <p className="font-medium">{alumniData.namaInstansi || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Program Studi</p>
                  <p className="font-medium">{alumniData.programStudi || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Domisili Saat Ini</p>
                  <p className="font-medium">{alumniData.kotaDomisiliSekarang || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1 flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400"/> Kontak WA Pribadi</p>
                  <p className="font-medium">{alumniData.kontakWA || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1 flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-400"/> Email Alternatif</p>
                  <p className="font-medium">{alumniData.email || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Tahun Masuk</p>
                  <p className="font-medium">{alumniData.tahunMasuk?.nama || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Tahun Lulus</p>
                  <p className="font-medium">{alumniData.tahunLulus?.nama || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-500 mb-1">Catatan Tambahan Lulusan</p>
                  <p className="font-medium">{alumniData.keteranganLulus || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-500" />
                Dokumen Kelulusan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 border rounded-lg bg-slate-50">
                <div>
                  <h4 className="font-medium text-slate-900">Surat Keterangan Lulus (SKL)</h4>
                  <p className="text-sm text-slate-500 mt-1">Cetak dokumen SKL resmi untuk alumni ini menggunakan template jenjang.</p>
                </div>
                <Link href={`/admin-jenjang/alumni/${santriId}/cetak-skl`} target="_blank">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto shrink-0">
                    <Printer className="mr-2 h-4 w-4" /> Cetak SKL
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
