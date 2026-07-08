import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { PengampuClient } from "./pengampu-client"

export default async function PengampuMapelPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN_JENJANG" || !session.jenjangId) {
    redirect("/login")
  }

  const { id } = await params
  const mapelId = parseInt(id)

  const mapel = await prisma.mataPelajaran.findFirst({
    where: { id: mapelId, jenjangId: session.jenjangId }
  })

  if (!mapel) {
    redirect("/admin-jenjang/mata-pelajaran")
  }

  // Cari Tahun Ajaran aktif
  const activeTa = await prisma.tahunAjaran.findFirst({
    where: { isActive: true }
  })

  if (!activeTa) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-lg">
        Belum ada Tahun Ajaran yang aktif. Silakan hubungi Super Admin.
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
      jenjangId: session.jenjangId,
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
          id: session.jenjangId
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
