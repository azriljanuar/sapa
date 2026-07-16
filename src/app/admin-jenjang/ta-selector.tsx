"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { setSelectedTaCookie } from "./ta-actions"

type TAItem = {
  id: number
  nama: string
  isActive: boolean
}

export function TaSelector({ 
  items, 
  currentTaId 
}: { 
  items: TAItem[], 
  currentTaId: number | null 
}) {
  const handleChange = async (val: string | null) => {
    if (!val) return
    await setSelectedTaCookie(val)
    window.location.reload()
  }

  return (
    <div className="mb-4">
      <label className="text-xs font-semibold text-slate-500 mb-1 block">
        Tahun Ajaran Aktif
      </label>
      <Select 
        value={currentTaId ? currentTaId.toString() : ""} 
        onValueChange={handleChange}
      >
        <SelectTrigger className="w-full bg-slate-50 h-8 text-xs font-medium border-slate-200">
          <SelectValue placeholder="Pilih Tahun Ajaran">
            {(val: string) => {
              const selectedItem = items.find(ta => ta.id.toString() === val)
              if (!selectedItem) return "Pilih Tahun Ajaran"
              return selectedItem.nama
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {items.map(ta => (
            <SelectItem key={ta.id} value={ta.id.toString()} label={ta.nama}>
              {ta.nama}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
