import { ReactNode } from "react"
import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { GuruLayoutClient } from "./guru-layout-client"

export default async function ElearningGuruLayout({ children }: { children: ReactNode }) {
  const session = await getSession()
  if (!session || session.role !== "GURU") {
    redirect("/logout")
  }

  const { getSelectedSemester } = await import("@/lib/ta-context")
  const selectedSem = await getSelectedSemester()
  const activeTA = selectedSem?.tahunAjaran || await prisma.tahunAjaran.findFirst({
    where: { isActive: true }
  })

  const allTa = await prisma.tahunAjaran.findMany({
    include: { semester: true },
    orderBy: { nama: 'desc' }
  })

  // Check if this guru is a wali kelas in the active academic year
  const isWaliKelas = activeTA ? await prisma.kelasFormal.findFirst({
    where: { 
      waliKelasId: session.id,
      tahunAjaranId: activeTA.id
    }
  }) !== null : false;

  return (
    <GuruLayoutClient
      session={session}
      allTa={allTa as any}
      activeSemesterId={selectedSem?.id || null}
      isWaliKelas={isWaliKelas}
    >
      {children}
    </GuruLayoutClient>
  )
}
