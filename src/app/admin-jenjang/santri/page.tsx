import { getLoggedInAdminJenjang } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { SantriClient } from "./santri-client"

export default async function DataSantriPage() {
  const admin = await getLoggedInAdminJenjang()

  if (!admin.jenjangId) {
    return (
      <div className="p-6 text-center text-destructive">
        Admin Jenjang ini belum memiliki jenjang yang dikelola.
      </div>
    )
  }

  const santris = await prisma.santri.findMany({
    where: {
      jenjangs: {
        some: {
          jenjangId: admin.jenjangId,
          isAlumni: false
        }
      }
    },
    include: {
      jenjangs: {
        where: { jenjangId: admin.jenjangId }
      }
    },
    orderBy: {
      namaLengkap: "asc",
    },
  })

  const mappedSantris = santris.map(s => ({
    ...s,
    statusMukim: s.jenjangs[0]?.statusMukim || false
  }))

  return <SantriClient initialData={mappedSantris} />
}
