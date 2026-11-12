import { getLoggedInGuru } from "@/lib/auth"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { WaliRekapClient } from "./wali-rekap-client"
import { ShieldAlert, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export const dynamic = 'force-dynamic'

export const metadata = {
  title: "Rekap Kehadiran Siswa - Wali Kelas",
  description: "Rekapitulasi absensi harian santri untuk wali kelas",
}

export default async function GuruRekapKehadiranPage() {
  const guru = await getLoggedInGuru()

  // Ambil kelas yang diampu sebagai wali kelas
  const waliKelasList = await prisma.kelasFormal.findMany({
    where: { waliKelasId: guru.id },
    include: {
      jenjang: true,
      tahunAjaran: true,
      _count: { select: { anggota: true } }
    },
    orderBy: { namaKelas: 'asc' }
  })

  // Proteksi: Hanya untuk guru yang bertugas sebagai wali kelas
  if (waliKelasList.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="bg-card rounded-2xl p-8 border border-border shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Akses Khusus Wali Kelas</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Halaman ini khusus diperuntukkan bagi guru yang ditugaskan sebagai <strong>Wali Kelas</strong>. 
            Saat ini akun Anda ({guru.nama}) belum memiliki penugasan wali kelas formal yang aktif.
          </p>
          <div className="pt-2">
            <Link href="/guru">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard Guru
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const serializedKelasList = waliKelasList.map(k => ({
    id: k.id,
    namaKelas: k.namaKelas,
    jenjang: k.jenjang?.singkatan || k.jenjang?.nama || "",
    tahunAjaran: k.tahunAjaran?.nama || "",
    totalSantri: k._count.anggota
  }))

  return (
    <div className="space-y-6">
      <WaliRekapClient 
        kelasList={serializedKelasList} 
        guruName={guru.nama} 
      />
    </div>
  )
}
