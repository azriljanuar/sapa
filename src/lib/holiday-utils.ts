import { checkDateStatus, normalizeDate } from "@/lib/kaldik-utils"
import { Hari } from "@prisma/client"

export { normalizeDate }

export interface HolidayCheckResult {
  isLibur: boolean
  namaLibur?: string
  tipeLibur?: "MINGGUAN" | "KONDISIONAL" | "SEMESTER"
  keterangan?: string
  allowRfidScan: boolean
}

/**
 * Memeriksa apakah suatu tanggal termasuk hari libur (Mingguan, Kondisional, atau Libur Semester)
 * Terintegrasi penuh dengan Kalender Pendidikan (Kaldik) Standar Kemenag.
 */
export async function isHariLibur(
  tanggalInput: Date | string,
  jenjangId?: number | null
): Promise<HolidayCheckResult> {
  const status = await checkDateStatus(tanggalInput, jenjangId)

  let tipeLibur: "MINGGUAN" | "KONDISIONAL" | "SEMESTER" | undefined = undefined
  if (status.kategoriUtama === "LIBUR_RUTIN") {
    tipeLibur = "MINGGUAN"
  } else if (status.kategoriUtama === "LIBUR_SEMESTER") {
    tipeLibur = "SEMESTER"
  } else if (status.isLibur) {
    tipeLibur = "KONDISIONAL"
  }

  return {
    isLibur: status.isLibur,
    namaLibur: status.namaStatus,
    tipeLibur,
    keterangan: status.keterangan,
    allowRfidScan: status.allowAbsensiRfid,
  }
}
