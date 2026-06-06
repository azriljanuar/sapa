import { getLoggedInAdminJenjang } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { ProfilJenjangClient } from "./profil-client"

export default async function ProfilJenjangPage() {
  const admin = await getLoggedInAdminJenjang()

  if (!admin.jenjangId) {
    return (
      <div className="p-6 text-center text-destructive">
        Admin Jenjang ini belum memiliki jenjang yang dikelola.
      </div>
    )
  }

  const jenjang = await prisma.jenjangPendidikan.findUnique({
    where: { id: admin.jenjangId }
  })

  if (!jenjang) {
    return (
      <div className="p-6 text-center text-destructive">
        Data jenjang tidak ditemukan.
      </div>
    )
  }

  return <ProfilJenjangClient initialData={jenjang} />
}
