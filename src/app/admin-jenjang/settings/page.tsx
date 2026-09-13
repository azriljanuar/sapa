import { getLoggedInAdminJenjang } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { SettingsClient } from "./settings-client"

export default async function SettingsPage() {
  const admin = await getLoggedInAdminJenjang()

  if (!admin.jenjangId) {
    return (
      <div className="p-6 text-center text-destructive">
        Admin Jenjang ini belum memiliki jenjang yang dikelola.
      </div>
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: admin.id }
  })

  const jenjang = await prisma.jenjangPendidikan.findUnique({
    where: { id: admin.jenjangId }
  })

  if (!jenjang || !user) {
    return (
      <div className="p-6 text-center text-destructive">
        Data tidak ditemukan.
      </div>
    )
  }

  return (
    <SettingsClient 
      user={{ id: user.id, nama: user.nama, email: user.email }}
      jenjang={{ 
        id: jenjang.id, 
        nama: jenjang.nama, 
        singkatan: jenjang.singkatan,
        logoUrl: jenjang.logoUrl,
        iconUrl: jenjang.iconUrl
      }} 
    />
  )
}
