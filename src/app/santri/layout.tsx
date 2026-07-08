import { type ReactNode } from "react"
import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { SantriLayoutClient } from "./santri-layout-client"

export default async function SantriLayout({ children }: { children: ReactNode }) {
  const session = await getSession()
  
  if (!session || session.role !== "SANTRI") {
    redirect("/login-santri")
  }

  const santri = await prisma.santri.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      namaLengkap: true,
    }
  })

  if (!santri) {
    redirect("/login-santri")
  }

  return (
    <SantriLayoutClient santri={santri}>
      {children}
    </SantriLayoutClient>
  )
}
