import { type ReactNode } from "react"
import prisma from "@/lib/prisma"
import { getLoggedInAdmin } from "@/lib/auth"
import { AdminLayoutClient } from "./admin-layout-client"

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const { getIdentitasLembaga } = await import("@/lib/lembaga")
  const lembaga = await getIdentitasLembaga()
  return {
    title: `SAPA - ${lembaga.namaLembaga}`,
    icons: {
      icon: lembaga.iconUrl || lembaga.logoUrl || "/favicon.ico"
    }
  }
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await getLoggedInAdmin()
  
  const allTa = await prisma.tahunAjaran.findMany({
    include: { semester: true },
    orderBy: { nama: 'desc' }
  })
  
  const { getSelectedSemester } = await import("@/lib/ta-context")
  const selectedSem = await getSelectedSemester()

  return (
    <AdminLayoutClient 
      admin={admin} 
      lembaga={admin.lembaga}
      allTa={allTa as any} 
      activeSemesterId={selectedSem?.id || null}
    >
      {children}
    </AdminLayoutClient>
  )
}
