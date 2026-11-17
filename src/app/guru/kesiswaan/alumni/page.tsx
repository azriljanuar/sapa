import { Metadata } from "next"
import { getLoggedInKesiswaan } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { AlumniClient } from "@/app/admin/alumni/alumni-client"

export const metadata: Metadata = {
  title: "Data Alumni & SKL - Kesiswaan | SAPA",
  description: "Arsip data alumni, riwayat kelulusan, dan pencetakan SKL",
}

export const dynamic = "force-dynamic"

export default async function KesiswaanAlumniPage() {
  const kesiswaan = await getLoggedInKesiswaan()

  const alumniListRaw = await prisma.santri.findMany({
    where: {
      jenjangs: {
        some: {
          jenjangId: kesiswaan.jenjangId,
          isAlumni: true,
        },
      },
    },
    include: {
      jenjangs: {
        where: { jenjangId: kesiswaan.jenjangId },
        include: {
          tahunLulus: true,
        },
      },
    },
    orderBy: {
      namaLengkap: "asc",
    },
  })

  const alumniList = alumniListRaw.map((a) => ({
    ...a,
    statusMukim: a.jenjangs[0]?.statusMukim || false,
    keteranganLulus: a.jenjangs[0]?.keteranganLulus || null,
    tahunLulusId: a.jenjangs[0]?.tahunLulusId || null,
    tahunLulusNama: a.jenjangs[0]?.tahunLulus?.nama || null,
    statusLanjutan: a.jenjangs[0]?.statusLanjutan || null,
    namaInstansi: a.jenjangs[0]?.namaInstansi || null,
    programStudi: a.jenjangs[0]?.programStudi || null,
    kotaDomisiliSekarang: a.jenjangs[0]?.kotaDomisiliSekarang || null,
    kontakWA: a.jenjangs[0]?.kontakWA || null,
    email: a.jenjangs[0]?.email || null,
  }))

  const semuaJenjang = await prisma.jenjangPendidikan.findMany({
    where: {
      id: { not: kesiswaan.jenjangId },
    },
    orderBy: {
      nama: "asc",
    },
  })

  const tahunAjarans = await prisma.tahunAjaran.findMany({
    orderBy: { nama: "desc" },
  })

  const currentJenjang = await prisma.jenjangPendidikan.findUnique({
    where: { id: kesiswaan.jenjangId },
  })

  const isMA = currentJenjang?.nama.toUpperCase().includes("MA") || false

  return (
    <AlumniClient
      initialData={alumniList}
      jenjangList={semuaJenjang}
      tahunAjarans={tahunAjarans}
      isMA={isMA}
    />
  )
}
