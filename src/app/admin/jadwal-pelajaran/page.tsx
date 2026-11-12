import { redirect } from "next/navigation"
import { getLoggedInAdminJenjang } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { JadwalClient } from "./jadwal-client"
import { getSelectedTahunAjaran } from "@/lib/ta-context"

export default async function JadwalPelajaranPage() {
  const admin = await getLoggedInAdminJenjang()

  // Get selected TA from context
  const activeTa = await getSelectedTahunAjaran()

  if (!activeTa) {
    return (
      <div className="p-6">
        <div className="p-6 bg-red-50 text-red-600 rounded-lg">
          Belum ada Tahun Ajaran. Silakan hubungi Super Admin.
        </div>
      </div>
    )
  }

  const { getSelectedSemester } = await import("@/lib/ta-context")
  const activeSemester = await getSelectedSemester()

  // Get Kelas Formal
  const kelasFormalList = await prisma.kelasFormal.findMany({
    where: {
      jenjangId: admin.jenjangId,
      tahunAjaranId: activeTa.id
    },
    orderBy: {
      namaKelas: 'asc'
    }
  })

  // Get all Pengampu for this Jenjang and TA
  const pengampuList = await prisma.pengampuMataPelajaran.findMany({
    where: {
      tahunAjaranId: activeTa.id,
      mataPelajaran: {
        jenjangId: admin.jenjangId
      }
    },
    include: {
      mataPelajaran: {
        select: { id: true, nama: true }
      },
      guru: {
        select: { id: true, nama: true }
      }
    }
  })

  // Get all Jadwal if we have an active semester
  let initialJadwal: any[] = []
  if (activeSemester) {
    initialJadwal = await prisma.jadwalPelajaran.findMany({
      where: {
        semesterId: activeSemester.id,
        pengampu: {
          mataPelajaran: {
            jenjangId: admin.jenjangId
          }
        }
      },
      include: {
        pengampu: {
          select: {
            kelasFormalId: true,
            guru: { select: { id: true, nama: true } },
            mataPelajaran: { select: { id: true, nama: true } }
          }
        }
      }
    })
  }

  return (
    <div className="p-4 md:p-8">
      <JadwalClient 
        activeTa={activeTa}
        activeSemester={activeSemester}
        kelasFormalList={kelasFormalList}
        pengampuList={pengampuList}
        initialJadwal={initialJadwal}
      />
    </div>
  )
}
