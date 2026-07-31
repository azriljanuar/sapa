"use client"

import { useState, useEffect } from "react"
import { Calendar, ClipboardList, Loader2, CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function RekapKehadiranClient({ 
  kelasList, 
  jenjangNama, 
  tahunAjaran 
}: { 
  kelasList: any[], 
  jenjangNama: string, 
  tahunAjaran: string 
}) {
  const [selectedKelasId, setSelectedKelasId] = useState<string>("")
  const [selectedTanggal, setSelectedTanggal] = useState<string>(
    new Date().toISOString().split("T")[0] // default hari ini
  )

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (selectedKelasId && selectedTanggal) {
      loadData(selectedKelasId, selectedTanggal)
    } else {
      setData(null)
    }
  }, [selectedKelasId, selectedTanggal])

  const loadData = async (kelasId: string, tanggal: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/rekap-harian?kelasId=${kelasId}&tanggal=${tanggal}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      setData(json)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string | null) => {
    switch(status) {
      case "HADIR": return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none">Hadir</Badge>
      case "SAKIT": return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none">Sakit</Badge>
      case "IZIN": return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none">Izin</Badge>
      case "ALPA": return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-none">Alpa</Badge>
      default: return <Badge className="bg-slate-100 text-slate-500 border-none">Belum Absen</Badge>
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <ClipboardList className="h-8 w-8 text-indigo-600" />
          Rekap Kehadiran Harian
        </h1>
        <p className="text-slate-500 mt-2">
          Jenjang: {jenjangNama} &middot; TA {tahunAjaran}
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Kelas</label>
          <select 
            value={selectedKelasId}
            onChange={(e) => setSelectedKelasId(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-slate-50"
          >
            <option value="">-- Pilih Kelas --</option>
            {kelasList.map(k => (
              <option key={k.id} value={k.id}>{k.namaKelas}</option>
            ))}
          </select>
        </div>
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
      ) : (
        <div className="text-center py-20 text-slate-400 flex flex-col items-center">
          <Info className="w-12 h-12 text-slate-200 mb-4" />
          <p>Pilih kelas dan tanggal untuk melihat rekap kehadiran harian.</p>
        </div>
      )}
    </div>
  )
}
