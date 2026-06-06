import { TahunAjaranClient } from "./tahun-ajaran-client"
import prisma from "@/lib/prisma"

export default async function TahunAjaranPage() {
  const data = await prisma.tahunAjaran.findMany({
    orderBy: { nama: 'desc' },
    include: {
      semester: true
    }
  })

  // Prisma returns enum SemesterNama as string, so we cast it for the client
  const mappedData = data.map(d => ({
    id: d.id,
    nama: d.nama,
    isActive: d.isActive,
    semester: d.semester.map(s => ({
      id: s.id,
      nama: s.nama as "GANJIL" | "GENAP",
      isActive: s.isActive
    }))
  }))

  return <TahunAjaranClient initialData={mappedData} />
}
