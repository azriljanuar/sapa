import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { MataPelajaranClient } from "./mata-pelajaran-client"

export default async function MataPelajaranPage() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN_JENJANG" || !session.jenjangId) {
    redirect("/login")
  }

  const mataPelajaran = await prisma.mataPelajaran.findMany({
    where: {
      jenjangId: session.jenjangId
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
