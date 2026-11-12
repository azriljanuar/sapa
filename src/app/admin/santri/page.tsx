import { getLoggedInAdminJenjang } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getSelectedTahunAjaran } from "@/lib/ta-context"
import { SantriClient } from "./santri-client"

export const dynamic = "force-dynamic"

export default async function DataSantriPage() {
  const admin = await getLoggedInAdminJenjang()

  if (!admin.jenjangId) {
    return (
      <div className="p-6 text-center text-destructive">
        Admin Jenjang ini belum memiliki jenjang yang dikelola.
      </div>
    )
  }

  const activeTA = await getSelectedTahunAjaran()

  // Ambil kelas formal di jenjang ini
  const rawKelas = await prisma.kelasFormal.findMany({
    where: {
      jenjangId: admin.jenjangId,
      ...(activeTA ? { tahunAjaranId: activeTA.id } : {})
    },
    orderBy: { namaKelas: "asc" },
    select: { id: true, namaKelas: true }
  })

  // Fallback jika TA aktif belum punya kelas, ambil seluruh kelas jenjang
  const kelasList = rawKelas.length > 0
    ? rawKelas
    : await prisma.kelasFormal.findMany({
        where: { jenjangId: admin.jenjangId },
        orderBy: { namaKelas: "asc" },
        select: { id: true, namaKelas: true }
      })

  // Buat daftar nama kelas unik untuk dropdown filter
  const uniqueKelasMap = new Map<string, { id: number; namaKelas: string }>()
  for (const k of kelasList) {
    if (!uniqueKelasMap.has(k.namaKelas)) {
      uniqueKelasMap.set(k.namaKelas, k)
    }
  }
  const uniqueKelasList = Array.from(uniqueKelasMap.values())

  // Ambil santri yang aktif di jenjang ini (bukan alumni) beserta riwayat kelas
  const santris = await prisma.santri.findMany({
    where: {
      jenjangs: {
        some: {
          jenjangId: admin.jenjangId,
          isAlumni: false
        }
      }
    },
    include: {
      jenjangs: {
        where: { jenjangId: admin.jenjangId }
      },
      riwayatKelas: {
        where: {
          kelasFormal: { jenjangId: admin.jenjangId }
        },
        include: {
          kelasFormal: {
            select: { id: true, namaKelas: true, tahunAjaranId: true }
          }
        },
        orderBy: { id: "desc" }
      }
    },
    orderBy: {
      namaLengkap: "asc",
    },
  })

  // Ambil santri yang sudah menjadi alumni di jenjang ini
  const alumniRaw = await prisma.santri.findMany({
    where: {
      jenjangs: {
        some: {
          jenjangId: admin.jenjangId,
          isAlumni: true,
        }
      }
    },
    include: {
      jenjangs: {
        where: { jenjangId: admin.jenjangId },
        include: { tahunLulus: true }
      }
    },
    orderBy: {
      namaLengkap: "asc",
    },
  })

  const tahunAjarans = await prisma.tahunAjaran.findMany({ orderBy: { nama: 'desc' } })

  const mappedSantris = santris.map(s => {
    // Cari kelas di TA aktif jika ada, atau kelas terbaru
    const activeRiwayat = (activeTA && s.riwayatKelas.find(r => r.kelasFormal.tahunAjaranId === activeTA.id))
      || s.riwayatKelas[0]

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

  const mappedAlumni = alumniRaw.map(a => ({
    ...a,
    tanggalPindah: a.tanggalPindah ? a.tanggalPindah.toISOString() : (a.jenjangs[0]?.tanggalPindah ? a.jenjangs[0].tanggalPindah.toISOString() : null),
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
