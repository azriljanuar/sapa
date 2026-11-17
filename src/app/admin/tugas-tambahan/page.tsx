import { getLoggedInAdminJenjang } from "@/lib/auth"
import { getTugasTambahanData } from "./actions"
import { TugasTambahanClient } from "./tugas-tambahan-client"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Tugas Tambahan Guru - SAPA",
  description: "Kelola penugasan struktural guru: Kepala Sekolah, Kurikulum, dan Kesiswaan",
}

export default async function TugasTambahanPage() {
  await getLoggedInAdminJenjang()

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
      initialAssignments={res.data.assignments as any}
      availableGurus={res.data.availableGurus as any}
      activeTA={res.data.activeTA}
    />
  )
}
