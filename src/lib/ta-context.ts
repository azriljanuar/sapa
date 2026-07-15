import { cookies } from "next/headers"
import prisma from "./prisma"

export async function getSelectedSemester() {
  const cookieStore = await cookies()
  const semIdCookie = cookieStore.get("selected_semester_id")?.value

  // Jika user punya preferensi Semester di cookie
  if (semIdCookie) {
    const semId = parseInt(semIdCookie)
    if (!isNaN(semId)) {
      const semester = await prisma.semester.findUnique({
        where: { id: semId },
        include: { tahunAjaran: { include: { semester: true } } }
      })
      if (semester) return semester
    }
  }

  // Fallback: Cari Tahun Ajaran yang aktif, lalu ambil semester aktifnya
  const activeTa = await prisma.tahunAjaran.findFirst({
    where: { isActive: true },
    include: { semester: true },
    orderBy: { nama: 'desc' }
  })

  if (activeTa && activeTa.semester.length > 0) {
    const activeSem = activeTa.semester.find(s => s.isActive) || activeTa.semester[0]
    return {
      ...activeSem,
      tahunAjaran: activeTa
    }
  }

  return null
}

export async function getSelectedTahunAjaran() {
  const semester = await getSelectedSemester()
  if (semester && semester.tahunAjaran) {
    return semester.tahunAjaran
  }
  
  // Fallback jika tidak ada semester sama sekali
  return await prisma.tahunAjaran.findFirst({
    where: { isActive: true },
    include: { semester: true },
    orderBy: { nama: 'desc' }
  })
}
