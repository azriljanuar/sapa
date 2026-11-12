import { getLoggedInSantri } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getSelectedSemester } from "@/lib/ta-context"
import SantriNilaiClient from "./santri-nilai-client"

export const dynamic = "force-dynamic"

export default async function SantriNilaiPage() {
  const santri = await getLoggedInSantri()

  // Ambil semester aktif
  const selectedSem = await getSelectedSemester()
  const semesterId = selectedSem?.id || null

  // Cari kelas santri pada tahun ajaran yang dipilih
  let activeKelas: any = null
  if (selectedSem) {
    const riwayat = await prisma.riwayatKelas.findFirst({
      where: {
        santriId: santri.id,
        kelasFormal: { tahunAjaranId: selectedSem.tahunAjaran.id }
      },
      include: { kelasFormal: true },
      orderBy: { id: "desc" }
    })
    if (riwayat?.kelasFormal) {
      activeKelas = riwayat.kelasFormal
    }
  }

  // Fallback: kelas aktif atau riwayat kelas terakhir
  if (!activeKelas) {
    activeKelas = santri.activeKelas || (
      await prisma.riwayatKelas.findFirst({
        where: { santriId: santri.id },
        include: { kelasFormal: true },
        orderBy: { id: "desc" }
      })
    )?.kelasFormal
  }

  if (!activeKelas) {
    return (
      <div className="bg-card rounded-xl border border-border p-12 text-center">
        <h2 className="text-lg font-semibold text-foreground">Data Kelas Tidak Ditemukan</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Anda belum terdaftar dalam kelas formal pada semester ini.
        </p>
      </div>
    )
  }

  // Data semester (termasuk nilaiDirilis global)
  const semesterData = semesterId
    ? await prisma.semester.findUnique({
        where: { id: semesterId },
        include: { tahunAjaran: true }
      })
    : null

  // Ambil semua mapel di kelas santri
  const pengampuList = await prisma.pengampuMataPelajaran.findMany({
    where: {
      kelasFormalId: activeKelas.id,
      ...(semesterData ? { tahunAjaranId: semesterData.tahunAjaranId } : {})
    },
    include: {
      mataPelajaran: true,
      guru: { select: { nama: true } },
      nilaiSumatif: {
        where: semesterId ? { santriId: santri.id, semesterId } : { santriId: santri.id }
      },
      nilaiPAS: {
        where: semesterId ? { santriId: santri.id, semesterId } : { santriId: santri.id }
      },
      jurnalMengajar: {
        include: {
          absensiMapel: {
            where: { santriId: santri.id }
          }
        }
      }
    },
    orderBy: { mataPelajaran: { nama: "asc" } }
  })

  // Format data penilaian santri dengan pengecekan visibilitas
  const listNilai = pengampuList.map(p => {
    const isGlobalReleased = !!semesterData?.nilaiDirilis
    const isMapelReleased = !!p.nilaiDirilis
    const isVisible = isGlobalReleased || isMapelReleased

    return {
      pengampuId: p.id,
      mataPelajaran: p.mataPelajaran.nama,
      kodeMapel: p.mataPelajaran.kode,
      namaGuru: p.guru.nama,
      kkm: p.kkm ?? 70,
      isVisible,
      tanggalRilis: p.tanggalRilis ? p.tanggalRilis.toISOString() : null,
      nilaiSumatif: isVisible ? p.nilaiSumatif : [],
      nilaiPAS: isVisible ? (p.nilaiPAS[0]?.nilai ?? null) : null,
      jurnalMengajar: isVisible ? p.jurnalMengajar : [],
    }
  })

  return (
    <SantriNilaiClient
      santriName={santri.namaLengkap}
      namaKelas={activeKelas.namaKelas}
      semesterNama={semesterData ? `${semesterData.tahunAjaran.nama} — ${semesterData.nama}` : "Semester Aktif"}
      listNilai={listNilai}
    />
  )
}
