import { getLoggedInAdminJenjang } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getSelectedTahunAjaran } from "@/lib/ta-context"
import RekapKehadiranClient from "./rekap-client"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function RekapKehadiranPage() {
  const admin = await getLoggedInAdminJenjang()

  // Ambil Tahun Ajaran terpilih dari context/cookie
  const activeTA = await getSelectedTahunAjaran()

  if (!activeTA) {
    return <div className="p-8 text-center text-slate-500">Tahun ajaran belum diatur.</div>
  }

  // Ambil daftar kelas untuk jenjang ini sesuai TA yang dipilih
  const kelasList = await prisma.kelasFormal.findMany({
    where: {
      jenjangId: admin.jenjangId!,
      tahunAjaranId: activeTA.id
    },
    orderBy: { namaKelas: 'asc' },
    select: { id: true, namaKelas: true }
  })

  return (
    <RekapKehadiranClient 
      kelasList={kelasList} 
      jenjangId={admin.jenjangId!}
      jenjangNama={admin.jenjang?.nama || "Jenjang"}
      tahunAjaran={activeTA.nama}
    />
  )
}
