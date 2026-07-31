"use client"

import { useEffect, useState, useRef } from "react"
import { Html5QrcodeScanner } from "html5-qrcode"
import { CheckCircle2, XCircle, Camera, Loader2, ArrowLeft, PenLine, Save } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type Jenjang = {
  id: number
  nama: string
  singkatan: string
  kelasFormal: { id: number; nama: string }[]
}

type Santri = {
  id: number
  namaLengkap: string
  nisn: string
  kehadiranHariIni: { status: string; keterangan?: string } | null
}

export function ScanClient({ jenjangs = [] }: { jenjangs?: Jenjang[] }) {
  const [mode, setMode] = useState<'qr' | 'manual'>('qr')
  
  // State for QR Mode
  const [scanResult, setScanResult] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // State for Manual Mode
  const [selectedJenjangId, setSelectedJenjangId] = useState<string>("")
  const [selectedKelasId, setSelectedKelasId] = useState<string>("")
  const [santris, setSantris] = useState<Santri[]>([])
  const [loadingSantri, setLoadingSantri] = useState(false)
  const [manualAbsenData, setManualAbsenData] = useState<Record<number, { status: string; keterangan: string }>>({})
  const [savingManual, setSavingManual] = useState(false)
  const [manualMessage, setManualMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // QR Mode Effect
  useEffect(() => {
    if (typeof window === 'undefined' || mode !== 'qr') return

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
      /* verbose= */ false
    )

    const onScanSuccess = async (decodedText: string) => {
      if (isProcessing) return
      
      try {
        const data = JSON.parse(decodedText)
        if (!data.type || !data.id) {
          throw new Error("QR Code tidak valid atau format salah.")
        }
        processScan(data)
      } catch (err: any) {
        setError("QR Code tidak dikenali.")
        startResetTimer()
      }
    }

    scanner.render(onScanSuccess, () => {})

    return () => {
      scanner.clear().catch(console.error)
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
    }
  }, [mode, isProcessing])

  // Fetch Santri Effect (Manual Mode)
  useEffect(() => {
    if (mode === 'manual' && selectedKelasId) {
      setLoadingSantri(true)
      setSantris([])
      setManualAbsenData({})
      setManualMessage(null)
      
      fetch(`/api/absensi-manual?kelasId=${selectedKelasId}`)
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            setSantris(result.data)
            // Init data for those who haven't absen
            const initialData: Record<number, { status: string; keterangan: string }> = {}
            result.data.forEach((s: Santri) => {
              if (!s.kehadiranHariIni) {
                // Default: empty string (unselected)
                initialData[s.id] = { status: "", keterangan: "" }
              }
            })
            setManualAbsenData(initialData)
          }
        })
        .finally(() => setLoadingSantri(false))
    } else {
      setSantris([])
      setManualAbsenData({})
    }
  }, [selectedKelasId, mode])

  const processScan = async (qrData: any) => {
    setIsProcessing(true)
    setError(null)
    setScanResult(null)
    startResetTimer()

    try {
      const res = await fetch("/api/absensi-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(qrData)
      })
      const result = await res.json()
      
      if (result.success) {
        setScanResult(result)
      } else {
        setError(result.message || "Gagal mencatat absensi.")
      }
    } catch (err) {
      setError("Kesalahan koneksi.")
    } finally {
      setIsProcessing(false)
    }
  }

  const startResetTimer = () => {
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
    resetTimeoutRef.current = setTimeout(() => {
      setScanResult(null)
      setError(null)
    }, 5000)
  }

  const handleManualAbsenChange = (santriId: number, field: 'status' | 'keterangan', value: string) => {
    setManualAbsenData(prev => ({
      ...prev,
      [santriId]: {
        ...prev[santriId],
        [field]: value
      }
    }))
  }

  const submitManualAbsensi = async () => {
    // Filter only those who have a status selected
    const absensiToSave = Object.entries(manualAbsenData)
      .filter(([_, data]) => data.status !== "")
      .map(([santriId, data]) => ({
        santriId: parseInt(santriId),
        status: data.status,
        keterangan: data.keterangan
      }))

    if (absensiToSave.length === 0) {
      setManualMessage({ type: 'error', text: 'Tidak ada data absensi baru untuk disimpan.' })
      return
    }

    setSavingManual(true)
    setManualMessage(null)

    try {
      const res = await fetch("/api/absensi-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kelasId: selectedKelasId,
          absensiData: absensiToSave
        })
      })
      const result = await res.json()
      
      if (result.success) {
        setManualMessage({ type: 'success', text: 'Absensi manual berhasil disimpan!' })
        // Refresh santri list
        const refreshRes = await fetch(`/api/absensi-manual?kelasId=${selectedKelasId}`)
        const refreshResult = await refreshRes.json()
        if (refreshResult.success) {
          setSantris(refreshResult.data)
          const newInitial: Record<number, any> = {}
          refreshResult.data.forEach((s: Santri) => {
            if (!s.kehadiranHariIni) newInitial[s.id] = { status: "", keterangan: "" }
          })
          setManualAbsenData(newInitial)
        }
      } else {
        setManualMessage({ type: 'error', text: result.message || 'Gagal menyimpan data.' })
      }
    } catch (err) {
      setManualMessage({ type: 'error', text: 'Terjadi kesalahan koneksi saat menyimpan data.' })
    } finally {
      setSavingManual(false)
    }
  }

  const selectedJenjang = jenjangs.find(j => j.id.toString() === selectedJenjangId)
  const kelasList = selectedJenjang?.kelasFormal || []

  return (
    <div className={`w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl relative transition-all duration-300 ${mode === 'manual' ? 'max-w-2xl' : ''}`}>
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Link href="/" className="bg-white/80 backdrop-blur-md p-2 rounded-full shadow-sm text-slate-700 hover:bg-white flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>
      
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 pt-16 text-center text-white relative">
        <div className="absolute top-4 right-4 z-10">
          <Button 
            variant="secondary" 
            size="sm" 
            className="rounded-full shadow-sm bg-white/20 text-white border-none hover:bg-white/30 font-semibold"
            onClick={() => setMode(mode === 'qr' ? 'manual' : 'qr')}
          >
            {mode === 'qr' ? <PenLine className="w-4 h-4 mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
            {mode === 'qr' ? "Mode Manual" : "Mode QR Scan"}
          </Button>
        </div>

        <div className="bg-white/20 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4">
          {mode === 'qr' ? <Camera className="w-8 h-8 text-white" /> : <PenLine className="w-8 h-8 text-white" />}
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          {mode === 'qr' ? "Scanner Absensi" : "Input Absensi Manual"}
        </h1>
        <p className="text-indigo-100 mt-2 text-sm">
          {mode === 'qr' 
            ? "Arahkan QR Code Kartu Identitas ke kamera untuk absensi otomatis." 
            : "Catat kehadiran santri secara manual (Hadir, Sakit, Izin, Alpa)."}
        </p>
      </div>
      
      <div className="p-6 pb-8 bg-slate-50 min-h-[400px]">
        {/* QR MODE */}
        <div className={`flex-col items-center justify-center ${mode === 'qr' ? 'flex' : 'hidden'}`}>
          <div 
            id="qr-reader" 
            className={`w-full max-w-sm overflow-hidden rounded-2xl shadow-inner border-4 ${scanResult ? 'border-emerald-400' : error ? 'border-red-400' : 'border-white'} transition-colors`}
          ></div>

          <div className="mt-6 w-full h-32 flex items-center justify-center">
            {isProcessing ? (
              <div className="flex flex-col items-center animate-pulse text-indigo-600">
                <Loader2 className="w-10 h-10 animate-spin mb-2" />
                <p className="font-semibold">Memproses...</p>
              </div>
            ) : scanResult ? (
              <div className="text-center animate-in zoom-in duration-300">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <h2 className="text-xl font-bold text-slate-800">{scanResult.nama}</h2>
                <p className="text-emerald-600 font-semibold">{scanResult.message}</p>
              </div>
            ) : error ? (
              <div className="text-center animate-in zoom-in duration-300">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                <p className="text-red-600 font-bold px-4">{error}</p>
              </div>
            ) : (
              <div className="text-center text-slate-400">
                <p className="text-sm">Menunggu scan QR...</p>
              </div>
            )}
          </div>
        </div>

        {/* MANUAL MODE */}
        <div className={`flex-col gap-6 ${mode === 'manual' ? 'flex' : 'hidden'}`}>
          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jenjang</label>
                <select 
                  className="w-full border-slate-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  value={selectedJenjangId}
                  onChange={(e) => {
                    setSelectedJenjangId(e.target.value)
                    setSelectedKelasId("")
                  }}
                >
                  <option value="">Pilih Jenjang</option>
                  {jenjangs.map(j => (
                    <option key={j.id} value={j.id}>{j.nama}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kelas</label>
                <select 
                  className="w-full border-slate-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                  value={selectedKelasId}
                  onChange={(e) => setSelectedKelasId(e.target.value)}
                  disabled={!selectedJenjangId}
                >
                  <option value="">Pilih Kelas</option>
                  {kelasList.map(k => (
                    <option key={k.id} value={k.id}>{k.nama}</option>
                  ))}
                </select>
              </div>
            </div>

            {loadingSantri ? (
              <div className="py-12 flex justify-center text-indigo-500">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : selectedKelasId && santris.length > 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col max-h-[500px]">
                <div className="overflow-y-auto p-4 space-y-3 flex-1">
                  {santris.map((santri, i) => (
                    <div key={santri.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{i + 1}. {santri.namaLengkap}</p>
                        <p className="text-xs text-slate-500">{santri.nisn || "Tanpa NISN"}</p>
                      </div>
                      
                      {santri.kehadiranHariIni ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          Hadir ({santri.kehadiranHariIni.status})
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                          <div className="flex bg-slate-200 p-1 rounded-lg">
                            {['HADIR', 'SAKIT', 'IZIN', 'ALPA'].map(st => (
                              <button
                                key={st}
                                onClick={() => handleManualAbsenChange(santri.id, 'status', manualAbsenData[santri.id]?.status === st ? "" : st)}
                                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                                  manualAbsenData[santri.id]?.status === st 
                                    ? (st === 'HADIR' ? 'bg-emerald-500 text-white' : st === 'SAKIT' ? 'bg-amber-400 text-amber-900' : st === 'IZIN' ? 'bg-blue-400 text-blue-900' : 'bg-red-500 text-white')
                                    : 'text-slate-600 hover:bg-slate-300'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                          {manualAbsenData[santri.id]?.status && !['ALPA', 'HADIR'].includes(manualAbsenData[santri.id].status) && (
                            <input
                              type="text"
                              placeholder="Ket..."
                              className="w-24 text-xs px-2 py-1.5 border border-slate-200 rounded-md outline-none focus:border-indigo-400"
                              value={manualAbsenData[santri.id]?.keterangan || ""}
                              onChange={(e) => handleManualAbsenChange(santri.id, 'keterangan', e.target.value)}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="p-4 bg-slate-100 border-t border-slate-200">
                  {manualMessage && (
                    <div className={`mb-3 p-3 rounded-xl text-sm font-medium ${
                      manualMessage.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {manualMessage.text}
                    </div>
                  )}
                  <Button 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md rounded-xl py-6"
                    onClick={submitManualAbsensi}
                    disabled={savingManual || Object.values(manualAbsenData).every(d => !d || d.status === "")}
                  >
                    {savingManual ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                    Simpan Data Absensi
                  </Button>
                </div>
              </div>
            ) : selectedKelasId ? (
              <div className="text-center py-10 text-slate-500 text-sm">
                Tidak ada data santri di kelas ini.
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 text-sm">
                Pilih Jenjang dan Kelas untuk menampilkan daftar santri.
              </div>
            )}
          </div>
        </div>
      </div>
  )
}
