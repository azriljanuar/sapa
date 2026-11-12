import { getLoggedInGuruPiket } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getSelectedTahunAjaran } from "@/lib/ta-context"
import { GuruPiketRekapClient } from "./guru-piket-rekap-client"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Rekap Kehadiran - Guru Piket | SAPA",
  description: "Rekapitulasi dan monitoring absensi santri lintas kelas untuk guru piket",
}

export default async function GuruPiketRekapKehadiranPage() {
  const guruPiket = await getLoggedInGuruPiket()
  const activeTA = await getSelectedTahunAjaran()

  if (!activeTA) {
    return (
      <div className="p-6">
        <div className="p-6 bg-red-50 text-red-600 rounded-lg">
          Tahun ajaran aktif belum ditentukan. Silakan hubungi admin sekolah.
        </div>
      </div>
    )
  }

  // Ambil daftar seluruh kelas untuk jenjang ini
  const kelasList = await prisma.kelasFormal.findMany({
    where: {
      jenjangId: guruPiket.jenjangId,
      tahunAjaranId: activeTA.id,
    },
    select: {
      id: true,
      namaKelas: true,
    },
    orderBy: {
      namaKelas: "asc",
    },
  })

  return (
    <GuruPiketRekapClient
      kelasList={kelasList}
      jenjangId={guruPiket.jenjangId}
      guruName={guruPiket.nama}
      activeTaName={activeTA.nama}
    />
  )
}
