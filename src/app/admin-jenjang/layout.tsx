import { type ReactNode } from "react"
import prisma from "@/lib/prisma"
import { getLoggedInAdminJenjang } from "@/lib/auth"
import { AdminJenjangLayoutClient } from "./admin-jenjang-layout-client"

export const dynamic = 'force-dynamic'

export default async function AdminJenjangLayout({ children }: { children: ReactNode }) {
  const admin = await getLoggedInAdminJenjang()
  
  const allTa = await prisma.tahunAjaran.findMany({
    include: { semester: true },
    orderBy: { nama: 'desc' }
  })
  
  const { getSelectedSemester } = await import("@/lib/ta-context")
  const selectedSem = await getSelectedSemester()

  return (
    <AdminJenjangLayoutClient 
      admin={admin} 
      allTa={allTa as any} 
      activeSemesterId={selectedSem?.id || null}
    >
      {children}
    </AdminJenjangLayoutClient>
  )
}
