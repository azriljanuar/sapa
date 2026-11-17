import { redirect } from "next/navigation"
import { getLoggedInKurikulum } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { PengampuClient } from "@/app/admin/mata-pelajaran/[id]/pengampu-client"

export const dynamic = "force-dynamic"

export default async function KurikulumPengampuMapelPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const kurikulum = await getLoggedInKurikulum()

  const { id } = await params
  const mapelId = parseInt(id)

  const mapel = await prisma.mataPelajaran.findFirst({
    where: { id: mapelId, jenjangId: kurikulum.jenjangId },
  })

  if (!mapel) {
    redirect("/guru/kurikulum/mata-pelajaran")
  }

  const { getSelectedTahunAjaran } = await import("@/lib/ta-context")
  const activeTa = await getSelectedTahunAjaran()

  if (!activeTa) {
    return (
      <div className="p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-sm font-medium">
        Belum ada Tahun Ajaran. Silakan hubungi Admin Sekolah.
      </div>
    )
  }

  const pengampu = await prisma.pengampuMataPelajaran.findMany({
    where: {
      mataPelajaranId: mapelId,
      tahunAjaranId: activeTa.id,
    },
    include: {
      kelasFormal: true,
      guru: true,
    },
    orderBy: {
      kelasFormal: {
        namaKelas: "asc",
      },
    },
  })

  const availableClasses = await prisma.kelasFormal.findMany({
    where: {
      jenjangId: kurikulum.jenjangId,
      tahunAjaranId: activeTa.id,
    },
    orderBy: {
      namaKelas: "asc",
    },
  })

  const availableGurus = await prisma.guru.findMany({
    where: {
      jenjangs: {
        some: {
          id: kurikulum.jenjangId,
        },
      },
    },
    orderBy: {
      nama: "asc",
    },
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
