import { getLoggedInAdminJenjang } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { SarprasJenjangClient } from "./sarpras-client"

export default async function SarprasJenjangPage() {
  const admin = await getLoggedInAdminJenjang()

  if (!admin.jenjangId) {
    return (
      <div className="p-6 text-center text-destructive">
        Admin Jenjang ini belum memiliki jenjang yang dikelola.
      </div>
    )
  }

  const jenjang = await prisma.jenjangPendidikan.findUnique({
    where: { id: admin.jenjangId }
  })

  const data = await prisma.sarprasJenjang.findMany({
    where: { jenjangId: admin.jenjangId },
    orderBy: { createdAt: 'desc' }
  })

  return <SarprasJenjangClient initialData={data} jenjangName={jenjang?.nama || ""} />
}
