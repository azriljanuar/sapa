import { type ReactNode } from "react"
import prisma from "@/lib/prisma"
import { getLoggedInAdminJenjang } from "@/lib/auth"
import { AdminJenjangLayoutClient } from "./admin-jenjang-layout-client"

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const admin = await getLoggedInAdminJenjang()
  if (admin && admin.jenjangId) {
    const jenjang = await prisma.jenjangPendidikan.findUnique({
      where: { id: admin.jenjangId }
    })
    if (jenjang?.iconUrl) {
      return {
        icons: {
          icon: jenjang.iconUrl
        }
      }
    }
  }
  return {}
}

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
