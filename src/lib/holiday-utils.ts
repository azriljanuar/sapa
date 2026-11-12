import prisma from "@/lib/prisma"
import { Hari } from "@prisma/client"

export interface HolidayCheckResult {
  isLibur: boolean
  namaLibur?: string
  tipeLibur?: "MINGGUAN" | "KONDISIONAL" | "SEMESTER"
  keterangan?: string
  allowRfidScan: boolean
}

const HARI_MAP: Hari[] = [
  "MINGGU",
  "SENIN",
  "SELASA",
  "RABU",
  "KAMIS",
  "JUMAT",
  "SABTU",
]

/**
 * Normalisasi Date atau string YYYY-MM-DD menjadi Date object tanpa jam (00:00:00)
 */
export function normalizeDate(dateInput: Date | string): { dateObj: Date; dateStr: string; hari: Hari } {
  if (typeof dateInput === "string") {
    // Anggap format YYYY-MM-DD
    const [y, m, d] = dateInput.split("-").map(Number)
    const dateObj = new Date(Date.UTC(y, m - 1, d))
    const localDate = new Date(y, m - 1, d)
    const hari = HARI_MAP[localDate.getDay()]
    const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    return { dateObj, dateStr, hari }
  } else {
    // Ambil tanggal dengan zona waktu Indonesia WIB (+7)
    const utc = dateInput.getTime() + dateInput.getTimezoneOffset() * 60000
    const wib = new Date(utc + 7 * 3600000)
    const y = wib.getFullYear()
    const m = wib.getMonth() + 1
    const d = wib.getDate()
    const dateObj = new Date(Date.UTC(y, m - 1, d))
    const hari = HARI_MAP[wib.getDay()]
    const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    return { dateObj, dateStr, hari }
  }
}

/**
 * Memeriksa apakah suatu tanggal termasuk hari libur (Mingguan, Kondisional, atau Libur Semester)
 */
export async function isHariLibur(
  tanggalInput: Date | string,
  jenjangId?: number | null
): Promise<HolidayCheckResult> {
  const { dateObj, hari } = normalizeDate(tanggalInput)

  // 1. Cek Libur Kondisional (tanggal spesifik tertentu)
  const condHoliday = await prisma.hariLibur.findFirst({
    where: {
      tipe: "KONDISIONAL",
      tanggal: dateObj,
      OR: [
        { jenjangId: null },
        ...(jenjangId ? [{ jenjangId }] : []),
      ],
    },
  })

  if (condHoliday) {
    return {
      isLibur: true,
      namaLibur: condHoliday.nama,
      tipeLibur: "KONDISIONAL",
      keterangan: condHoliday.keterangan || undefined,
      allowRfidScan: false, // Ditolak
    }
  }

  // 2. Cek Libur Semester (rentang tanggal)
  const semesterHoliday = await prisma.hariLibur.findFirst({
    where: {
      tipe: "SEMESTER",
      tanggalMulai: { lte: dateObj },
      tanggalAkhir: { gte: dateObj },
      OR: [
        { jenjangId: null },
        ...(jenjangId ? [{ jenjangId }] : []),
      ],
    },
  })

  if (semesterHoliday) {
    return {
      isLibur: true,
      namaLibur: semesterHoliday.nama,
      tipeLibur: "SEMESTER",
      keterangan: semesterHoliday.keterangan || undefined,
      allowRfidScan: true, // Catatan khusus: Libur semester BISA mencatat kehadiran RFID
    }
  }

  // 3. Cek Libur Mingguan (hari tertentu seperti MINGGU, SABTU, dll.)
  const weeklyHoliday = await prisma.hariLibur.findFirst({
    where: {
      tipe: "MINGGUAN",
      hariMingguan: hari,
      OR: [
        { jenjangId: null },
        ...(jenjangId ? [{ jenjangId }] : []),
      ],
    },
  })

  if (weeklyHoliday) {
    return {
      isLibur: true,
      namaLibur: weeklyHoliday.nama || `Libur Rutin Mingguan (${hari})`,
      tipeLibur: "MINGGUAN",
      keterangan: weeklyHoliday.keterangan || undefined,
      allowRfidScan: false, // Ditolak
    }
  }

  return {
    isLibur: false,
    allowRfidScan: true,
  }
}
