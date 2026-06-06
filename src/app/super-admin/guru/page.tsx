import { getLoggedInSuperAdmin } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { GuruClient } from "./guru-client"

export default async function DataGuruPage() {
  const admin = await getLoggedInSuperAdmin()

  if (!admin) {
    return (
      <div className="p-6 text-center text-destructive">
        Akses ditolak.
      </div>
    )
  }

  // Ambil semua data guru dan relasi jenjangnya
  const gurus = await prisma.guru.findMany({
    include: {
      jenjangs: true
    },
    orderBy: {
      nama: "asc",
    },
  })

  // Ambil daftar seluruh jenjang untuk opsi filter/checkbox
  const jenjangs = await prisma.jenjangPendidikan.findMany({
    orderBy: { id: "asc" }
  })

  // Mapping data guru
  const formattedGurus = gurus.map(g => ({
    id: g.id,
    nama: g.nama,
    nip: g.nip,
    email: g.email,
    jenisKelamin: g.jenisKelamin,
    jenjangIds: g.jenjangs.map(j => j.id),
    jenjangNames: g.jenjangs.map(j => j.nama).join(", ")
  }))

  return <GuruClient initialData={formattedGurus} jenjangList={jenjangs} />
}
