import { cookies } from "next/headers"
import prisma from "./prisma"

export async function getSelectedTahunAjaran() {
  const cookieStore = await cookies()
  const taIdCookie = cookieStore.get("selected_ta_id")?.value

  // Jika user punya preferensi TA di cookie
  if (taIdCookie) {
    const taId = parseInt(taIdCookie)
    if (!isNaN(taId)) {
      const ta = await prisma.tahunAjaran.findUnique({
        where: { id: taId },
        include: { semester: true }
      })
      if (ta) return ta
    }
  }

  // Jika tidak ada di cookie, atau TA di cookie sudah terhapus, gunakan yang aktif secara global
  const activeTa = await prisma.tahunAjaran.findFirst({
    where: { isActive: true },
    include: { semester: true },
    orderBy: { nama: 'desc' }
  })

  return activeTa
}
