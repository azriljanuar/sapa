import { Metadata } from "next"
import { getLoggedInKesiswaan } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getSelectedTahunAjaran } from "@/lib/ta-context"
import { SantriClient } from "@/app/admin/santri/santri-client"

export const metadata: Metadata = {
  title: "Data Santri - Kesiswaan | SAPA",
  description: "Manajemen data santri aktif, biodata, dan mutasi santri",
}

export const dynamic = "force-dynamic"

export default async function KesiswaanSantriPage() {
  const kesiswaan = await getLoggedInKesiswaan()

  const activeTA = await getSelectedTahunAjaran()

  const rawKelas = await prisma.kelasFormal.findMany({
    where: {
      jenjangId: kesiswaan.jenjangId,
      ...(activeTA ? { tahunAjaranId: activeTA.id } : {}),
    },
    orderBy: { namaKelas: "asc" },
    select: { id: true, namaKelas: true },
  })

  const kelasList =
    rawKelas.length > 0
      ? rawKelas
      : await prisma.kelasFormal.findMany({
          where: { jenjangId: kesiswaan.jenjangId },
          orderBy: { namaKelas: "asc" },
          select: { id: true, namaKelas: true },
        })

  const uniqueKelasMap = new Map<string, { id: number; namaKelas: string }>()
  for (const k of kelasList) {
    if (!uniqueKelasMap.has(k.namaKelas)) {
      uniqueKelasMap.set(k.namaKelas, k)
    }
  }
  const uniqueKelasList = Array.from(uniqueKelasMap.values())

  const santris = await prisma.santri.findMany({
    where: {
      jenjangs: {
        some: {
          jenjangId: kesiswaan.jenjangId,
          isAlumni: false,
        },
      },
    },
    include: {
      jenjangs: {
        where: { jenjangId: kesiswaan.jenjangId },
      },
      riwayatKelas: {
        where: {
          kelasFormal: { jenjangId: kesiswaan.jenjangId },
        },
        include: {
          kelasFormal: {
            select: { id: true, namaKelas: true, tahunAjaranId: true },
          },
        },
        orderBy: { id: "desc" },
      },
    },
    orderBy: {
      namaLengkap: "asc",
    },
  })

  const alumniRaw = await prisma.santri.findMany({
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
        include: { tahunLulus: true },
      },
    },
    orderBy: {
      namaLengkap: "asc",
    },
  })

  const tahunAjarans = await prisma.tahunAjaran.findMany({ orderBy: { nama: "desc" } })

  const mappedSantris = santris.map((s) => {
    const activeRiwayat =
      (activeTA && s.riwayatKelas.find((r) => r.kelasFormal.tahunAjaranId === activeTA.id)) ||
      s.riwayatKelas[0]

    return {
      ...s,
      kelasId: activeRiwayat?.kelasFormal?.id || null,
      namaKelas: activeRiwayat?.kelasFormal?.namaKelas || null,
      statusMukim: s.jenjangs[0]?.statusMukim || false,
      tahunMasukId: s.jenjangs[0]?.tahunMasukId || null,
      statusKeluar: s.jenjangs[0]?.statusKeluar || null,
      namaSekolahTujuan: s.jenjangs[0]?.namaSekolahTujuan || null,
      tanggalPindah: s.jenjangs[0]?.tanggalPindah ? s.jenjangs[0].tanggalPindah.toISOString() : null,
      alasanPindah: s.jenjangs[0]?.alasanPindah || null,
    }
  })

  const mappedAlumni = alumniRaw.map((a) => ({
    ...a,
    tanggalPindah: a.tanggalPindah
      ? a.tanggalPindah.toISOString()
      : a.jenjangs[0]?.tanggalPindah
      ? a.jenjangs[0].tanggalPindah.toISOString()
      : null,
    statusMukim: a.statusMukim || a.jenjangs[0]?.statusMukim || false,
    riwayatKesehatan: a.riwayatKesehatan || null,
    tahunLulusId: a.tahunLulusId || a.jenjangs[0]?.tahunLulusId || null,
    tahunLulusNama: a.jenjangs[0]?.tahunLulus?.nama || null,
    statusLanjutan: a.statusLanjutan || a.jenjangs[0]?.statusLanjutan || null,
    namaInstansi: a.namaInstansi || a.jenjangs[0]?.namaInstansi || null,
    programStudi: a.programStudi || a.jenjangs[0]?.programStudi || null,
  }))

  return (
    <SantriClient
      initialData={mappedSantris}
      alumniData={mappedAlumni}
      tahunAjarans={tahunAjarans}
      kelasList={uniqueKelasList}
    />
  )
}
