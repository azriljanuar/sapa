import { getLoggedInAdminJenjang } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { MataPelajaranClient } from "./mata-pelajaran-client"

export default async function MataPelajaranPage() {
  const admin = await getLoggedInAdminJenjang()

  const mataPelajaran = await prisma.mataPelajaran.findMany({
    where: {
      jenjangId: admin.jenjangId
    },
    orderBy: {
      nama: 'asc'
    }
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Manajemen Mata Pelajaran</h1>
        <p className="text-slate-500">Kelola data mata pelajaran khusus untuk jenjang ini.</p>
      </div>
      
      <MataPelajaranClient initialData={mataPelajaran} />
    </div>
  )
}
