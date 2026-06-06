import { prisma } from "@/lib/prisma"

import PenggunaClient from "./pengguna-client"

export const dynamic = "force-dynamic"

export default async function PenggunaPage() {
  const [users, jenjang] = await Promise.all([
    prisma.user.findMany({
      where: { role: "ADMIN_JENJANG" },
      include: { jenjang: true },
      orderBy: [{ id: "desc" }],
    }),
    prisma.jenjangPendidikan.findMany({
      orderBy: [{ nama: "asc" }],
      select: { id: true, nama: true, singkatan: true },
    }),
  ])

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-xl font-semibold">Manajemen Pengguna</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Buat akun ADMIN_JENJANG dan relasikan dengan jenjang yang dikelola.
        </p>
      </div>

      <PenggunaClient users={users} jenjang={jenjang} />
    </div>
  )
}
