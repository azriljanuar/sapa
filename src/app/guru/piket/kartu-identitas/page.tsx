import { getLoggedInGuruPiket } from "@/lib/auth"
import { getSelectedTahunAjaran } from "@/lib/ta-context"
import { GuruPiketKartuClient } from "./guru-piket-kartu-client"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Kartu Identitas - Guru Piket | SAPA",
  description: "Layanan preview dan cetak ID Card santri dan guru untuk pos piket",
}

export default async function GuruPiketKartuPage() {
  await getLoggedInGuruPiket()
  const activeTA = await getSelectedTahunAjaran()

  return (
    <GuruPiketKartuClient activeTaName={activeTA?.nama || "Tahun Ajaran Aktif"} />
  )
}
