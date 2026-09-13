import { ReactNode } from "react"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { SantriLayoutClient } from "./santri-layout-client"

export async function generateMetadata() {
  const session = await getSession()
  if (session && session.role === "SANTRI") {
    // Cari jenjang pertama
    const santri = await prisma.santri.findUnique({
      where: { id: session.id },
      include: { jenjangs: true }
    })
    const jenjangId = session.jenjangId || santri?.jenjangs[0]?.jenjangId
    if (jenjangId) {
      const jenjang = await prisma.jenjangPendidikan.findUnique({
        where: { id: jenjangId }
      })
      if (jenjang?.iconUrl) {
        return {
          icons: {
            icon: jenjang.iconUrl
          }
        }
      }
    }
  }
  return {}
}

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
  
  // Ambil jenjang aktif (misal dari session atau jenjangs pertama)
  const jenjangAktifId = session.jenjangId || santri?.jenjangs[0]?.jenjangId
  const jenjang = jenjangAktifId ? await prisma.jenjangPendidikan.findUnique({
    where: { id: jenjangAktifId }
  }) : null

  const enhancedSession = {
    ...session,
    jenjangLogo: jenjang?.logoUrl,
    jenjangSingkatan: jenjang?.singkatan
  }

  return (
    <SantriLayoutClient
      session={enhancedSession}
      santri={santri}
      allTa={allTa as any}
      activeSemesterId={selectedSem?.id || null}
      isAlumni={isAlumni}
    >
      {children}
    </SantriLayoutClient>
  )
}
