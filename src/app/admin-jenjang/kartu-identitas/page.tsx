import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { KartuIdentitasClient } from "./kartu-identitas-client"

export const metadata = {
  title: "Kartu Identitas - Admin Jenjang | SAPA",
  description: "Manajemen cetak kartu identitas (ID Card)",
}

export default async function KartuIdentitasPage() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN_JENJANG") {
    redirect("/login")
  }

  return <KartuIdentitasClient />
}
