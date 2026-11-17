import { Hari, KategoriKaldik, SistemHariSekolah, KaldikAgenda } from "@prisma/client"

export const HARI_MAP: Hari[] = [
  "MINGGU",
  "SENIN",
  "SELASA",
  "RABU",
  "KAMIS",
  "JUMAT",
  "SABTU",
]

export const HARI_LABEL_ID: Record<Hari, string> = {
  SENIN: "Senin",
  SELASA: "Selasa",
  RABU: "Rabu",
  KAMIS: "Kamis",
  JUMAT: "Jumat",
  SABTU: "Sabtu",
  MINGGU: "Ahad",
}

export const KATEGORI_KALDIK_LABEL: Record<
  KategoriKaldik,
  { label: string; singkatan: string; defaultWarna: string; deskripsi: string }
> = {
  HEB: {
    label: "Hari Efektif Belajar",
    singkatan: "HEB",
    defaultWarna: "#10b981", // Emerald
    deskripsi: "KBM Tatap Muka Reguler Madrasah",
  },
  HEF: {
    label: "Hari Efektif Fakultatif",
    singkatan: "HEF",
    defaultWarna: "#059669", // Hijau Tua
    deskripsi: "Hari kegiatan khusus terprogram (Hari Santri, HAB, Pesantren Ramadhan, Outing)",
  },
  NON_EFEKTIF: {
    label: "Aktivitas Khusus Madrasah",
    singkatan: "Non-Efektif",
    defaultWarna: "#4f46e5", // Indigo
    deskripsi: "Kegiatan tanpa KBM reguler (Matsama, ASTS/ASAS/ASAT/AM, Jeda Semester, P5-PPRA, Rapor)",
  },
  LIBUR_NASIONAL: {
    label: "Libur Nasional & Hari Besar",
    singkatan: "LUN",
    defaultWarna: "#dc2626", // Merah
    deskripsi: "Libur resmi pemerintah atau hari besar keagamaan",
  },
  LIBUR_SEMESTER: {
    label: "Libur Akhir Semester",
    singkatan: "LS",
    defaultWarna: "#d97706", // Amber
    deskripsi: "Libur jeda akhir semester ganjil atau libur kenaikan kelas",
  },
  LIBUR_RAMADHAN: {
    label: "Libur Ramadhan & Idulfitri",
    singkatan: "LBR",
    defaultWarna: "#ea580c", // Oranye
    deskripsi: "Libur awal Ramadhan dan hari raya Idulfitri",
  },
  LIBUR_KHUSUS: {
    label: "Libur Khusus Pesantren",
    singkatan: "LKP",
    defaultWarna: "#e11d48", // Rose
    deskripsi: "Libur kondisional atau kebijakan khusus pimpinan pesantren",
  },
}

export interface DateAcademicStatus {
  date: Date
  dateStr: string // "YYYY-MM-DD"
  dayName: Hari // "SENIN"
  isLibur: boolean
  isHariSekolah: boolean
  kategoriUtama: KategoriKaldik | "LIBUR_RUTIN" | "HEB_REGULER"
  namaStatus: string
  kodeSingkatan?: string
  allowAbsensiRfid: boolean
  warnaBadge: string
  keterangan?: string
  agenda?: KaldikAgenda | null
}

export interface MatriksBulanItem {
  bulan: number // 1 - 12
  tahun: number
  namaBulan: string // "Juli 2026"
  hk: number // Hari Kalender
  liburRutin: number
  liburResmi: number
  nonEfektif: number
  hef: number
  heb: number
  meb: number // Minggu Efektif Belajar
  mte: number // Minggu Tidak Efektif
  keteranganMte: string[]
  listAgenda: KaldikAgenda[]
}

export interface MatriksSemesterSummary {
  tahunAjaranId: number
  tahunAjaranNama: string
  semesterId: number | null
  semesterNama: string
  sistemHariSekolah: SistemHariSekolah
  hariLiburRutin: Hari[]
  daftarBulan: MatriksBulanItem[]
  totalHk: number
  totalLiburRutin: number
  totalLiburResmi: number
  totalNonEfektif: number
  totalHef: number
  totalHeb: number
  totalMeb: number
  totalMte: number
  rataRataHebPerBulan: number
}

// ── Helper Waktu WIB ────────────────────────────────────────────────────────
export function getWibDate(date = new Date()): Date {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000
  return new Date(utc + 7 * 3600000)
}

export function normalizeDate(dateInput: Date | string): { dateObj: Date; dateStr: string; hari: Hari } {
  if (typeof dateInput === "string") {
    const [y, m, d] = dateInput.split("-").map(Number)
    const dateObj = new Date(Date.UTC(y, m - 1, d))
    const localDate = new Date(y, m - 1, d)
    const hari = HARI_MAP[localDate.getDay()]
    const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    return { dateObj, dateStr, hari }
  } else {
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

export function parseHariLiburRutin(str?: string | null): Hari[] {
  if (!str) return ["MINGGU"]
  const parts = str.split(",").map((s) => s.trim().toUpperCase() as Hari)
  const valid = parts.filter((p) => HARI_MAP.includes(p))
  return valid.length > 0 ? valid : ["MINGGU"]
}

export function serializeHariLiburRutin(days: Hari[]): string {
  if (!days || days.length === 0) return "MINGGU"
  return Array.from(new Set(days)).join(",")
}
