import { type ReactNode } from "react"
import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { GuruLayoutClient } from "./guru-layout-client"

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

  return (
    <GuruLayoutClient guru={guru}>
      {children}
    </GuruLayoutClient>
  )
}
