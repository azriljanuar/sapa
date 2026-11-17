import prisma from "@/lib/prisma"
import { Hari, KaldikAgenda, SistemHariSekolah } from "@prisma/client"
import {
  HARI_MAP,
  HARI_LABEL_ID,
  KATEGORI_KALDIK_LABEL,
  DateAcademicStatus,
  MatriksBulanItem,
  MatriksSemesterSummary,
  normalizeDate,
  parseHariLiburRutin,
  serializeHariLiburRutin,
} from "./kaldik-types"

export * from "./kaldik-types"

// ── Migrasi Otomatis dari HariLibur ke Kaldik (Zero Data Loss) ────────────────
export async function migrateHariLiburToKaldik(tahunAjaranId: number) {
  try {
    // 1. Cek / Buat KaldikPengaturan
    let setting = await prisma.kaldikPengaturan.findUnique({
      where: { tahunAjaranId },
    })

    if (!setting) {
      // Ambil libur mingguan eksisting
      const weeklyHolidays = await prisma.hariLibur.findMany({
        where: { tipe: "MINGGUAN" },
      })

      const rawDays: Hari[] = weeklyHolidays.map((h) => h.hariMingguan).filter(Boolean) as Hari[]
      const hariLiburRutin: Hari[] = rawDays.length > 0 ? Array.from(new Set(rawDays)) : ["MINGGU"]

      let sistem: SistemHariSekolah = "ENAM_HARI"
      if (hariLiburRutin.includes("SABTU") && hariLiburRutin.includes("MINGGU")) {
        sistem = "LIMA_HARI"
      } else if (hariLiburRutin.includes("JUMAT")) {
        sistem = "PESANTREN_JUMAT"
      }

      setting = await prisma.kaldikPengaturan.create({
        data: {
          tahunAjaranId,
          sistemHariSekolah: sistem,
          hariLiburRutin: serializeHariLiburRutin(hariLiburRutin),
          keterangan: "Migrasi otomatis dari pengaturan libur mingguan SAPA",
        },
      })
    }

    // 2. Migrasi Libur Kondisional & Semester ke KaldikAgenda jika belum ada
    const existingAgendaCount = await prisma.kaldikAgenda.count({
      where: { tahunAjaranId },
    })

    if (existingAgendaCount === 0) {
      // Ambil libur kondisional & semester
      const oldHolidays = await prisma.hariLibur.findMany({
        where: {
          tipe: { in: ["KONDISIONAL", "SEMESTER"] },
        },
      })

      for (const h of oldHolidays) {
        if (h.tipe === "KONDISIONAL" && h.tanggal) {
          await prisma.kaldikAgenda.create({
            data: {
              tahunAjaranId,
              kategori: "LIBUR_NASIONAL",
              nama: h.nama,
              tanggalMulai: h.tanggal,
              tanggalAkhir: h.tanggal,
              warnaHex: "#dc2626",
              allowAbsensiRfid: false,
              keterangan: h.keterangan || "Migrasi Libur Kondisional",
              jenjangId: h.jenjangId,
            },
          })
        } else if (h.tipe === "SEMESTER" && h.tanggalMulai && h.tanggalAkhir) {
          await prisma.kaldikAgenda.create({
            data: {
              tahunAjaranId,
              kategori: "LIBUR_SEMESTER",
              nama: h.nama,
              tanggalMulai: h.tanggalMulai,
              tanggalAkhir: h.tanggalAkhir,
              warnaHex: "#d97706",
              allowAbsensiRfid: true, // Libur semester santri/guru piket tetap bisa scan RFID
              keterangan: h.keterangan || "Migrasi Libur Semester",
              jenjangId: h.jenjangId,
            },
          })
        }
      }
    }
  } catch (error) {
    console.error("Gagal menjalankan migrateHariLiburToKaldik:", error)
  }
}

// ── Core Resolver: checkDateStatus ───────────────────────────────────────────
export async function checkDateStatus(
  tanggalInput: Date | string,
  jenjangId?: number | null
): Promise<DateAcademicStatus> {
  const { dateObj, dateStr, hari } = normalizeDate(tanggalInput)

  // Ambil Tahun Ajaran yang sesuai dengan tahun penanggalan yang dicek, atau TA aktif/terbaru
  const [yStr] = dateStr.split("-")
  let activeTA = await prisma.tahunAjaran.findFirst({
    where: { nama: { contains: yStr } },
    include: { kaldikPengaturan: true },
  })

  if (!activeTA) {
    activeTA = await prisma.tahunAjaran.findFirst({
      where: { isActive: true },
      include: { kaldikPengaturan: true },
    }) || await prisma.tahunAjaran.findFirst({
      orderBy: { nama: "desc" },
      include: { kaldikPengaturan: true },
    })
  }

  const tahunAjaranId = activeTA?.id
  const hariLiburRutin = parseHariLiburRutin(activeTA?.kaldikPengaturan?.hariLiburRutin)
  const isRutineHoliday = hariLiburRutin.includes(hari)

  // 1. Cek KaldikAgenda untuk rentang tanggal ini
  let agenda: KaldikAgenda | null = null
  if (tahunAjaranId) {
    agenda = await prisma.kaldikAgenda.findFirst({
      where: {
        tahunAjaranId,
        tanggalMulai: { lte: dateObj },
        tanggalAkhir: { gte: dateObj },
        OR: [
          { jenjangId: null },
          ...(jenjangId ? [{ jenjangId }] : []),
        ],
      },
      orderBy: { id: "desc" },
    })
  }

  // Jika ditemukan agenda Kaldik spesifik
  if (agenda) {
    const isHolidayKategori = [
      "LIBUR_NASIONAL",
      "LIBUR_SEMESTER",
      "LIBUR_RAMADHAN",
      "LIBUR_KHUSUS",
    ].includes(agenda.kategori)

    const kategoriMeta = KATEGORI_KALDIK_LABEL[agenda.kategori]

    return {
      date: dateObj,
      dateStr,
      dayName: hari,
      isLibur: isHolidayKategori,
      isHariSekolah: !isHolidayKategori && !isRutineHoliday,
      kategoriUtama: agenda.kategori,
      namaStatus: agenda.nama,
      kodeSingkatan: agenda.kodeSingkatan || kategoriMeta?.singkatan,
      allowAbsensiRfid: agenda.allowAbsensiRfid,
      warnaBadge: agenda.warnaHex || kategoriMeta?.defaultWarna || "#3b82f6",
      keterangan: agenda.keterangan || undefined,
      agenda,
    }
  }

  // 2. Jika tidak ada agenda di KaldikAgenda, periksa HariLibur eksisting sebagai fallback
  const fallbackCond = await prisma.hariLibur.findFirst({
    where: {
      tipe: "KONDISIONAL",
      tanggal: dateObj,
      OR: [{ jenjangId: null }, ...(jenjangId ? [{ jenjangId }] : [])],
    },
  })

  if (fallbackCond) {
    return {
      date: dateObj,
      dateStr,
      dayName: hari,
      isLibur: true,
      isHariSekolah: false,
      kategoriUtama: "LIBUR_NASIONAL",
      namaStatus: fallbackCond.nama,
      kodeSingkatan: "LUN",
      allowAbsensiRfid: false,
      warnaBadge: "#dc2626",
      keterangan: fallbackCond.keterangan || undefined,
    }
  }

  const fallbackSemester = await prisma.hariLibur.findFirst({
    where: {
      tipe: "SEMESTER",
      tanggalMulai: { lte: dateObj },
      tanggalAkhir: { gte: dateObj },
      OR: [{ jenjangId: null }, ...(jenjangId ? [{ jenjangId }] : [])],
    },
  })

  if (fallbackSemester) {
    return {
      date: dateObj,
      dateStr,
      dayName: hari,
      isLibur: true,
      isHariSekolah: false,
      kategoriUtama: "LIBUR_SEMESTER",
      namaStatus: fallbackSemester.nama,
      kodeSingkatan: "LS",
      allowAbsensiRfid: true, // Sesuai aturan libur semester eksisting
      warnaBadge: "#d97706",
      keterangan: fallbackSemester.keterangan || undefined,
    }
  }

  // 3. Cek Hari Libur Rutin Mingguan
  if (isRutineHoliday) {
    return {
      date: dateObj,
      dateStr,
      dayName: hari,
      isLibur: true,
      isHariSekolah: false,
      kategoriUtama: "LIBUR_RUTIN",
      namaStatus: `Libur Rutin Mingguan (${HARI_LABEL_ID[hari]})`,
      kodeSingkatan: "LMR",
      allowAbsensiRfid: false,
      warnaBadge: "#f87171",
      keterangan: `Libur akhir pekan rutin ${HARI_LABEL_ID[hari]}`,
    }
  }

  // 4. Hari Efektif Belajar (KBM Reguler Tatap Muka)
  return {
    date: dateObj,
    dateStr,
    dayName: hari,
    isLibur: false,
    isHariSekolah: true,
    kategoriUtama: "HEB_REGULER",
    namaStatus: "Hari Efektif Belajar (KBM Reguler)",
    kodeSingkatan: "HEB",
    allowAbsensiRfid: true,
    warnaBadge: "#10b981",
  }
}

// ── Kalkulator Matriks Rekapitulasi Standar Kemenag (MEB / HEB) ───────────────
export async function getMatriksKaldikSemester(
  tahunAjaranId: number,
  selectedSemesterId?: number | null
): Promise<MatriksSemesterSummary> {
  const ta = await prisma.tahunAjaran.findUnique({
    where: { id: tahunAjaranId },
    include: {
      kaldikPengaturan: true,
      semester: true,
    },
  })

  if (!ta) {
    throw new Error("Tahun Ajaran tidak ditemukan")
  }

  const activeSemester =
    ta.semester.find((s) => s.id === selectedSemesterId) ||
    ta.semester.find((s) => s.isActive) ||
    ta.semester[0]

  const semesterNama = activeSemester?.nama || "GANJIL"
  const hariLiburRutin = parseHariLiburRutin(ta.kaldikPengaturan?.hariLiburRutin)
  const sistemHariSekolah = ta.kaldikPengaturan?.sistemHariSekolah || "ENAM_HARI"

  const years = ta.nama.match(/\d{4}/g)
  const startYear = years && years[0] ? parseInt(years[0]) : new Date().getFullYear()
  const endYear = years && years[1] ? parseInt(years[1]) : startYear + 1

  type MonthDef = { bulan: number; tahun: number; nama: string }
  const monthList: MonthDef[] =
    semesterNama === "GANJIL"
      ? [
          { bulan: 7, tahun: startYear, nama: `Juli ${startYear}` },
          { bulan: 8, tahun: startYear, nama: `Agustus ${startYear}` },
          { bulan: 9, tahun: startYear, nama: `September ${startYear}` },
          { bulan: 10, tahun: startYear, nama: `Oktober ${startYear}` },
          { bulan: 11, tahun: startYear, nama: `November ${startYear}` },
          { bulan: 12, tahun: startYear, nama: `Desember ${startYear}` },
        ]
      : [
          { bulan: 1, tahun: endYear, nama: `Januari ${endYear}` },
          { bulan: 2, tahun: endYear, nama: `Februari ${endYear}` },
          { bulan: 3, tahun: endYear, nama: `Maret ${endYear}` },
          { bulan: 4, tahun: endYear, nama: `April ${endYear}` },
          { bulan: 5, tahun: endYear, nama: `Mei ${endYear}` },
          { bulan: 6, tahun: endYear, nama: `Juni ${endYear}` },
        ]

  const allAgenda = await prisma.kaldikAgenda.findMany({
    where: { tahunAjaranId },
    orderBy: { tanggalMulai: "asc" },
  })

  const daftarBulan: MatriksBulanItem[] = []

  for (const mDef of monthList) {
    const daysInMonth = new Date(mDef.tahun, mDef.bulan, 0).getDate()
    const monthStart = new Date(Date.UTC(mDef.tahun, mDef.bulan - 1, 1))
    const monthEnd = new Date(Date.UTC(mDef.tahun, mDef.bulan - 1, daysInMonth))

    const listAgenda = allAgenda.filter(
      (a) => a.tanggalMulai <= monthEnd && a.tanggalAkhir >= monthStart
    )

    let liburRutin = 0
    let liburResmi = 0
    let nonEfektif = 0
    let hef = 0
    let heb = 0

    const dayStatuses: { date: Date; isHeb: boolean; reason: string }[] = []

    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(Date.UTC(mDef.tahun, mDef.bulan - 1, d))
      const localDate = new Date(mDef.tahun, mDef.bulan - 1, d)
      const dayHari = HARI_MAP[localDate.getDay()]

      const matchAgenda = listAgenda.find(
        (a) => a.tanggalMulai <= curDate && a.tanggalAkhir >= curDate
      )

      if (matchAgenda) {
        if (
          ["LIBUR_NASIONAL", "LIBUR_SEMESTER", "LIBUR_RAMADHAN", "LIBUR_KHUSUS"].includes(
            matchAgenda.kategori
          )
        ) {
          liburResmi++
          dayStatuses.push({ date: curDate, isHeb: false, reason: matchAgenda.nama })
        } else if (matchAgenda.kategori === "NON_EFEKTIF") {
          nonEfektif++
          dayStatuses.push({ date: curDate, isHeb: false, reason: matchAgenda.nama })
        } else if (matchAgenda.kategori === "HEF") {
          hef++
          dayStatuses.push({ date: curDate, isHeb: false, reason: matchAgenda.nama })
        } else if (matchAgenda.kategori === "HEB") {
          heb++
          dayStatuses.push({ date: curDate, isHeb: true, reason: matchAgenda.nama })
        }
      } else {
        if (hariLiburRutin.includes(dayHari)) {
          liburRutin++
          dayStatuses.push({ date: curDate, isHeb: false, reason: `Libur ${HARI_LABEL_ID[dayHari]}` })
        } else {
          heb++
          dayStatuses.push({ date: curDate, isHeb: true, reason: "KBM Reguler" })
        }
      }
    }

    let meb = 0
    let mte = 0
    const mteReasons: string[] = []

    let currentWeekHebCount = 0
    let currentWeekNonHebReasons: string[] = []

    for (let i = 0; i < dayStatuses.length; i++) {
      const item = dayStatuses[i]
      if (item.isHeb) {
        currentWeekHebCount++
      } else if (!item.reason.startsWith("Libur ")) {
        currentWeekNonHebReasons.push(item.reason)
      }

      const isSunday = item.date.getUTCDay() === 0
      const isLastDay = i === dayStatuses.length - 1

      if (isSunday || isLastDay) {
        if (currentWeekHebCount >= 3) {
          meb++
        } else {
          mte++
          const dominantReason = currentWeekNonHebReasons[0] || "Hari Efektif Kurang dari 3 Hari"
          if (!mteReasons.includes(dominantReason)) {
            mteReasons.push(dominantReason)
          }
        }
        currentWeekHebCount = 0
        currentWeekNonHebReasons = []
      }
    }

    daftarBulan.push({
      bulan: mDef.bulan,
      tahun: mDef.tahun,
      namaBulan: mDef.nama,
      hk: daysInMonth,
      liburRutin,
      liburResmi,
      nonEfektif,
      hef,
      heb,
      meb,
      mte,
      keteranganMte: mteReasons,
      listAgenda,
    })
  }

  const totalHk = daftarBulan.reduce((acc, b) => acc + b.hk, 0)
  const totalLiburRutin = daftarBulan.reduce((acc, b) => acc + b.liburRutin, 0)
  const totalLiburResmi = daftarBulan.reduce((acc, b) => acc + b.liburResmi, 0)
  const totalNonEfektif = daftarBulan.reduce((acc, b) => acc + b.nonEfektif, 0)
  const totalHef = daftarBulan.reduce((acc, b) => acc + b.hef, 0)
  const totalHeb = daftarBulan.reduce((acc, b) => acc + b.heb, 0)
  const totalMeb = daftarBulan.reduce((acc, b) => acc + b.meb, 0)
  const totalMte = daftarBulan.reduce((acc, b) => acc + b.mte, 0)
  const rataRataHebPerBulan = Math.round((totalHeb / (daftarBulan.length || 1)) * 10) / 10

  return {
    tahunAjaranId: ta.id,
    tahunAjaranNama: ta.nama,
    semesterId: activeSemester?.id || null,
    semesterNama,
    sistemHariSekolah,
    hariLiburRutin,
    daftarBulan,
    totalHk,
    totalLiburRutin,
    totalLiburResmi,
    totalNonEfektif,
    totalHef,
    totalHeb,
    totalMeb,
    totalMte,
    rataRataHebPerBulan,
  }
}
