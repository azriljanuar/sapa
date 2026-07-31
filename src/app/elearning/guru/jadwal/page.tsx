import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Calendar, Clock, BookOpen, AlertCircle } from "lucide-react"
import { JadwalFilter } from "./jadwal-filter"

const HARI_ORDER = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU", "MINGGU"]
const HARI_LABEL: Record<string, string> = {
  SENIN: "Senin", SELASA: "Selasa", RABU: "Rabu",
  KAMIS: "Kamis", JUMAT: "Jumat", SABTU: "Sabtu", MINGGU: "Minggu",
}
const WARNA_HARI: Record<string, string> = {
  SENIN: "bg-blue-50 border-blue-200 text-blue-700",
  SELASA: "bg-purple-50 border-purple-200 text-purple-700",
  RABU: "bg-emerald-50 border-emerald-200 text-emerald-700",
  KAMIS: "bg-orange-50 border-orange-200 text-orange-700",
  JUMAT: "bg-rose-50 border-rose-200 text-rose-700",
  SABTU: "bg-teal-50 border-teal-200 text-teal-700",
  MINGGU: "bg-slate-50 border-slate-200 text-slate-500",
}

export default async function JadwalMengajarPage({
  searchParams,
}: {
  searchParams: Promise<{ jenjangId?: string; semester?: string }>
}) {
  const session = await getSession()
  if (!session || session.role !== "GURU") redirect("/login")

  const params = await searchParams

  // Ambil semua TA (untuk dropdown semester yang lengkap)
  const allTA = await prisma.tahunAjaran.findMany({
    orderBy: { nama: "desc" },
    include: { semester: { orderBy: { nama: "asc" } } },
  })
  const activeTA = allTA[0] ?? null
  const allSemesters = allTA.flatMap(ta => 
    ta.semester.map(s => ({
      id: s.id,
      nama: `${s.nama} ${ta.nama}`
    }))
  )

  // Ambil jenjang dari pengampu AKTUAL guru (bukan GuruJenjangs M2M)
  // Ini memastikan jenjang yang ditampilkan sesuai dengan yang diajarkan
  const pengampuAll = await prisma.pengampuMataPelajaran.findMany({
    where: { guruId: session.id },
    include: { mataPelajaran: { include: { jenjang: true } } },
    distinct: ["mataPelajaranId"],
  })
  const jenjangMap = new Map<number, any>()
  for (const p of pengampuAll) {
    const j = p.mataPelajaran.jenjang
    jenjangMap.set(j.id, j)
  }
  const jenjangs = Array.from(jenjangMap.values()).sort((a, b) =>
    a.nama.localeCompare(b.nama)
  )

  // Resolve filter values
  const selectedJenjangId = params.jenjangId
    ? parseInt(params.jenjangId)
    : jenjangs.length === 1 ? jenjangs[0].id : null

  const selectedSemesterId = params.semester
    ? parseInt(params.semester)
    : activeTA?.semester[0]?.id ?? null

  // Query jadwal - filter jenjang hanya jika ada >1 jenjang dan user memilih
  let jadwal: any[] = []
  if (selectedSemesterId) {
    jadwal = await prisma.jadwalPelajaran.findMany({
      where: {
        semesterId: selectedSemesterId,
        pengampu: {
          guruId: session.id,
          // Hanya filter jenjang jika guru mengajar di >1 jenjang DAN ada pilihan
          ...(jenjangs.length > 1 && selectedJenjangId
            ? { mataPelajaran: { jenjangId: selectedJenjangId } }
            : {}),
        },
      },
      include: {
        pengampu: {
          include: {
            mataPelajaran: { include: { jenjang: true } },
            kelasFormal: true,
          },
        },
        semester: true,
      },
      orderBy: [{ hari: "asc" }, { jamMulai: "asc" }],
    })
  }


  // Kelompokkan per hari
  const jadwalPerHari: Record<string, typeof jadwal> = {}
  for (const hari of HARI_ORDER) {
    const items = jadwal.filter((j) => j.hari === hari)
    if (items.length > 0) jadwalPerHari[hari] = items
  }
  const hariAktif = Object.keys(jadwalPerHari)

  const selectedSemester = allSemesters.find((s) => s.id === selectedSemesterId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-indigo-600" />
            Jadwal Mengajar
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {selectedSemester ? (
              <span>
                Semester <strong>{selectedSemester.nama}</strong>
              </span>
            ) : (
              <span>
                Tahun Ajaran <strong>{activeTA?.nama || "-"}</strong>
              </span>
            )}
          </p>
        </div>

        {/* Filter (Client Component) */}
        <JadwalFilter
          jenjangs={jenjangs}
          semesters={allSemesters}
          selectedJenjangId={selectedJenjangId}
          selectedSemesterId={selectedSemesterId}
        />
      </div>

      {/* Info badge jenjang tunggal */}
      {jenjangs.length === 1 && (
        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium px-4 py-2 rounded-xl">
          <BookOpen className="h-4 w-4" />
          {jenjangs[0].nama}
        </div>
      )}

      {/* Tidak ada TA */}
      {!activeTA && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
          <p className="text-amber-700 font-medium">Belum ada Tahun Ajaran aktif</p>
          <p className="text-amber-600 text-sm mt-1">
            Hubungi Admin Jenjang untuk mengatur tahun ajaran.
          </p>
        </div>
      )}

      {/* Tidak ada jadwal */}
      {activeTA && jadwal.length === 0 && (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Belum ada jadwal mengajar</p>
          <p className="text-slate-400 text-sm mt-1">
            Jadwal dibuat oleh Admin Jenjang. Hubungi admin jika jadwal belum tersedia.
          </p>
        </div>
      )}

      {/* Jadwal per Hari */}
      {hariAktif.length > 0 && (
        <div className="space-y-5">
          {hariAktif.map((hari) => (
            <div
              key={hari}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              {/* Hari Header */}
              <div
                className={`px-5 py-3 border-b flex items-center gap-2 ${
                  WARNA_HARI[hari] || "bg-slate-50 border-slate-200"
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span className="font-bold text-sm uppercase tracking-wide">
                  {HARI_LABEL[hari]}
                </span>
                <span className="ml-auto text-xs font-medium opacity-70">
                  {jadwalPerHari[hari].length} sesi
                </span>
              </div>

              {/* Sesi list */}
              <div className="divide-y divide-slate-50">
                {jadwalPerHari[hari].map((j: any) => (
                  <div
                    key={j.id}
                    className="flex items-center gap-5 px-5 py-4 hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Jam */}
                    <div className="flex items-center gap-2 text-slate-500 min-w-[115px] shrink-0">
                      <Clock className="h-4 w-4 text-indigo-400 shrink-0" />
                      <span className="font-mono text-sm font-semibold">
                        {j.jamMulai} – {j.jamSelesai}
                      </span>
                    </div>

                    <div className="h-8 w-px bg-slate-200 shrink-0" />

                    {/* Mata pelajaran & kelas */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 truncate">
                        {j.pengampu.mataPelajaran.nama}
                      </div>
                      <div className="text-sm text-slate-500 mt-0.5 flex items-center gap-2">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-xs font-semibold">
                          {j.pengampu.kelasFormal.namaKelas}
                        </span>
                        <span className="text-xs text-slate-400">
                          {j.pengampu.mataPelajaran.jenjang.singkatan}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary stats */}
      {jadwal.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          {[
            { label: "Total Sesi", value: jadwal.length, color: "indigo" },
            { label: "Hari Mengajar", value: hariAktif.length, color: "purple" },
            {
              label: "Mata Pelajaran",
              value: new Set(jadwal.map((j: any) => j.pengampu.mataPelajaran.nama)).size,
              color: "emerald",
            },
            {
              label: "Kelas",
              value: new Set(jadwal.map((j: any) => j.pengampu.kelasFormal.namaKelas)).size,
              color: "orange",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`bg-${s.color}-50 border border-${s.color}-100 rounded-2xl p-4 text-center`}
            >
              <div className={`text-3xl font-extrabold text-${s.color}-700`}>{s.value}</div>
              <div className={`text-xs text-${s.color}-500 font-semibold mt-1 uppercase tracking-wide`}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
