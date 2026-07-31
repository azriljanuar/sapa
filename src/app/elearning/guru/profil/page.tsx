import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { GuruProfilClient } from "./guru-profil-client"
import Image from "next/image"

export default async function GuruDashboard() {
  const session = await getSession()
  
  if (!session || session.role !== "GURU") {
    redirect("/login")
  }

  const guru = await prisma.guru.findUnique({
    where: { id: session.id },
    include: {
      jenjangs: true,
      waliKelas: {
        include: {
          tahunAjaran: true,
        }
      }
    }
  })

  let templateKartu = null
  if (guru && guru.jenjangs.length > 0) {
    templateKartu = await prisma.templateKartu.findUnique({
      where: {
        jenjangId_tipe: {
          jenjangId: guru.jenjangs[0].id,
          tipe: "GURU"
        }
      }
    })
  }

  if (!guru) {
    redirect("/login")
  }

  return (
    <div className="pb-10">
      <div className="mb-6 mt-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Profil Saya</h1>
        <p className="text-sm font-medium text-slate-500">
          Kelola informasi pribadi dan data kepegawaian Anda.
        </p>
      </div>
      
      <GuruProfilClient guru={guru} templateKartu={templateKartu} />
    </div>
  )
}
