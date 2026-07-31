import { ScanClient } from "./scan-client"
import prisma from "@/lib/prisma"

export const metadata = {
  title: "Scan Absensi | SAPA",
  description: "Absensi otomatis dengan QR Code",
}

export default async function ScanAbsensiPage() {
  const { getSelectedTahunAjaran } = await import("@/lib/ta-context")
  const activeTA = await getSelectedTahunAjaran()


  const jenjangs = await prisma.jenjangPendidikan.findMany({
    include: {
      kelas: {
        where: activeTA ? { tahunAjaranId: activeTA.id } : undefined,
        orderBy: { namaKelas: 'asc' }
      }
    },
    orderBy: { nama: 'asc' }
  })

  const safeJenjangs = jenjangs.map(j => ({
    id: j.id,
    nama: j.nama,
    singkatan: j.singkatan,
    kelasFormal: j.kelas.map(k => ({
      id: k.id,
      nama: k.namaKelas
    }))
  }))

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <ScanClient jenjangs={safeJenjangs} />
    </div>
  )
}
