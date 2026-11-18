import { getLoggedInAdminJenjang } from "@/lib/auth"
import { getTugasTambahanData } from "./actions"
import { TugasTambahanClient } from "./tugas-tambahan-client"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Tugas Tambahan Guru - SAPA",
  description: "Kelola penugasan tugas tambahan guru: Pimpinan & Waka, Wali Kelas, dan Guru Piket",
}

export default async function TugasTambahanPage(props: {
  searchParams?: Promise<{ tab?: string }>
}) {
  await getLoggedInAdminJenjang()

  const searchParams = props.searchParams ? await props.searchParams : undefined
  const initialTab = (searchParams?.tab === "piket" || searchParams?.tab === "wali-kelas") 
    ? searchParams.tab 
    : "struktural"

  const res = await getTugasTambahanData()

  if (!res.success || !res.data) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-3">
        <h2 className="text-xl font-bold text-foreground">Gagal Memuat Data</h2>
        <p className="text-sm text-muted-foreground">{res.error || "Terjadi kesalahan sistem"}</p>
      </div>
    )
  }

  return (
    <TugasTambahanClient
      initialTab={initialTab}
      initialAssignments={res.data.assignments as any}
      availableGurus={res.data.availableGurus as any}
      activeTA={res.data.activeTA}
      kelasList={res.data.kelasList as any}
      piketList={res.data.piketList as any}
    />
  )
}
