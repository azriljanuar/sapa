"use client"

import { useEffect, useState, useRef } from "react"
import { Html5QrcodeScanner } from "html5-qrcode"
import { CheckCircle2, XCircle, Camera, Loader2, ArrowLeft, PenLine, Save, User, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

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

type HistoryItem = {
  id: number
  nama: string
  kelas: string
  status: 'success' | 'duplicate' | 'error'
  time: string
  foto: string | null
}

export function ScanClient({ jenjangs = [] }: { jenjangs?: Jenjang[] }) {
  const [mode, setMode] = useState<'qr' | 'manual'>('qr')
  
  // State for QR Mode
  const [scanResult, setScanResult] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number>(0)
  const [scanHistory, setScanHistory] = useState<HistoryItem[]>([])
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // State for Manual Mode
  const [selectedJenjangId, setSelectedJenjangId] = useState<string>("")
  const [selectedKelasId, setSelectedKelasId] = useState<string>("")
  const [santris, setSantris] = useState<Santri[]>([])
  const [loadingSantri, setLoadingSantri] = useState(false)
  const [manualAbsenData, setManualAbsenData] = useState<Record<number, { status: string; keterangan: string }>>({})
  const [savingManual, setSavingManual] = useState(false)
  const [manualMessage, setManualMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // TTS Helper
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel() // Stop any currently playing speech
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'id-ID'
      utterance.rate = 1.0
      utterance.pitch = 1.0
      window.speechSynthesis.speak(utterance)
    }
  }

  // QR Mode Effect
  useEffect(() => {
    if (typeof window === 'undefined' || mode !== 'qr') return

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 300, height: 300 }, aspectRatio: 1.0 },
      /* verbose= */ false
    )

    const onScanSuccess = async (decodedText: string) => {
      if (isProcessing || countdown > 0) return
      
      try {
        const data = JSON.parse(decodedText)
        if (!data.type || !data.id) {
          throw new Error("QR Code tidak valid atau format salah.")
        }
        processScan(data)
      } catch (err: any) {
        setError("QR Code tidak dikenali.")
        speak("QR Code tidak dikenali")
        startResetTimer()
      }
    }

    scanner.render(onScanSuccess, () => {})

    return () => {
      scanner.clear().catch(console.error)
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }
  }, [mode, isProcessing, countdown])

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
            const initialData: Record<number, { status: string; keterangan: string }> = {}
            result.data.forEach((s: Santri) => {
              if (!s.kehadiranHariIni) {
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

    try {
      const res = await fetch("/api/absensi-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(qrData)
      })
      const result = await res.json()
      
      const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

      if (result.success) {
        setScanResult(result)
        speak(`Selamat datang, ${result.nama}`)
        setScanHistory(prev => [{
            id: Date.now(),
            nama: result.nama,
            kelas: result.kelas || "GURU",
            status: "success" as const,
            time: timeStr,
            foto: result.fotoWajah || null
        }, ...prev].slice(0, 10))
      } else {
        setError(result.message || "Gagal mencatat absensi.")
        if (result.isDuplicate) {
          speak(`${result.nama} sudah hadir hari ini`)
          setScanHistory(prev => [{
              id: Date.now(),
              nama: result.nama,
              kelas: result.kelas || "GURU",
              status: "duplicate" as const,
              time: timeStr,
              foto: result.fotoWajah || null
          }, ...prev].slice(0, 10))
        } else {
          speak("QR Code tidak dikenali")
        }
      }
    } catch (err) {
      setError("Kesalahan koneksi jaringan.")
      speak("Kesalahan koneksi")
    } finally {
      setIsProcessing(false)
      startResetTimer()
    }
  }

  const startResetTimer = () => {
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    
    setCountdown(5)
    
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
          setScanResult(null)
          setError(null)
          return 0
        }
        return prev - 1
      })
    }, 1000)
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

  const absensiToSave = Object.entries(manualAbsenData)
    .filter(([_, data]) => data.status !== "")
    .map(([santriId, data]) => ({
      santriId: parseInt(santriId),
      status: data.status,
      keterangan: data.keterangan
    }))

  const submitManualAbsensi = async () => {
    setSavingManual(true)
    setManualMessage(null)
    setShowConfirmModal(false)

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

  // Derived state for Manual Mode
  const unselectedCount = Object.values(manualAbsenData).filter(d => d.status === "").length
  const totalSantriToAbsen = Object.keys(manualAbsenData).length
  const selectedCount = totalSantriToAbsen - unselectedCount
  
  const manualSummary = {
    HADIR: absensiToSave.filter(d => d.status === 'HADIR').length,
    SAKIT: absensiToSave.filter(d => d.status === 'SAKIT').length,
    IZIN: absensiToSave.filter(d => d.status === 'IZIN').length,
    ALPA: absensiToSave.filter(d => d.status === 'ALPA').length,
  }

  return (
    <div className={`w-full min-h-[90vh] bg-white md:rounded-3xl overflow-hidden shadow-2xl relative flex flex-col transition-all duration-300 ${mode === 'manual' ? 'max-w-4xl' : 'max-w-6xl'} mx-auto`}>
      {/* HEADER */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white p-6 md:p-8 flex items-center justify-between shadow-md relative z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="bg-white/10 hover:bg-white/20 p-2.5 rounded-full backdrop-blur-sm transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {mode === 'qr' ? "Scanner Absensi" : "Input Absensi Manual"}
            </h1>
            <p className="text-indigo-200 text-sm mt-0.5">
              {mode === 'qr' ? "Arahkan QR Code ke kamera" : "Pilih jenjang & kelas untuk absen manual"}
            </p>
          </div>
        </div>
        
        <Button 
          variant="secondary" 
          className="rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold px-4 md:px-6 shadow-sm"
          onClick={() => setMode(mode === 'qr' ? 'manual' : 'qr')}
        >
          {mode === 'qr' ? (
            <><PenLine className="w-4 h-4 md:mr-2" /><span className="hidden md:inline">Mode Manual</span></>
          ) : (
            <><Camera className="w-4 h-4 md:mr-2" /><span className="hidden md:inline">Mode QR Scan</span></>
          )}
        </Button>
      </div>
      
      {/* CONTENT BODY */}
      <div className="flex-1 flex flex-col md:flex-row bg-slate-50">
        
        {/* QR MODE */}
        {mode === 'qr' && (
          <>
            {/* Kiri: Scanner Area */}
            <div className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center border-r border-slate-200">
              <div 
                id="qr-reader" 
                className={`w-full max-w-lg overflow-hidden rounded-3xl shadow-lg border-4 transition-all duration-500 bg-black ${
                  scanResult?.success ? 'border-emerald-500 shadow-emerald-500/20' 
                  : error ? 'border-red-500 shadow-red-500/20' 
                  : 'border-slate-800'
                }`}
              ></div>
              
              <div className="mt-8 h-40 flex flex-col items-center justify-center w-full max-w-lg relative">
                {isProcessing ? (
                  <div className="flex flex-col items-center animate-pulse text-indigo-600">
                    <Loader2 className="w-12 h-12 animate-spin mb-3" />
                    <p className="font-semibold text-lg">Memproses QR Code...</p>
                  </div>
                ) : scanResult ? (
                  <div className="w-full bg-emerald-100 border-2 border-emerald-400 rounded-2xl p-4 flex items-center gap-5 animate-in zoom-in duration-300 shadow-lg">
                    {scanResult.fotoWajah ? (
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 border-emerald-500 bg-white">
                        <Image src={scanResult.fotoWajah} alt={scanResult.nama} width={80} height={80} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl shrink-0 bg-emerald-200 flex items-center justify-center border-2 border-emerald-500">
                        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-emerald-700 font-bold uppercase text-xs tracking-wider mb-1">Berhasil Disimpan</p>
                      <h2 className="text-xl font-bold text-slate-800 truncate leading-tight">{scanResult.nama}</h2>
                      <p className="text-slate-600 text-sm mt-1">{scanResult.kelas} • {scanResult.jenjang}</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="w-full bg-red-100 border-2 border-red-400 rounded-2xl p-4 flex items-center gap-4 animate-in zoom-in duration-300 shadow-lg">
                    <div className="w-16 h-16 rounded-xl shrink-0 bg-red-200 flex items-center justify-center border-2 border-red-500">
                      <XCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-red-800">Gagal Absen</h2>
                      <p className="text-red-700 font-medium">{error}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-500 mb-3 shadow-inner">
                      <Camera className="w-8 h-8" />
                    </div>
                    <p className="text-slate-500 font-medium text-lg">Siap untuk memindai QR Code.</p>
                  </div>
                )}

                {/* Visual Countdown */}
                {countdown > 0 && !isProcessing && (
                  <div className="absolute -bottom-8 left-0 right-0 flex justify-center">
                    <div className="bg-slate-800 text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-2 animate-pulse shadow-md">
                      <Loader2 className="w-3 h-3 animate-spin" /> Siap dalam {countdown} detik
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Kanan: Riwayat Sesi */}
            <div className="w-full md:w-96 bg-white p-6 flex flex-col h-[500px] md:h-auto overflow-hidden border-t md:border-t-0 border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-slate-800 text-lg">Riwayat Sesi Ini</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {scanHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <User className="w-12 h-12 mb-2 opacity-50" />
                    <p className="text-sm">Belum ada scan masuk</p>
                  </div>
                ) : (
                  scanHistory.map(item => (
                    <div key={item.id} className="flex gap-3 items-center p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                      {item.foto ? (
                        <div className={`w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 ${item.status === 'success' ? 'border-emerald-500' : 'border-amber-500'}`}>
                          <Image src={item.foto} alt={item.nama} width={48} height={48} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-white font-bold ${item.status === 'success' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                          {item.nama.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 truncate text-sm">{item.nama}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-slate-500 truncate">{item.kelas}</p>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500">{item.time}</span>
                        </div>
                        {item.status === 'duplicate' && (
                          <p className="text-[10px] text-amber-600 font-bold mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Sudah Absen
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* MANUAL MODE */}
        {mode === 'manual' && (
          <div className="flex-1 flex flex-col p-6 h-[85vh] overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 shrink-0">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Pilih Jenjang</label>
                <select 
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  value={selectedJenjangId}
                  onChange={(e) => {
                    setSelectedJenjangId(e.target.value)
                    setSelectedKelasId("")
                  }}
                >
                  <option value="">-- Jenjang --</option>
                  {jenjangs.map(j => (
                    <option key={j.id} value={j.id}>{j.nama}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Pilih Kelas</label>
                <select 
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 transition-all font-medium"
                  value={selectedKelasId}
                  onChange={(e) => setSelectedKelasId(e.target.value)}
                  disabled={!selectedJenjangId}
                >
                  <option value="">-- Kelas --</option>
                  {kelasList.map(k => (
                    <option key={k.id} value={k.id}>{k.nama}</option>
                  ))}
                </select>
              </div>
            </div>

            {loadingSantri ? (
              <div className="flex-1 flex flex-col items-center justify-center text-indigo-500">
                <Loader2 className="w-10 h-10 animate-spin mb-3" />
                <p className="font-semibold">Memuat data santri...</p>
              </div>
            ) : selectedKelasId && santris.length > 0 ? (
              <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden relative">
                {/* Header Tabel */}
                <div className="bg-slate-100 px-6 py-4 flex items-center justify-between border-b border-slate-200 shrink-0">
                  <h3 className="font-bold text-slate-700">Daftar Santri</h3>
                  <div className="text-sm font-semibold px-3 py-1 bg-white rounded-full border border-slate-200 shadow-sm text-slate-600">
                    <span className={selectedCount === totalSantriToAbsen ? 'text-emerald-600' : 'text-indigo-600'}>{selectedCount}</span> / {totalSantriToAbsen} Selesai
                  </div>
                </div>

                {/* List Santri */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {santris.map((santri, i) => (
                    <div key={santri.id} className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-indigo-200 transition-colors">
                      <div className="flex gap-4 items-center">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 shrink-0">{i + 1}</div>
                        <div>
                          <p className="font-bold text-slate-800 text-lg">{santri.namaLengkap}</p>
                          <p className="text-sm text-slate-500 font-medium">NISN: {santri.nisn || "Tanpa NISN"}</p>
                        </div>
                      </div>
                      
                      {santri.kehadiranHariIni ? (
                        <div className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-bold shadow-sm">
                          <CheckCircle2 className="w-5 h-5" />
                          Tercatat {santri.kehadiranHariIni.status}
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                          <div className="flex bg-slate-100 p-1.5 rounded-xl shadow-inner border border-slate-200 gap-1">
                            {['HADIR', 'SAKIT', 'IZIN', 'ALPA'].map(st => (
                              <button
                                key={st}
                                onClick={() => handleManualAbsenChange(santri.id, 'status', manualAbsenData[santri.id]?.status === st ? "" : st)}
                                className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${
                                  manualAbsenData[santri.id]?.status === st 
                                    ? (st === 'HADIR' ? 'bg-emerald-500 text-white shadow-md' : st === 'SAKIT' ? 'bg-amber-400 text-amber-900 shadow-md' : st === 'IZIN' ? 'bg-blue-500 text-white shadow-md' : 'bg-red-500 text-white shadow-md')
                                    : 'text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                          {manualAbsenData[santri.id]?.status && !['ALPA', 'HADIR'].includes(manualAbsenData[santri.id].status) && (
                            <input
                              type="text"
                              placeholder="Keterangan..."
                              className="w-full sm:w-40 px-3 py-2.5 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-400 font-medium"
                              value={manualAbsenData[santri.id]?.keterangan || ""}
                              onChange={(e) => handleManualAbsenChange(santri.id, 'keterangan', e.target.value)}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Sticky Footer */}
                <div className="bg-white border-t border-slate-200 p-5 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20">
                  {manualMessage && (
                    <div className={`mb-4 p-4 rounded-xl text-sm font-semibold flex items-center gap-3 ${
                      manualMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {manualMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                      {manualMessage.text}
                    </div>
                  )}
                  <Button 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg rounded-2xl py-7 text-lg font-bold transition-transform active:scale-[0.98]"
                    onClick={() => setShowConfirmModal(true)}
                    disabled={savingManual || absensiToSave.length === 0}
                  >
                    {savingManual ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Save className="w-6 h-6 mr-2" />}
                    Simpan Data Absensi ({absensiToSave.length})
                  </Button>
                </div>
              </div>
            ) : selectedKelasId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-300">
                <User className="w-16 h-16 mb-4 opacity-50" />
                <p className="font-semibold text-lg">Tidak ada data santri</p>
                <p className="text-sm">Kelas ini masih kosong.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm">
                <p className="font-semibold text-lg text-slate-500">Pilih Jenjang & Kelas</p>
                <p className="text-sm mt-1">Daftar santri akan tampil di sini.</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-indigo-600 p-6 text-white text-center">
              <h2 className="text-xl font-bold">Konfirmasi Simpan</h2>
              <p className="text-indigo-100 text-sm mt-1">Pastikan rekap kehadiran sudah benar</p>
            </div>
            <div className="p-6">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="font-semibold text-slate-600">Hadir</span>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">{manualSummary.HADIR}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="font-semibold text-slate-600">Sakit</span>
                  <span className="font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg">{manualSummary.SAKIT}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="font-semibold text-slate-600">Izin</span>
                  <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">{manualSummary.IZIN}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="font-semibold text-slate-600">Alpa</span>
                  <span className="font-bold text-red-600 bg-red-50 px-3 py-1 rounded-lg">{manualSummary.ALPA}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl py-6 font-bold border-slate-200" onClick={() => setShowConfirmModal(false)}>
                  Batal
                </Button>
                <Button className="flex-1 rounded-xl py-6 font-bold bg-indigo-600 hover:bg-indigo-700" onClick={submitManualAbsensi}>
                  Ya, Simpan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
