import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { SantriProfilClient } from "./santri-profil-client"
import Image from "next/image"

export default async function SantriDashboard() {
  const session = await getSession()
  
  if (!session || session.role !== "SANTRI") {
    redirect("/login")
  }

  const santri = await prisma.santri.findUnique({
    where: { nisn: session.email }, // session.email is NISN for SANTRI role
    include: {
      jenjangs: { include: { jenjang: true } },
      riwayatKelas: {
        include: {
          kelasFormal: {
            include: { tahunAjaran: true }
          }
        },
        orderBy: { id: 'desc' }
      }
    }
  })

  let templateKartu = null
  if (santri && santri.jenjangs.length > 0) {
    templateKartu = await prisma.templateKartu.findUnique({
      where: {
        jenjangId_tipe: {
          jenjangId: santri.jenjangs[0].jenjangId,
          tipe: "SANTRI"
        }
      }
    })
  }

  if (!santri) {
    redirect("/login")
  }

  return (
    <div className="pb-10">
      <div className="mb-6 mt-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Profil Saya</h1>
        <p className="text-sm font-medium text-slate-500">
          Kelola informasi pribadi dan data akademik Anda.
        </p>
      </div>

      <SantriProfilClient 
        santri={santri}
        santriIds={santri.jenjangs.map((j: any) => j.santriId)}
        templateKartu={templateKartu}
      />
    </div>
  )
}
