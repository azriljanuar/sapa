import { getLoggedInAdminJenjang } from "@/lib/auth"
import { getSelectedTahunAjaran } from "@/lib/ta-context"
import { getGuruPiketList, getAvailableGurus } from "./actions"
import { GuruPiketClient } from "./guru-piket-client"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Manajemen Guru Piket - Admin | SAPA",
  description: "Penugasan dan manajemen guru piket harian",
}

export default async function GuruPiketPage() {
  const admin = await getLoggedInAdminJenjang()

  if (!admin.jenjangId) {
    return (
      <div className="p-6 text-center text-destructive">
        Admin Jenjang ini belum memiliki jenjang yang dikelola.
      </div>
    )
  }

  const activeTA = await getSelectedTahunAjaran()

  if (!activeTA) {
    return (
      <div className="p-6">
        <div className="p-6 bg-red-50 text-red-600 rounded-lg">
          Belum ada Tahun Ajaran aktif yang dipilih. Silakan pilih Tahun Ajaran terlebih dahulu.
        </div>
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
