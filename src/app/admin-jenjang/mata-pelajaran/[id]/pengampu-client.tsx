"use client"

import { useState } from "react"
import { ArrowLeft, UserPlus, Trash2, Edit } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

import { assignPengampuAction, removePengampuAction } from "./actions"

type PengampuType = {
  id: number
  kelasFormal: { id: number, namaKelas: string }
  guru: { id: number, nama: string }
}

export function PengampuClient({ 
  mapelId,
  mapelNama,
  tahunAjaranId,
  initialData,
  availableClasses,
  availableGurus
}: { 
  mapelId: number
  mapelNama: string
  tahunAjaranId: number
  initialData: PengampuType[]
  availableClasses: { id: number, namaKelas: string }[]
  availableGurus: { id: number, nama: string }[]
}) {
  const [data, setData] = useState<PengampuType[]>(initialData)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // State for form
  const [selectedGuru, setSelectedGuru] = useState("")
  const [selectedKelasIds, setSelectedKelasIds] = useState<number[]>([])

  const openAddDialog = () => {
    setSelectedGuru("")
    setSelectedKelasIds([])
    setIsDialogOpen(true)
  }

  const openEditDialog = (guruId: string, kelasIds: number[]) => {
    setSelectedGuru(guruId)
    setSelectedKelasIds(kelasIds)
    setIsDialogOpen(true)
  }

  const toggleKelasSelection = (id: number) => {
    setSelectedKelasIds(prev => 
      prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]
    )
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedKelasIds.length === 0 || !selectedGuru) return

    setIsSubmitting(true)
    try {
      const res = await assignPengampuAction(
        mapelId,
        selectedKelasIds,
        parseInt(selectedGuru),
        tahunAjaranId
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
    if (!confirm("Hapus pemetaan untuk kelas ini?")) return
    const res = await removePengampuAction(id)
    if (res.success) {
      setData(data.filter(d => d.id !== id))
    } else {
      alert(res.error)
    }
  }

  // Group data by Guru
  const groupedByGuru = data.reduce((acc, curr) => {
    if (!acc[curr.guru.id]) {
      acc[curr.guru.id] = {
        guru: curr.guru,
        mappings: []
      }
    }
    acc[curr.guru.id].mappings.push(curr)
    return acc
  }, {} as Record<number, { guru: {id: number, nama: string}, mappings: PengampuType[] }>)

  const groupedArray = Object.values(groupedByGuru).sort((a, b) => a.guru.nama.localeCompare(b.guru.nama))

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => window.location.href = "/admin-jenjang/mata-pelajaran"}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Pemetaan Kelas & Guru</h2>
          <p className="text-slate-500">Mata Pelajaran: {mapelNama}</p>
        </div>
        <div className="ml-auto">
          <Button onClick={openAddDialog} className="bg-emerald-600 hover:bg-emerald-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Tambah / Atur Kelas
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Guru Pengampu</TableHead>
              <TableHead>Kelas yang Diajar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedArray.length > 0 ? (
              groupedArray.map((group) => (
                <TableRow key={group.guru.id}>
                  <TableCell className="font-semibold text-slate-900 align-top pt-4 w-[250px]">
                    <div className="flex items-center justify-between">
                      <span>{group.guru.nama}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => openEditDialog(group.guru.id.toString(), group.mappings.map(m => m.kelasFormal.id))}
                        title="Edit pemetaan guru ini"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="pt-4 pb-4">
                    <div className="flex flex-wrap gap-2">
                      {group.mappings.map(mapping => (
                        <div 
                          key={mapping.id} 
                          className="flex items-center bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-md text-sm font-medium"
                        >
                          <span>{mapping.kelasFormal.namaKelas}</span>
                          <button 
                            onClick={() => handleDelete(mapping.id)}
                            className="ml-2 text-emerald-600 hover:text-red-600 focus:outline-none"
                            title="Hapus kelas ini"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center text-slate-500">
                  Mata pelajaran ini belum ditugaskan ke guru manapun.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tugaskan Kelas & Guru</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4 pt-4">
            
            <div className="space-y-2">
              <Label>Pilih Guru Pengampu</Label>
              <Select value={selectedGuru} onValueChange={(val) => setSelectedGuru(val || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Pilih Guru --">
                    {(val: string) => {
                      const g = availableGurus.find(guru => guru.id.toString() === val)
                      return g ? g.nama : "-- Pilih Guru --"
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableGurus.map(g => (
                    <SelectItem key={g.id} value={g.id.toString()} label={g.nama}>
                      {g.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 pt-2">
              <Label>Pilih Kelas (Bisa lebih dari satu)</Label>
              <div className="mt-2 border rounded-md p-3 max-h-[200px] overflow-y-auto bg-slate-50 space-y-3">
                {availableClasses.length > 0 ? availableClasses.map(k => (
                  <div key={k.id} className="flex items-center space-x-3">
                    <Checkbox 
                      id={`kelas-${k.id}`} 
                      checked={selectedKelasIds.includes(k.id)}
                      onCheckedChange={() => toggleKelasSelection(k.id)}
                    />
                    <label 
                      htmlFor={`kelas-${k.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-slate-700"
                    >
                      {k.namaKelas}
                    </label>
                  </div>
                )) : (
                  <div className="text-sm text-slate-500 italic">Tidak ada kelas tersedia.</div>
                )}
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
              <Button type="submit" disabled={isSubmitting || selectedKelasIds.length === 0 || !selectedGuru} className="bg-emerald-600 hover:bg-emerald-700">
                {isSubmitting ? "Menyimpan..." : "Simpan Pemetaan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
