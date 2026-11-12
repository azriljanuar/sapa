import { getLoggedInGuru } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getSelectedSemester } from "@/lib/ta-context"
import { redirect } from "next/navigation"
import Link from "next/link"
import { BarChart2, BookOpen, ChevronRight, Users, AlertCircle } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function GuruPenilaianPage() {
  const guru = await getLoggedInGuru()
  const selectedSem = await getSelectedSemester()
  const semesterId = selectedSem?.id ?? null

  // Ambil daftar mapel yang diampu guru ini, filter semester aktif
  const pengampuList = await prisma.pengampuMataPelajaran.findMany({
    where: {
      guruId: guru.id,
      ...(selectedSem ? { tahunAjaranId: selectedSem.tahunAjaran.id } : {}),
    },
    include: {
      mataPelajaran: true,
      kelasFormal: {
        include: {
          anggota: { select: { id: true } }
        }
      },
      tahunAjaran: true,
      nilaiSumatif: {
        where: semesterId ? { semesterId } : {}
      },
      nilaiPAS: {
        where: semesterId ? { semesterId } : {}
      },
    },
    orderBy: [
      { kelasFormal: { namaKelas: "asc" } },
      { mataPelajaran: { nama: "asc" } }
    ]
  })

  // Kelompokkan per kelas
  const byKelas: Record<string, typeof pengampuList> = {}
  for (const p of pengampuList) {
    const k = p.kelasFormal.namaKelas
    if (!byKelas[k]) byKelas[k] = []
    byKelas[k].push(p)
  }

  const semesterNama = selectedSem
    ? `${selectedSem.tahunAjaran.nama} — ${selectedSem.nama}`
    : null

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-primary" />
            Penilaian Santri
          </h1>
          {semesterNama && (
            <p className="text-xs text-muted-foreground mt-1">
              Semester aktif:{" "}
              <span className="font-semibold text-foreground">{semesterNama}</span>
            </p>
          )}
        </div>
        <span className="text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-full border border-border font-medium">
          {pengampuList.length} mata pelajaran
        </span>
      </div>

      {/* Empty state */}
      {pengampuList.length === 0 && (
        <div className="bg-card rounded-2xl border border-border p-12 text-center shadow-xs">
          <AlertCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="font-semibold text-foreground">Belum ada mata pelajaran yang diampu</p>
          <p className="text-sm text-muted-foreground mt-1">
            Hubungi admin jenjang untuk menambahkan penugasan mengajar Anda.
          </p>
        </div>
      )}

      {/* Daftar per kelas */}
      {Object.entries(byKelas).map(([namaKelas, list]) => (
        <div key={namaKelas} className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
          {/* Kelas header */}
          <div className="px-5 py-3 bg-muted/50 border-b border-border flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="font-bold text-foreground text-sm">{namaKelas}</h2>
            <span className="ml-auto text-xs text-muted-foreground">
              {list[0]?.kelasFormal.anggota.length ?? 0} santri
            </span>
          </div>

          {/* Daftar mapel */}
          <div className="divide-y divide-border">
            {list.map((p) => {
              const jumlahSantri = p.kelasFormal.anggota.length
              const sudahNilaiSumatif = new Set(p.nilaiSumatif.map((n) => n.santriId)).size
              const sudahNilaiPAS = p.nilaiPAS.length
              const persen = jumlahSantri > 0
                ? Math.round((sudahNilaiPAS / jumlahSantri) * 100)
                : 0

              return (
                <Link
                  key={p.id}
                  href={`/guru/penilaian/${p.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-muted/40 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground text-sm truncate">
                      {p.mataPelajaran.nama}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">
                        KKM: <strong className="text-foreground">{p.kkm ?? 70}</strong>
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        PAS:{" "}
                        <strong className={sudahNilaiPAS === jumlahSantri && jumlahSantri > 0 ? "text-primary" : "text-foreground"}>
                          {sudahNilaiPAS}/{jumlahSantri}
                        </strong>
                      </span>
                    </div>

                    {/* Progress bar PAS */}
                    {jumlahSantri > 0 && (
                      <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden w-full max-w-xs">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${persen}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
