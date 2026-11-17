import { Metadata } from "next"
import { getLoggedInKurikulum } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getSelectedTahunAjaran } from "@/lib/ta-context"
import { KelasClient } from "@/app/admin/kelas-formal/kelas-client"

export const metadata: Metadata = {
  title: "Kelas Formal & Wali Kelas - Kurikulum | SAPA",
  description: "Manajemen rombel kelas formal dan penetapan wali kelas",
}

export const dynamic = "force-dynamic"

export default async function KurikulumKelasFormalPage() {
  const kurikulum = await getLoggedInKurikulum()

  const activeTahunAjaran = await getSelectedTahunAjaran()

  const kelasFormal = activeTahunAjaran
    ? await prisma.kelasFormal.findMany({
        where: {
          jenjangId: kurikulum.jenjangId,
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
                        jenjangId: kurikulum.jenjangId,
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
    where: { jenjangs: { some: { id: kurikulum.jenjangId } } },
    select: { id: true, nama: true },
    orderBy: { nama: "asc" },
  })

  return <KelasClient initialData={kelasFormal} guruList={guruList} />
}
