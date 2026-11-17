import { Metadata } from "next"
import { getLoggedInKesiswaan } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getSelectedTahunAjaran } from "@/lib/ta-context"
import { KelasClient } from "@/app/admin/kelas-formal/kelas-client"

export const metadata: Metadata = {
  title: "Kenaikan Kelas & Kelulusan - Kesiswaan | SAPA",
  description: "Kelola rombel santri, proses kenaikan kelas, dan kelulusan",
}

export const dynamic = "force-dynamic"

export default async function KesiswaanKelasFormalPage() {
  const kesiswaan = await getLoggedInKesiswaan()

  const activeTahunAjaran = await getSelectedTahunAjaran()

  const kelasFormal = activeTahunAjaran
    ? await prisma.kelasFormal.findMany({
        where: {
          jenjangId: kesiswaan.jenjangId,
          tahunAjaranId: activeTahunAjaran.id,
        },
        include: {
          waliKelas: {
            select: { id: true, nama: true },
          },
          _count: {
            select: {
              anggota: {
                where: {
                  santri: {
                    jenjangs: {
                      some: {
                        jenjangId: kesiswaan.jenjangId,
                        statusKeluar: null,
                        isAlumni: false,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { namaKelas: "asc" },
      })
    : []

  const guruList = await prisma.guru.findMany({
    where: { jenjangs: { some: { id: kesiswaan.jenjangId } } },
    select: { id: true, nama: true },
    orderBy: { nama: "asc" },
  })

  return <KelasClient initialData={kelasFormal} guruList={guruList} />
}
