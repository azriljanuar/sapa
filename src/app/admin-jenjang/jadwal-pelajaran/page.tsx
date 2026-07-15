import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { JadwalClient } from "./jadwal-client"
import { getSelectedTahunAjaran } from "@/lib/ta-context"

export default async function JadwalPelajaranPage() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN_JENJANG" || !session.jenjangId) {
    redirect("/login")
  }

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

  // Get active Semester
  const activeSemester = await prisma.semester.findFirst({
    where: { 
      tahunAjaranId: activeTa.id,
      isActive: true
    }
  })

  // Get Kelas Formal
  const kelasFormalList = await prisma.kelasFormal.findMany({
    where: {
      jenjangId: session.jenjangId,
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
        jenjangId: session.jenjangId
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
            jenjangId: session.jenjangId
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
