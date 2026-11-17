import { Metadata } from "next"
import { getLoggedInKesiswaan } from "@/lib/auth"
import { KartuIdentitasClient } from "@/app/admin/kartu-identitas/kartu-identitas-client"

export const metadata: Metadata = {
  title: "Kartu Identitas Santri - Kesiswaan | SAPA",
  description: "Cetak kartu santri pintar dan pairing UID kartu RFID fisik",
}

export const dynamic = "force-dynamic"

export default async function KesiswaanKartuIdentitasPage() {
  await getLoggedInKesiswaan()

  return <KartuIdentitasClient />
}
