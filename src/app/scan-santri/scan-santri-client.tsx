"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { CheckCircle2, XCircle, Camera, Loader2, ArrowLeft, Users, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

type Kelas = {
  id: number
  namaKelas: string
  jenjang: { nama: string, singkatan: string }
  _count: { anggota: number }
}

type HistoryItem = {
  id: number
  nama: string
  kelas: string
  status: 'success' | 'duplicate' | 'error' | 'wrong_class'
  time: string
  foto: string | null
}

export function ScanSantriClient() {
  // Scanner State
  const [scanResult, setScanResult] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number>(0)
  const [scanHistory, setScanHistory] = useState<HistoryItem[]>([])
  const [scannerReady, setScannerReady] = useState(false)

  // Statistik Kelas (Hadir)
  const [hadirCount, setHadirCount] = useState(0)

  // Refs for scanner callback
  const isProcessingRef = useRef(false)
  const countdownRef = useRef(0)
  
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'id-ID'
      utterance.rate = 1.0
      utterance.pitch = 1.0
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  const startResetTimer = useCallback(() => {
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    
    countdownRef.current = 3 // 3 seconds for fast scanning
    setCountdown(3)
    
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        const next = prev - 1
        countdownRef.current = next
        if (next <= 0) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
          setScanResult(null)
          setError(null)
          countdownRef.current = 0
          return 0
        }
        return next
      })
    }, 1000)
  }, [])

  const processScan = useCallback(async (qrData: any) => {
    isProcessingRef.current = true
    setIsProcessing(true)
    setError(null)
    setScanResult(null)

    try {
      // Tidak lagi mengirim kelasId karena scan global
      const payload = {
        ...qrData
      }

      const res = await fetch("/api/absensi-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      const result = await res.json()
      
      const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

      if (result.success) {
        setScanResult(result)
        speak(`Hadir, ${result.nama}`)
        setHadirCount(prev => prev + 1)
        
        setScanHistory(prev => [{
            id: Date.now(),
            nama: result.nama,
            kelas: result.kelas,
            status: "success" as const,
            time: timeStr,
            foto: result.fotoWajah || null
        }, ...prev].slice(0, 10))
      } else {
        setError(result.message || "Gagal mencatat absensi.")
        
        if (result.isWrongClass) {
          speak(`${result.nama} bukan dari kelas ini`)
          setScanHistory(prev => [{
              id: Date.now(),
              nama: result.nama,
              kelas: result.kelas,
              status: "wrong_class" as const,
              time: timeStr,
              foto: result.fotoWajah || null
          }, ...prev].slice(0, 10))
        } else if (result.isDuplicate) {
          speak(`Sudah absen`)
          setScanHistory(prev => [{
              id: Date.now(),
              nama: result.nama,
              kelas: result.kelas,
              status: "duplicate" as const,
              time: timeStr,
              foto: result.fotoWajah || null
          }, ...prev].slice(0, 10))
        } else {
          speak("Gagal")
        }
      }
    } catch (err) {
      setError("Kesalahan koneksi jaringan.")
      speak("Kesalahan koneksi")
    } finally {
      isProcessingRef.current = false
      setIsProcessing(false)
      startResetTimer()
    }
  }, [speak, startResetTimer])

  const processScanRef = useRef(processScan)
  const speakRef = useRef(speak)
  const startResetTimerRef = useRef(startResetTimer)

  useEffect(() => {
    processScanRef.current = processScan
    speakRef.current = speak
    startResetTimerRef.current = startResetTimer
  }, [processScan, speak, startResetTimer])

  // Deteksi apakah kamera tersedia (HTTPS check)
  const [cameraSupported, setCameraSupported] = useState(true)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (typeof navigator !== 'undefined' && !navigator.mediaDevices?.getUserMedia) {
      setCameraSupported(false)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    setScannerReady(false)
    setCameraError(null)

    let scanner: any = null
    let mounted = true

    // Guard early exit
    if (typeof navigator !== 'undefined' && !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Kamera tidak tersedia. Pastikan Anda mengakses web via HTTPS atau localhost.")
      setScannerReady(true)
      return
    }

    const qrboxSize = window.innerWidth < 640 ? 220 : 280

    import("html5-qrcode").then(({ Html5QrcodeScanner }) => {
      if (!mounted) return

      scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: qrboxSize, height: qrboxSize }, aspectRatio: 1.0 },
        /* verbose= */ false
      )

      const onScanSuccess = async (decodedText: string) => {
        if (isProcessingRef.current || countdownRef.current > 0) return
        try {
          const data = JSON.parse(decodedText)
          if (!data.type || !data.id || data.type !== 'SANTRI') {
            throw new Error("QR Code bukan milik Santri.")
          }
          processScanRef.current(data)
        } catch {
          setError("QR Code tidak dikenali.")
          speakRef.current("Tidak dikenali")
          startResetTimerRef.current()
        }
      }

      const onScanError = (err: any) => {
        if (typeof err === 'string' && (err.includes('NotAllowedError') || err.includes('NotFoundError'))) {
          setCameraError("Akses kamera ditolak atau kamera tidak ditemukan.")
          if (mounted) setScannerReady(true)
        }
      }

      try {
        scanner.render(onScanSuccess, onScanError)
      } catch (e: any) {
        setCameraError("Kamera tidak dapat diinisialisasi: " + (e?.message || ""))
        if (mounted) setScannerReady(true)
      }

      setTimeout(() => {
        if (mounted) setScannerReady(true)
      }, 800)

      initTimeoutRef.current = setTimeout(() => {
        if (mounted && !scannerReady) {
          setCameraError("Kamera tidak merespons. Coba buka halaman ini melalui HTTPS.")
          setScannerReady(true)
        }
      }, 6000)
    })

    return () => {
      mounted = false
      if (scanner) {
        scanner.clear().catch(() => {})
      }
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
      if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current)
    }
  }, [])

  // VIEW 2: Scanner Kiosk
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col relative overflow-hidden">
      {/* Header Kiosk */}
      <div className="bg-slate-800 border-b border-slate-700 p-4 px-6 flex items-center justify-between text-white shadow-lg relative z-10">
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="bg-slate-700 hover:bg-slate-600 p-2 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Scan Absensi Santri</h1>
            <p className="text-slate-400 text-xs">Pindai QR Code santri untuk absen</p>
          </div>
        </div>
        
        <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-slate-400 font-medium">Hadir Sesi Ini</p>
            <p className="text-lg font-bold text-emerald-400 leading-none">
              {hadirCount} <span className="text-sm text-slate-500">santri</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row h-full">
        {/* Scanner Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
          
          {!scannerReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
              <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mb-4" />
              <p className="text-slate-300 font-semibold">Menyiapkan Kamera...</p>
            </div>
          )}

          {scannerReady && cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10 px-8 text-center">
              <AlertTriangle className="w-16 h-16 text-amber-400 mb-4" />
              <h2 className="text-white text-xl font-bold mb-2">Kamera Tidak Tersedia</h2>
              <p className="text-slate-400 text-sm mb-6">{cameraError}</p>
              <p className="text-slate-500 text-xs mb-4 max-w-sm">
                Browser mobile memerlukan koneksi <strong className="text-slate-300">HTTPS</strong> untuk mengakses kamera secara lokal. 
                Di server produksi dengan sertifikat SSL, fitur ini akan berfungsi normal.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          )}

          <div 
            id="qr-reader" 
            className={`w-full max-w-xl mx-auto overflow-hidden rounded-3xl shadow-2xl border-4 transition-all duration-300 bg-black ${
              scanResult?.success ? 'border-emerald-500 shadow-emerald-500/20' 
              : error ? (error.includes("bukan dari kelas ini") ? 'border-amber-500 shadow-amber-500/20' : 'border-red-500 shadow-red-500/20')
              : 'border-slate-700'
            } ${!scannerReady ? 'opacity-0' : 'opacity-100'}`}
          ></div>

          {/* Feedback Overlay */}
          <div className="mt-8 h-32 flex flex-col items-center justify-center w-full max-w-xl">
            {isProcessing ? (
              <div className="flex items-center gap-3 text-emerald-400 font-bold animate-pulse">
                <Loader2 className="w-6 h-6 animate-spin" /> Memproses...
              </div>
            ) : scanResult ? (
              <div className="w-full bg-emerald-500/10 border-2 border-emerald-500 rounded-2xl p-4 flex items-center gap-5 animate-in zoom-in shadow-lg backdrop-blur-sm">
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 border-emerald-400 bg-slate-800">
                  {scanResult.fotoWajah ? (
                    <Image src={scanResult.fotoWajah} alt={scanResult.nama} width={64} height={64} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><CheckCircle2 className="w-8 h-8 text-emerald-400" /></div>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-emerald-400 truncate">{scanResult.nama}</h2>
                  <p className="text-emerald-200/70 text-sm mt-0.5">Berhasil Dicatat (Hadir)</p>
                </div>
              </div>
            ) : error ? (
              <div className={`w-full border-2 rounded-2xl p-4 flex items-center gap-4 animate-in zoom-in shadow-lg backdrop-blur-sm ${
                error.includes("bukan") ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-red-500/10 border-red-500 text-red-400'
              }`}>
                <div className="shrink-0">
                  {error.includes("bukan") || error.includes("sudah") ? <AlertTriangle className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
                </div>
                <div>
                  <h2 className="text-xl font-bold leading-tight">{error}</h2>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-center">
                <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium">Arahkan barcode ke layar</p>
              </div>
            )}
          </div>
        </div>

        {/* Riwayat Sesi (Sidebar Kanan di Desktop, Bawah di Mobile) */}
        <div className="w-full md:w-80 bg-slate-800/50 border-l border-slate-700 flex flex-col p-4 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4 text-slate-300 px-2">
            <Clock className="w-4 h-4" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Riwayat Scan</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {scanHistory.map(item => (
              <div key={item.id} className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-slate-900 ${
                  item.status === 'success' ? 'bg-emerald-400' :
                  item.status === 'duplicate' ? 'bg-amber-400' :
                  item.status === 'wrong_class' ? 'bg-orange-400' : 'bg-red-400'
                }`}>
                  {item.nama.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 font-bold text-sm truncate">{item.nama}</p>
                  <div className="flex justify-between items-center mt-0.5">
                    <p className={`text-[10px] font-bold ${
                      item.status === 'success' ? 'text-emerald-400' :
                      item.status === 'duplicate' ? 'text-amber-400' :
                      item.status === 'wrong_class' ? 'text-orange-400' : 'text-red-400'
                    }`}>
                      {item.status === 'success' ? 'HADIR' :
                       item.status === 'duplicate' ? 'SUDAH ABSEN' :
                       item.status === 'wrong_class' ? 'BEDA KELAS' : 'GAGAL'}
                    </p>
                    <span className="text-[10px] text-slate-500">{item.time}</span>
                  </div>
                </div>
              </div>
            ))}
            {scanHistory.length === 0 && (
              <div className="text-center py-10 text-slate-500">
                <p className="text-sm">Belum ada santri</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
