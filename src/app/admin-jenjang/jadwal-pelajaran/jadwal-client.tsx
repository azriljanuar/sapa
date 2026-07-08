"use client"

import { useState } from "react"
import { Plus, Trash2, Clock } from "lucide-react"
import { Hari } from "@prisma/client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { createJadwalAction, deleteJadwalAction } from "./actions"

type PengampuData = {
  id: number
  mataPelajaran: { id: number, nama: string }
  guru: { id: number, nama: string }
}

type JadwalData = {
  id: number
  hari: Hari
  jamMulai: string
  jamSelesai: string
  pengampu: PengampuData
}

const HARI_ORDER = {
  SENIN: 1,
  SELASA: 2,
  RABU: 3,
  KAMIS: 4,
  JUMAT: 5,
  SABTU: 6,
  MINGGU: 7,
}

export function JadwalClient({
  activeTa,
  activeSemester,
  kelasFormalList,
  pengampuList, // all pengampu mappings for current TA & Jenjang
  initialJadwal // all schedules for current Semester & Jenjang
}: {
  activeTa: any
  activeSemester: any
  kelasFormalList: { id: number, namaKelas: string }[]
  pengampuList: (PengampuData & { kelasFormalId: number })[]
  initialJadwal: (JadwalData & { pengampu: { kelasFormalId: number } })[]
}) {
  const [selectedKelasId, setSelectedKelasId] = useState<string>("")
  const [jadwalData, setJadwalData] = useState(initialJadwal)
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [formPengampuId, setFormPengampuId] = useState("")
  const [formHari, setFormHari] = useState<Hari | "">("")
  const [formJamMulai, setFormJamMulai] = useState("")
  const [formJamSelesai, setFormJamSelesai] = useState("")

  // Filter pengampu and jadwal based on selected class
  const classPengampu = pengampuList.filter(p => p.kelasFormalId.toString() === selectedKelasId)
  const classJadwal = jadwalData.filter(j => j.pengampu.kelasFormalId.toString() === selectedKelasId)

  // Sort schedule by Hari then JamMulai
  classJadwal.sort((a, b) => {
    if (HARI_ORDER[a.hari] !== HARI_ORDER[b.hari]) {
      return HARI_ORDER[a.hari] - HARI_ORDER[b.hari]
    }
    return a.jamMulai.localeCompare(b.jamMulai)
  })

  // Group by Hari
  const groupedJadwal = classJadwal.reduce((acc, curr) => {
    if (!acc[curr.hari]) acc[curr.hari] = []
    acc[curr.hari].push(curr)
    return acc
  }, {} as Record<string, JadwalData[]>)

  const openAddDialog = () => {
    setFormPengampuId("")
    setFormHari("")
    setFormJamMulai("")
    setFormJamSelesai("")
    setIsDialogOpen(true)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formPengampuId || !formHari || !formJamMulai || !formJamSelesai) return

    setIsSubmitting(true)
    try {
      const res = await createJadwalAction(
        parseInt(formPengampuId),
        activeSemester.id,
        formHari as Hari,
        formJamMulai,
        formJamSelesai
      )

      if (res.success) {
        window.location.reload()
      } else {
        alert(res.error)
      }
    } catch (error) {
      alert("Terjadi kesalahan")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus jadwal ini?")) return
    const res = await deleteJadwalAction(id)
    if (res.success) {
      setJadwalData(prev => prev.filter(j => j.id !== id))
    } else {
      alert(res.error)
    }
  }

  if (!activeSemester) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-lg">
        Belum ada Semester yang aktif di Tahun Ajaran ini. Silakan hubungi Super Admin.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Manajemen Jadwal Pelajaran</h2>
          <p className="text-slate-500 text-sm mt-1">
            TA: {activeTa.nama} | Semester: {activeSemester.nama}
          </p>
        </div>
        
        <div className="w-full sm:w-64">
          <Label className="sr-only">Pilih Kelas</Label>
          <Select value={selectedKelasId} onValueChange={(val) => setSelectedKelasId(val || "")}>
            <SelectTrigger className="w-full bg-white border-slate-200">
              <SelectValue placeholder="Pilih Kelas...">
                {(val: string) => {
                  const k = kelasFormalList.find(kelas => kelas.id.toString() === val)
                  return k ? k.namaKelas : "Pilih Kelas..."
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {kelasFormalList.map(k => (
                <SelectItem key={k.id} value={k.id.toString()} label={k.namaKelas}>
                  {k.namaKelas}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedKelasId ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800">
              Jadwal Kelas: {kelasFormalList.find(k => k.id.toString() === selectedKelasId)?.namaKelas}
            </h3>
            <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Jadwal
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.keys(HARI_ORDER).map((hariString) => {
              const hari = hariString as Hari
              const items = groupedJadwal[hari] || []
              
              if (items.length === 0) return null

              return (
                <div key={hari} className="border border-slate-100 rounded-lg bg-slate-50 overflow-hidden shadow-sm">
                  <div className="bg-slate-200/50 px-4 py-2 border-b border-slate-100 font-semibold text-slate-700 flex justify-between items-center">
                    {hari}
                    <span className="text-xs bg-white px-2 py-0.5 rounded-full text-slate-500 border shadow-sm">
                      {items.length} sesi
                    </span>
                  </div>
                  <div className="p-3 space-y-3">
                    {items.map(item => (
                      <div key={item.id} className="bg-white p-3 rounded-md border border-slate-100 shadow-sm relative group">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-bold text-blue-700">{item.pengampu.mataPelajaran.nama}</div>
                            <div className="text-xs text-slate-500 mt-1">{item.pengampu.guru.nama}</div>
                          </div>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-3 flex items-center text-xs font-medium text-slate-600 bg-slate-50 w-max px-2 py-1 rounded">
                          <Clock className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                          {item.jamMulai} - {item.jamSelesai}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {classJadwal.length === 0 && (
            <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <CalendarDaysIcon className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p>Belum ada jadwal untuk kelas ini.</p>
              <p className="text-sm mt-1">Klik tombol <b>Tambah Jadwal</b> untuk memulai.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500">
          <BookOpenIcon className="h-16 w-16 mx-auto text-slate-200 mb-4" />
          <p className="text-lg">Silakan pilih kelas terlebih dahulu untuk melihat dan mengatur jadwal.</p>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tambah Jadwal Pelajaran</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4 pt-4">
            
            <div className="space-y-2">
              <Label>Mata Pelajaran & Guru</Label>
              <Select value={formPengampuId} onValueChange={(val) => setFormPengampuId(val || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Pelajaran...">
                    {(val: string) => {
                      const p = classPengampu.find(pengampu => pengampu.id.toString() === val)
                      return p ? `${p.mataPelajaran.nama} (${p.guru.nama})` : "Pilih Pelajaran..."
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {classPengampu.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()} label={`${p.mataPelajaran.nama} (${p.guru.nama})`}>
                      {`${p.mataPelajaran.nama} (${p.guru.nama})`}
                    </SelectItem>
                  ))}
                  {classPengampu.length === 0 && (
                    <div className="p-2 text-sm text-slate-500 italic">Belum ada pemetaan guru di kelas ini.</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Hari</Label>
              <Select value={formHari} onValueChange={(val) => setFormHari(val as Hari)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Hari...">
                    {(val: string) => val || "Pilih Hari..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(HARI_ORDER).map(h => (
                    <SelectItem key={h} value={h} label={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jam Mulai</Label>
                <Input 
                  type="time" 
                  required
                  value={formJamMulai} 
                  onChange={e => setFormJamMulai(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>Jam Selesai</Label>
                <Input 
                  type="time" 
                  required
                  value={formJamSelesai} 
                  onChange={e => setFormJamSelesai(e.target.value)} 
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting || !formPengampuId || !formHari || !formJamMulai || !formJamSelesai} className="bg-blue-600 hover:bg-blue-700">
                {isSubmitting ? "Menyimpan..." : "Simpan Jadwal"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CalendarDaysIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
      <path d="M8 18h.01" />
      <path d="M12 18h.01" />
      <path d="M16 18h.01" />
    </svg>
  )
}

function BookOpenIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}
