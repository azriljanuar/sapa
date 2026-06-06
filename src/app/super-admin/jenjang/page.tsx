import { prisma } from "@/lib/prisma"

import JenjangClient from "./jenjang-client"

export const dynamic = "force-dynamic"

export default async function JenjangPage() {
  const jenjang = await prisma.jenjangPendidikan.findMany({
    orderBy: [{ nama: "asc" }],
  })

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-xl font-semibold">Manajemen Jenjang Pendidikan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola jenjang (MI, MTs, MA, dll).
        </p>
      </div>

      <JenjangClient jenjang={jenjang} />
    </div>
  )
}
