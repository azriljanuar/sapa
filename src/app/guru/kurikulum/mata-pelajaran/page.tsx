import { Metadata } from "next"
import { getLoggedInKurikulum } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { MataPelajaranClient } from "@/app/admin/mata-pelajaran/mata-pelajaran-client"

export const metadata: Metadata = {
  title: "Mata Pelajaran & Pengampu - Kurikulum | SAPA",
  description: "Kelola data mata pelajaran dan penugasan guru pengampu",
}

export const dynamic = "force-dynamic"

export default async function KurikulumMataPelajaranPage() {
  const kurikulum = await getLoggedInKurikulum()

  const mataPelajaran = await prisma.mataPelajaran.findMany({
    where: {
      jenjangId: kurikulum.jenjangId,
    },
    orderBy: {
      nama: "asc",
    },
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Mata Pelajaran & Pengampu</h1>
        <p className="text-muted-foreground">Kelola kurikulum mata pelajaran dan penugasan guru pengampu di setiap rombel.</p>
      </div>

      <MataPelajaranClient initialData={mataPelajaran} />
    </div>
  )
}
