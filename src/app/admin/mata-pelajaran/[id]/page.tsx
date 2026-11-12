import { redirect } from "next/navigation"
import { getLoggedInAdminJenjang } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { PengampuClient } from "./pengampu-client"

export default async function PengampuMapelPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const admin = await getLoggedInAdminJenjang()

  const { id } = await params
  const mapelId = parseInt(id)

  const mapel = await prisma.mataPelajaran.findFirst({
    where: { id: mapelId, jenjangId: admin.jenjangId }
  })

  if (!mapel) {
    redirect("/admin/mata-pelajaran")
  }

  // Cari Tahun Ajaran aktif
  const { getSelectedTahunAjaran } = await import("@/lib/ta-context")
  const activeTa = await getSelectedTahunAjaran()

  if (!activeTa) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-lg">
        Belum ada Tahun Ajaran. Silakan hubungi Super Admin.
      </div>
    )
  }

  // Get data pengampu untuk mapel ini dan tahun ajaran ini
  const pengampu = await prisma.pengampuMataPelajaran.findMany({
    where: {
      mataPelajaranId: mapelId,
      tahunAjaranId: activeTa.id
    },
    include: {
      kelasFormal: true,
      guru: true
    },
    orderBy: {
      kelasFormal: {
        namaKelas: 'asc'
      }
    }
  })

  // Get available classes for this jenjang & ta
  const availableClasses = await prisma.kelasFormal.findMany({
    where: {
      jenjangId: admin.jenjangId,
      tahunAjaranId: activeTa.id
    },
    orderBy: {
      namaKelas: 'asc'
    }
  })

  // Get available gurus for this jenjang
  const availableGurus = await prisma.guru.findMany({
    where: {
      jenjangs: {
        some: {
          id: admin.jenjangId
        }
      }
    },
    orderBy: {
      nama: 'asc'
    }
  })

  return (
    <PengampuClient
      mapelId={mapelId}
      mapelNama={mapel.nama}
      tahunAjaranId={activeTa.id}
      initialData={pengampu}
      availableClasses={availableClasses}
      availableGurus={availableGurus}
    />
  )
}
