import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AlumniClient } from "./alumni-client"

export default async function PortalAlumniSantriPage() {
  const session = await getSession()
  if (!session || session.role !== "SANTRI") redirect("/login")

  const santri = await prisma.santri.findUnique({
    where: { id: session.id },
    include: {
      jenjangs: {
        where: { isAlumni: true },
        include: { jenjang: true },
        orderBy: { jenjangId: "desc" }
      }
    }
  })

  if (!santri || santri.jenjangs.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-slate-800">Bukan Alumni</h2>
        <p className="text-slate-500 mt-2">Anda belum terdata sebagai alumni di jenjang mana pun.</p>
      </div>
    )
  }

  return <AlumniClient santri={santri} alumniJenjangs={santri.jenjangs as any[]} />
}
