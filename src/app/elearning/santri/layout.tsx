import { ReactNode } from "react"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { SantriLayoutClient } from "./santri-layout-client"

export default async function ElearningSantriLayout({ children }: { children: ReactNode }) {
  const session = await getSession()
  if (!session || session.role !== "SANTRI") {
    redirect("/login")
  }

  const { getSelectedSemester } = await import("@/lib/ta-context")
  const selectedSem = await getSelectedSemester()
  const allTa = await prisma.tahunAjaran.findMany({
    include: { semester: true },
    orderBy: { nama: 'desc' }
  })

  const santri = await prisma.santri.findUnique({ 
    where: { id: session.id },
    include: { jenjangs: true } 
  })

  const isAlumni = santri?.jenjangs.some(j => j.isAlumni) || false

  return (
    <SantriLayoutClient
      session={session}
      santri={santri}
      allTa={allTa as any}
      activeSemesterId={selectedSem?.id || null}
      isAlumni={isAlumni}
    >
      {children}
    </SantriLayoutClient>
  )
}
