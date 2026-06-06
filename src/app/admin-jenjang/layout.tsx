import { type ReactNode } from "react"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { getLoggedInAdminJenjang } from "@/lib/auth"
import { AdminJenjangLayoutClient } from "./admin-jenjang-layout-client"

export default async function AdminJenjangLayout({ children }: { children: ReactNode }) {
  const admin = await getLoggedInAdminJenjang()
  
  const allTa = await prisma.tahunAjaran.findMany({
    orderBy: { nama: 'desc' }
  })
  
  const cookieStore = await cookies()
  const cookieTaId = cookieStore.get("selected_ta_id")?.value
  
  let activeTaId = null
  if (cookieTaId) {
    activeTaId = Number(cookieTaId)
  } else {
    const activeTa = allTa.find(ta => ta.isActive)
    if (activeTa) activeTaId = activeTa.id
  }

  return (
    <AdminJenjangLayoutClient 
      admin={admin} 
      allTa={allTa} 
      activeTaId={activeTaId}
    >
      {children}
    </AdminJenjangLayoutClient>
  )
}
