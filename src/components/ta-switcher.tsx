"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { setSelectedSemesterCookie } from "@/lib/ta-actions"

type SemesterType = {
  id: number
  nama: string
  isActive: boolean
}

type TaType = {
  id: number
  nama: string
  isActive: boolean
  semester: SemesterType[]
}

export function TaSwitcher({
  tahunAjarans,
  selectedSemesterId,
}: {
  tahunAjarans: TaType[]
  selectedSemesterId: number | null
}) {
  const [isPending, startTransition] = React.useTransition()

  // Build a flat list of options
  const options = tahunAjarans.flatMap((ta) => 
    ta.semester.map((sem) => ({
      id: sem.id,
      label: `${ta.nama} - ${sem.nama}`,
      isTaActive: ta.isActive,
      isSemActive: sem.isActive
    }))
  )

  const selectedOption = options.find((opt) => opt.id === selectedSemesterId)

  const handleChange = (val: string | null) => {
    if (!val) return
    startTransition(async () => {
      await setSelectedSemesterCookie(Number(val))
      window.location.reload()
    })
  }

  if (options.length === 0) {
    return (
      <div className="text-xs text-muted-foreground">Belum ada Tahun Ajaran</div>
    )
  }

  return (
    <Select 
      value={selectedSemesterId ? selectedSemesterId.toString() : ""} 
      onValueChange={handleChange}
      disabled={isPending}
    >
      <SelectTrigger className="w-[220px] h-9 bg-white shadow-sm font-semibold border-slate-200">
        <SelectValue>
          {selectedOption ? (
            <span className="flex items-center gap-2">
              <span className="text-emerald-700">{selectedOption.label}</span>
              {(selectedOption.isTaActive && selectedOption.isSemActive) && (
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" title="Semester Aktif"></span>
              )}
            </span>
          ) : (
            "Pilih Semester"
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.id} value={opt.id.toString()}>
            <div className="flex items-center gap-2">
              <span>{opt.label}</span>
              {(opt.isTaActive && opt.isSemActive) && (
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
