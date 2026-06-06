import { cookies } from "next/headers"
import prisma from "@/lib/prisma"

/**
 * Mendapatkan Tahun Ajaran yang sedang dilihat oleh user (dari cookie)
 * atau fallback ke Tahun Ajaran yang berstatus aktif di database.
 */
export async function getSelectedTahunAjaran() {
  const cookieStore = await cookies()
  const cookieTaId = cookieStore.get("selected_ta_id")?.value

  if (cookieTaId) {
    const ta = await prisma.tahunAjaran.findUnique({
      where: { id: Number(cookieTaId) },
      include: { semester: true }
    })
    if (ta) return ta
  }

  // Fallback to active TA
  const activeTa = await prisma.tahunAjaran.findFirst({
    where: { isActive: true },
    include: { semester: true }
  })
  
  return activeTa
}
