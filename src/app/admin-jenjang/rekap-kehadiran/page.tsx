import { getLoggedInAdminJenjang } from "@/lib/auth"
import prisma from "@/lib/prisma"
import RekapKehadiranClient from "./rekap-client"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function RekapKehadiranPage() {
  const admin = await getLoggedInAdminJenjang()

  // Ambil Tahun Ajaran aktif
  let activeTA = await prisma.tahunAjaran.findFirst({
    where: { isActive: true }
  })
  
  if (!activeTA) {
    activeTA = await prisma.tahunAjaran.findFirst({
      orderBy: { nama: 'desc' }
    })
  }

  if (!activeTA) {
    return <div className="p-8 text-center text-slate-500">Tahun ajaran belum diatur.</div>
  }

  // Ambil daftar kelas untuk jenjang ini di TA aktif
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
      jenjangNama={admin.jenjang?.nama || "Jenjang"}
      tahunAjaran={activeTA.nama}
    />
  )
}
