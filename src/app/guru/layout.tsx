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

  const tahunAjarans = await prisma.tahunAjaran.findMany({ orderBy: { nama: 'desc' } })
  const selectedTa = await getSelectedTahunAjaran()

  return (
    <GuruLayoutClient guru={guru} tahunAjarans={tahunAjarans} activeTaId={selectedTa?.id || null}>
      {children}
    </GuruLayoutClient>
  )
}
