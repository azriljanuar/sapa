import { getLoggedInAdminJenjang } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { GuruClient } from "./guru-client"

export default async function DataGuruPage() {
  const admin = await getLoggedInAdminJenjang()

  if (!admin.jenjangId) {
    return (
      <div className="p-6 text-center text-destructive">
        Admin Jenjang ini belum memiliki jenjang yang dikelola.
      </div>
    )
  }

  const gurus = await prisma.guru.findMany({
    where: {
      jenjangs: { some: { id: admin.jenjangId } }
    },
    orderBy: {
      nama: "asc",
    },
  })

  return <GuruClient initialData={gurus} />
}
