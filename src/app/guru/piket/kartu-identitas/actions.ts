"use server"

import prisma from "@/lib/prisma"
import { getLoggedInGuruPiket } from "@/lib/auth"
import { TipeKartu } from "@prisma/client"

export async function getPiketTemplateAction(tipe: TipeKartu) {
  const guruPiket = await getLoggedInGuruPiket()
  if (!guruPiket || !guruPiket.jenjangId) return null

  return prisma.templateKartu.findUnique({
    where: {
      jenjangId_tipe: {
        jenjangId: guruPiket.jenjangId,
        tipe: tipe,
      },
    },
  })
}

export async function getPiketGuruListAction() {
  const guruPiket = await getLoggedInGuruPiket()
  if (!guruPiket || !guruPiket.jenjangId) return []

  return prisma.guru.findMany({
    where: {
      jenjangs: {
        some: { id: guruPiket.jenjangId },
      },
    },
    select: {
      id: true,
      nama: true,
      nip: true,
      fotoWajah: true,
    },
    orderBy: {
      nama: "asc",
    },
  })
}

export async function getPiketSantriListAction() {
  const guruPiket = await getLoggedInGuruPiket()
  if (!guruPiket || !guruPiket.jenjangId) return []

  const santriList = await prisma.santri.findMany({
    where: {
      jenjangs: {
        some: {
          jenjangId: guruPiket.jenjangId,
          isAlumni: false,
          statusKeluar: null,
        },
      },
    },
    select: {
      id: true,
      namaLengkap: true,
      nisn: true,
      fotoWajah: true,
      riwayatKelas: {
        where: {
          kelasFormal: {
            jenjangId: guruPiket.jenjangId,
            tahunAjaran: { isActive: true },
          },
        },
        select: {
          kelasFormal: {
            select: {
              id: true,
              namaKelas: true,
            },
          },
        },
      },
    },
    orderBy: {
      namaLengkap: "asc",
    },
  })

  return santriList.map((s) => ({
    id: s.id,
    namaLengkap: s.namaLengkap,
    nisn: s.nisn,
    fotoWajah: s.fotoWajah,
    namaKelas: s.riwayatKelas[0]?.kelasFormal.namaKelas || "Tanpa Kelas",
  }))
}
