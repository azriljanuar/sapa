import { Metadata } from "next"
import { getLoggedInKesiswaan } from "@/lib/auth"
import { getSelectedTahunAjaran } from "@/lib/ta-context"
import { getGuruPiketList, getAvailableGurus } from "@/app/admin/guru-piket/actions"
import { GuruPiketClient } from "@/app/admin/guru-piket/guru-piket-client"

export const metadata: Metadata = {
  title: "Monitoring Guru Piket - Kesiswaan | SAPA",
  description: "Penugasan dan monitoring guru piket harian madrasah",
}

export const dynamic = "force-dynamic"

export default async function KesiswaanGuruPiketPage() {
  await getLoggedInKesiswaan()

  const activeTA = await getSelectedTahunAjaran()

  if (!activeTA) {
    return (
      <div className="p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-sm font-medium">
          Belum ada Tahun Ajaran aktif yang dipilih.
        </div>
    )
  }

  const [piketList, guruList] = await Promise.all([
    getGuruPiketList(),
    getAvailableGurus(),
  ])

  return (
    <GuruPiketClient
      initialData={piketList}
      guruList={guruList}
      activeTaName={activeTA.nama}
    />
  )
}
