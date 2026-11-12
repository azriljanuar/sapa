import { getLoggedInAdmin } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getIdentitasLembaga } from "@/lib/lembaga"
import { SettingsClient } from "./settings-client"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const admin = await getLoggedInAdmin()
  const lembaga = await getIdentitasLembaga()

  const user = await prisma.user.findUnique({
    where: { id: admin.id }
  })

  if (!user) {
    return (
      <div className="p-6 text-center text-destructive">
        Data pengguna tidak ditemukan.
      </div>
    )
  }

  return (
    <SettingsClient 
      user={{ id: user.id, nama: user.nama, email: user.email }}
      jenjang={{ 
        id: lembaga.id, 
        nama: lembaga.namaLembaga, 
        singkatan: lembaga.singkatan,
        logoUrl: lembaga.logoUrl,
        iconUrl: lembaga.iconUrl
      }} 
    />
  )
}
