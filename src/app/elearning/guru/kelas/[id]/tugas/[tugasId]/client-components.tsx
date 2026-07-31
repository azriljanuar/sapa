"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { nilaiTugas } from "../../../../actions"

export function NilaiForm({ pengumpulanId }: { pengumpulanId: number }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [nilai, setNilai] = useState("")
  const [keterangan, setKeterangan] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await nilaiTugas(pengumpulanId, parseInt(nilai), keterangan)
      if (res.success) {
        setOpen(false)
      } else {
        alert(res.error)
      }
    } catch (err) {
      alert("Terjadi kesalahan")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="h-8 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 px-3 rounded-md">
        Beri Nilai
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Evaluasi Tugas</h4>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Nilai (0-100)</label>
              <Input 
                type="number" 
                min="0" 
                max="100" 
                value={nilai} 
                onChange={e => setNilai(e.target.value)} 
                required 
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Komentar/Masukan (Opsional)</label>
              <Textarea 
                value={keterangan} 
                onChange={e => setKeterangan(e.target.value)} 
                className="text-sm min-h-[80px]"
                placeholder="Kerja bagus..."
              />
            </div>
            <Button type="submit" className="w-full h-8 text-xs" disabled={isLoading || !nilai}>
              {isLoading ? "Menyimpan..." : "Simpan Nilai"}
            </Button>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  )
}
