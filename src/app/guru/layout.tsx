import { type ReactNode } from "react"
import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { GuruLayoutClient } from "./guru-layout-client"

import { getSelectedTahunAjaran } from "@/lib/ta-context"

export const dynamic = 'force-dynamic'

export default async function GuruLayout({ children }: { children: ReactNode }) {
  const session = await getSession()
  
  if (!session || session.role !== "GURU") {
    redirect("/login")
  }

  const guru = await prisma.guru.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      nama: true,
    }
  })

  if (!guru) {
    redirect("/login")
  }

  const tahunAjarans = await prisma.tahunAjaran.findMany({ 
    include: { semester: true },
    orderBy: { nama: 'desc' } 
  })
  const { getSelectedSemester } = await import("@/lib/ta-context")
  const selectedSem = await getSelectedSemester()

  return (
    <GuruLayoutClient guru={guru} tahunAjarans={tahunAjarans as any} activeSemesterId={selectedSem?.id || null}>
      {children}
    </GuruLayoutClient>
  )
}
