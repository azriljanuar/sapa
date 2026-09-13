import { ScanSantriClient } from "./scan-santri-client"

export default function ScanSantriPage() {
  // Halaman publik (tidak perlu login) — kiosk mode global
  return (
    <div className="min-h-screen bg-slate-900">
      <ScanSantriClient />
    </div>
  )
}
