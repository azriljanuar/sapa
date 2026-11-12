import { getLoggedInAdminJenjang } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { GuruClient } from "./guru-client"

export const dynamic = "force-dynamic"

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
      jenjangs: { some: { id: admin.jenjangId } },
    },
    select: {
      id: true,
      nama: true,
      nip: true,
      nuptk: true,
      nik: true,
      email: true,
      rfidCardId: true,
      jenisKelamin: true,
      noTelepon: true,
      tempatLahir: true,
      tanggalLahir: true,
      pendidikanTerakhir: true,
      jurusan: true,
      statusPegawai: true,
      alamatLengkap: true,
      _count: {
        select: {
          waliKelas: true,
          pengampu: true,
        },
      },
    },
    orderBy: {
      nama: "asc",
    },
  })

  // Format tanggalLahir ke string ISO (YYYY-MM-DD) agar serializeable ke client component
  const serializedGurus = gurus.map((g) => ({
    ...g,
    tanggalLahir: g.tanggalLahir ? g.tanggalLahir.toISOString().split("T")[0] : null,
  }))

  return <GuruClient initialData={serializedGurus} />
}
