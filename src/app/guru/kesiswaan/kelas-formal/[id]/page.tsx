import { notFound } from "next/navigation"
import { getLoggedInKesiswaan } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { KelasDetailClient } from "@/app/admin/kelas-formal/[id]/kelas-detail-client"

export const dynamic = "force-dynamic"

export default async function KesiswaanKelasDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const kesiswaan = await getLoggedInKesiswaan()

  const { id } = await params
  const kelasId = parseInt(id)

  if (isNaN(kelasId)) {
    notFound()
  }

  const kelas = await prisma.kelasFormal.findUnique({
    where: {
      id: kelasId,
      jenjangId: kesiswaan.jenjangId,
    },
    include: {
      waliKelas: {
        select: { id: true, nama: true },
      },
    },
  })

  if (!kelas) {
    notFound()
  }

  const { getSelectedSemester } = await import("@/lib/ta-context")
  const activeSem = await getSelectedSemester()
  const activeTa = activeSem?.tahunAjaran
  const isCurrentTa = activeTa ? kelas.tahunAjaranId === activeTa.id : true

  const riwayatAnggota = await prisma.riwayatKelas.findMany({
    where: {
      kelasFormalId: kelasId,
      ...(isCurrentTa
        ? {
            santri: {
              status: "AKTIF",
              jenjangs: {
                some: {
                  jenjangId: kesiswaan.jenjangId,
                  statusKeluar: null,
                  isAlumni: false,
                },
              },
            },
          }
        : {
            santri: {
              jenjangs: {
                some: {
                  jenjangId: kesiswaan.jenjangId,
                },
              },
            },
          }),
    },
    include: {
      santri: {
        select: {
          id: true,
          nisn: true,
          namaLengkap: true,
          jenjangs: {
            where: { jenjangId: kesiswaan.jenjangId },
            select: { statusMukim: true },
          },
        },
      },
    },
  })

  const anggota = riwayatAnggota
    .map((r) => ({
      id: r.santri.id,
      nisn: r.santri.nisn,
      namaLengkap: r.santri.namaLengkap,
      statusMukim: r.santri.jenjangs[0]?.statusMukim || false,
    }))
    .sort((a, b) => a.namaLengkap.localeCompare(b.namaLengkap))

  const availableSantriRaw = await prisma.santri.findMany({
    where: {
      jenjangs: {
        some: {
          jenjangId: kesiswaan.jenjangId,
          isAlumni: false,
          statusKeluar: null,
        },
      },
      riwayatKelas: {
        none: {
          kelasFormal: {
            tahunAjaranId: kelas.tahunAjaranId,
          },
        },
      },
    },
    select: {
      id: true,
      nisn: true,
      namaLengkap: true,
      jenjangs: {
        where: { jenjangId: kesiswaan.jenjangId },
        select: { statusMukim: true },
      },
    },
    orderBy: {
      namaLengkap: "asc",
    },
  })

  const availableSantri = availableSantriRaw.map((s) => ({
    id: s.id,
    nisn: s.nisn,
    namaLengkap: s.namaLengkap,
    statusMukim: s.jenjangs[0]?.statusMukim || false,
  }))

  let canPromote = false
  let canGraduate = false
  let nextTaId: number | null = null
  let nextTaClasses: { id: number; namaKelas: string }[] = []

  if (activeTa && activeSem && kelas.tahunAjaranId === activeTa.id) {
    const isGenap = activeSem.nama === "GENAP"

    if (isGenap) {
      canGraduate = true

      const parts = activeTa.nama.split("/")
      if (parts.length === 2) {
        const nextYear1 = parseInt(parts[0]) + 1
        const nextYear2 = parseInt(parts[1]) + 1
        const nextTaName = `${nextYear1}/${nextYear2}`

        const nextTa = await prisma.tahunAjaran.findUnique({
          where: { nama: nextTaName },
        })

        if (nextTa) {
          canPromote = true
          nextTaId = nextTa.id

          nextTaClasses = await prisma.kelasFormal.findMany({
            where: {
              jenjangId: kesiswaan.jenjangId,
              tahunAjaranId: nextTa.id,
            },
            select: { id: true, namaKelas: true },
            orderBy: { namaKelas: "asc" },
          })
        }
      }
    }
  }

  return (
    <KelasDetailClient
      kelas={kelas}
      anggota={anggota}
      availableSantri={availableSantri}
      canPromote={canPromote}
      canGraduate={canGraduate}
      nextTaId={nextTaId}
      nextTaClasses={nextTaClasses}
    />
  )
}
