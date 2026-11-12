import { getLoggedInAdminJenjang } from "@/lib/auth"
import { KartuIdentitasClient } from "./kartu-identitas-client"

export const metadata = {
  title: "Kartu Identitas - Admin | SAPA",
  description: "Manajemen cetak kartu identitas (ID Card)",
}

export default async function KartuIdentitasPage() {
  await getLoggedInAdminJenjang()

  return <KartuIdentitasClient />
}
