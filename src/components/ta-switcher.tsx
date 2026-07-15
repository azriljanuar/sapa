"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { setSelectedTahunAjaran } from "@/lib/ta-actions"

type TaType = {
  id: number
  nama: string
  isActive: boolean
}

export function TaSwitcher({
  tahunAjarans,
  selectedId,
}: {
  tahunAjarans: TaType[]
  selectedId: number
}) {
  const [isPending, startTransition] = React.useTransition()
  const selectedTa = tahunAjarans.find((ta) => ta.id === selectedId)

  const handleChange = (val: string | null) => {
    if (!val) return
    startTransition(async () => {
      await setSelectedTahunAjaran(Number(val))
      window.location.reload()
    })
  }

  return (
    <Select 
      value={selectedId.toString()} 
      onValueChange={handleChange}
      disabled={isPending}
    >
      <SelectTrigger className="w-[180px] h-9 bg-white shadow-sm font-semibold border-slate-200">
        <SelectValue>
          {selectedTa ? (
            <span className="flex items-center gap-2">
              <span className="text-emerald-700">{selectedTa.nama}</span>
              {selectedTa.isActive && (
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" title="Tahun Ajaran Aktif"></span>
              )}
            </span>
          ) : (
            "Pilih Tahun Ajaran"
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {tahunAjarans.map((ta) => (
          <SelectItem key={ta.id} value={ta.id.toString()}>
            <div className="flex items-center gap-2">
              <span>{ta.nama}</span>
              {ta.isActive && (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-sm font-semibold">
                  Aktif
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
