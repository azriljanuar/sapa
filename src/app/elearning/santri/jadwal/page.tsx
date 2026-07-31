import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Calendar, Clock, BookOpen, AlertCircle } from "lucide-react"

const HARI_ORDER = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"]
const HARI_LABEL: Record<string, string> = {
  SENIN: "Senin", SELASA: "Selasa", RABU: "Rabu",
  KAMIS: "Kamis", JUMAT: "Jumat", SABTU: "Sabtu",
}
const WARNA_HARI: Record<string, string> = {
  SENIN: "bg-blue-50 border-blue-200 text-blue-700",
  SELASA: "bg-purple-50 border-purple-200 text-purple-700",
  RABU: "bg-emerald-50 border-emerald-200 text-emerald-700",
  KAMIS: "bg-orange-50 border-orange-200 text-orange-700",
  JUMAT: "bg-rose-50 border-rose-200 text-rose-700",
  SABTU: "bg-teal-50 border-teal-200 text-teal-700",
}

export default async function SantriJadwalPage() {
  const session = await getSession()
  if (!session || session.role !== "SANTRI") redirect("/login")

  const { getSelectedSemester } = await import("@/lib/ta-context")
  const selectedSem = await getSelectedSemester()
  const activeTA = selectedSem?.tahunAjaran

  // Cari kelas santri
  const riwayatKelas = await prisma.riwayatKelas.findFirst({
    where: {
      santriId: session.id,
      kelasFormal: { tahunAjaranId: activeTA?.id }
    },
    include: { kelasFormal: true }
  })

  const kelasFormalId = riwayatKelas?.kelasFormalId

  // Ambil jadwal berdasarkan kelas
  let jadwal: any[] = []
  if (kelasFormalId && selectedSem) {
    jadwal = await prisma.jadwalPelajaran.findMany({
      where: {
        semesterId: selectedSem.id,
        pengampu: { kelasFormalId }
      },
      include: {
        pengampu: {
          include: {
            mataPelajaran: true,
            guru: true,
          }
        },
        semester: true,
      },
      orderBy: [{ hari: "asc" }, { jamMulai: "asc" }]
    })
  }

  // Kelompokkan per hari
  const jadwalPerHari: Record<string, typeof jadwal> = {}
  for (const hari of HARI_ORDER) {
    const items = jadwal.filter(j => j.hari === hari)
    if (items.length > 0) jadwalPerHari[hari] = items
  }
  const hariAktif = Object.keys(jadwalPerHari)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Calendar className="h-6 w-6 text-emerald-600" />
          Jadwal Pelajaran
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          {riwayatKelas?.kelasFormal.namaKelas
            ? <>Kelas <strong>{riwayatKelas.kelasFormal.namaKelas}</strong> · TA <strong>{activeTA?.nama}</strong></>
            : "Tahun Ajaran " + (activeTA?.nama || "-")
          }
        </p>
      </div>

      {!kelasFormalId && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
          <p className="text-amber-700 font-medium">Kamu belum terdaftar di kelas manapun</p>
          <p className="text-amber-600 text-sm mt-1">Hubungi Admin Jenjang untuk mendaftarkan kamu ke kelas.</p>
        </div>
      )}

      {kelasFormalId && jadwal.length === 0 && (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Belum ada jadwal pelajaran</p>
          <p className="text-slate-400 text-sm mt-1">Jadwal dibuat oleh Admin Jenjang</p>
        </div>
      )}

      {hariAktif.length > 0 && (
        <div className="space-y-5">
          {hariAktif.map(hari => (
            <div key={hari} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className={`px-5 py-3 border-b flex items-center gap-2 ${WARNA_HARI[hari] || "bg-slate-50"}`}>
                <Calendar className="h-4 w-4" />
                <span className="font-bold text-sm uppercase tracking-wide">{HARI_LABEL[hari]}</span>
                <span className="ml-auto text-xs font-medium opacity-70">{jadwalPerHari[hari].length} sesi</span>
              </div>
              <div className="divide-y divide-slate-50">
                {jadwalPerHari[hari].map((j: any) => (
                  <div key={j.id} className="flex items-center gap-5 px-5 py-4 hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-center gap-2 min-w-[115px] shrink-0 text-slate-500">
                      <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="font-mono text-sm font-semibold">{j.jamMulai} – {j.jamSelesai}</span>
                    </div>
                    <div className="h-8 w-px bg-slate-200 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 truncate">{j.pengampu.mataPelajaran.nama}</div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {j.pengampu.guru.nama}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {jadwal.length > 0 && (
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
            <div className="text-3xl font-extrabold text-emerald-700">{jadwal.length}</div>
            <div className="text-xs text-emerald-500 font-semibold mt-1 uppercase tracking-wide">Total Sesi / Minggu</div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
            <div className="text-3xl font-extrabold text-blue-700">{hariAktif.length}</div>
            <div className="text-xs text-blue-500 font-semibold mt-1 uppercase tracking-wide">Hari Sekolah</div>
          </div>
        </div>
      )}
    </div>
  )
}
