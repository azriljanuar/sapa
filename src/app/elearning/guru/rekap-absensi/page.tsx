"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getRekapAbsensiWaliKelas } from "./actions"
import { ArrowLeft, Users, Calendar, Info, CheckCircle2, XCircle, AlertCircle, Clock, Loader2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function RekapAbsensiPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [activeTab, setActiveTab] = useState<'semester' | 'harian'>('semester')
  const [selectedSantri, setSelectedSantri] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getRekapAbsensiWaliKelas()
      setData(res)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Memuat data rekap absensi...</div>
  }

  if (error) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto mt-10">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Akses Ditolak</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <Link href="/elearning/guru">
          <Button>Kembali ke Dashboard</Button>
        </Link>
      </div>
    )
  }

  const { kelas, semester, rekap } = data

  const getStatusBadge = (status: string | null) => {
    switch(status) {
      case "HADIR": return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none">Hadir</Badge>
      case "SAKIT": return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none">Sakit</Badge>
      case "IZIN": return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-none">Izin</Badge>
      case "ALPA": return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-none">Alpa</Badge>
      case null: return <Badge className="bg-slate-100 text-slate-500 border-none">Belum Absen</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/elearning/guru" className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100 transition">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Rekap Absensi Harian</h1>
          <p className="text-slate-500 text-sm mt-1">Kelas {kelas.namaKelas} &middot; Semester {semester}</p>
        </div>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-xl w-full max-w-md mx-auto sm:mx-0">
        <button
          onClick={() => setActiveTab('semester')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'semester' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
        >
          Rekap Semester
        </button>
        <button
          onClick={() => setActiveTab('harian')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'harian' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
        >
          Kehadiran Harian
        </button>
      </div>

      {activeTab === 'semester' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
              Daftar Siswa & Rekapitulasi
            </CardTitle>
            <CardDescription>
              Klik pada baris siswa untuk melihat rincian tanggal kehadiran. Data absensi harian dicatat dari hasil scan QR Code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[50px] text-center">No</TableHead>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead>NISN</TableHead>
                    <TableHead className="text-center text-emerald-600">Hadir</TableHead>
                    <TableHead className="text-center text-blue-600">Sakit</TableHead>
                    <TableHead className="text-center text-orange-600">Izin</TableHead>
                    <TableHead className="text-center text-red-600">Alpa</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rekap.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-slate-500">
                        Belum ada siswa di kelas ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rekap.map((item: any, idx: number) => (
                      <TableRow key={item.santri.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => setSelectedSantri(item)}>
                        <TableCell className="text-center font-medium text-slate-500">{idx + 1}</TableCell>
                        <TableCell className="font-semibold text-slate-800">{item.santri.namaLengkap}</TableCell>
                        <TableCell className="text-slate-500">{item.santri.nisn || "-"}</TableCell>
                        <TableCell className="text-center font-bold text-emerald-600">{item.rekap.hadir}</TableCell>
                        <TableCell className="text-center font-bold text-blue-600">{item.rekap.sakit}</TableCell>
                        <TableCell className="text-center font-bold text-orange-600">{item.rekap.izin}</TableCell>
                        <TableCell className="text-center font-bold text-red-600">{item.rekap.alpa}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                            Rincian
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <HarianTab kelasId={kelas.id} getStatusBadge={getStatusBadge} />
      )}

      <Dialog open={!!selectedSantri} onOpenChange={(open) => !open && setSelectedSantri(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Calendar className="h-5 w-5 text-indigo-500" />
              Rincian Absensi: {selectedSantri?.santri.namaLengkap}
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 pt-2 overflow-y-auto flex-1">
            {selectedSantri?.detailHarian.length === 0 ? (
              <div className="text-center py-10 text-slate-500 flex flex-col items-center">
                <Info className="h-10 w-10 text-slate-300 mb-3" />
                <p>Belum ada data absensi untuk siswa ini.</p>
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                {selectedSantri?.detailHarian.map((detail: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-xl border bg-slate-50/50 hover:bg-white transition-colors shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                        <Clock className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">
                          {new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(detail.tanggal))}
                        </p>
                        {detail.keterangan && (
                          <p className="text-sm text-slate-500 mt-0.5">Catatan: {detail.keterangan}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      {getStatusBadge(detail.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function HarianTab({ kelasId, getStatusBadge }: { kelasId: number, getStatusBadge: (status: string | null) => React.ReactNode }) {
  const [selectedTanggal, setSelectedTanggal] = useState<string>(
    new Date().toISOString().split("T")[0]
  )
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (kelasId && selectedTanggal) {
      loadHarianData(kelasId, selectedTanggal)
    }
  }, [kelasId, selectedTanggal])

  const loadHarianData = async (id: number, tgl: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/rekap-harian?kelasId=${id}&tanggal=${tgl}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      setData(json)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Tanggal</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="date"
              value={selectedTanggal}
              onChange={(e) => setSelectedTanggal(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
            />
          </div>
        </div>
        <div className="pt-6">
          <Button 
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => setSelectedTanggal(new Date().toISOString().split("T")[0])}
          >
            Hari Ini
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-indigo-500 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="text-slate-500 font-medium">Memuat data absensi...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-red-50 border border-red-100 rounded-2xl">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-emerald-50 border-emerald-100 shadow-sm">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                <span className="text-sm font-medium text-emerald-600 mb-1">Hadir</span>
                <span className="text-3xl font-bold text-emerald-700">{data.summary.hadir}</span>
              </CardContent>
            </Card>
            <Card className="bg-amber-50 border-amber-100 shadow-sm">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                <span className="text-sm font-medium text-amber-600 mb-1">Sakit</span>
                <span className="text-3xl font-bold text-amber-700">{data.summary.sakit}</span>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-100 shadow-sm">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                <span className="text-sm font-medium text-blue-600 mb-1">Izin</span>
                <span className="text-3xl font-bold text-blue-700">{data.summary.izin}</span>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-100 shadow-sm">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                <span className="text-sm font-medium text-red-600 mb-1">Alpa</span>
                <span className="text-3xl font-bold text-red-700">{data.summary.alpa}</span>
              </CardContent>
            </Card>
            <Card className="bg-slate-50 border-slate-200 shadow-sm">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                <span className="text-sm font-medium text-slate-500 mb-1">Belum Absen</span>
                <span className="text-3xl font-bold text-slate-700">{data.summary.belumAbsen}</span>
              </CardContent>
            </Card>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold">No</th>
                    <th className="px-6 py-4 font-semibold">Nama Santri</th>
                    <th className="px-6 py-4 font-semibold">NISN</th>
                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                    <th className="px-6 py-4 font-semibold">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.data.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                        Tidak ada data santri di kelas ini.
                      </td>
                    </tr>
                  ) : (
                    data.data.map((santri: any, idx: number) => (
                      <tr key={santri.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-slate-500">{idx + 1}</td>
                        <td className="px-6 py-4 font-semibold text-slate-800">{santri.namaLengkap}</td>
                        <td className="px-6 py-4 text-slate-500">{santri.nisn || "-"}</td>
                        <td className="px-6 py-4 text-center">
                          {getStatusBadge(santri.status)}
                        </td>
                        <td className="px-6 py-4 text-slate-500 italic">
                          {santri.keterangan || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
