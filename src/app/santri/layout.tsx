import { type ReactNode } from "react"
import { getLoggedInSantri } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getSelectedSemester } from "@/lib/ta-context"
import { SantriLayoutClient } from "./santri-layout-client"

export const dynamic = 'force-dynamic'

export const metadata = {
  title: "Portal Santri - SAPA",
  description: "Portal Santri dan Siswa Sistem Administrasi Pesantren & Akademik",
}

export default async function SantriLayout({ children }: { children: ReactNode }) {
  const santri = await getLoggedInSantri()

  const allTa = await prisma.tahunAjaran.findMany({
    include: { semester: true },
    orderBy: { nama: 'desc' }
  })

  const selectedSem = await getSelectedSemester()

  return (
    <SantriLayoutClient 
      santri={santri}
      allTa={allTa as any}
      activeSemesterId={selectedSem?.id || null}
    >
      {children}
    </SantriLayoutClient>
  )
}
