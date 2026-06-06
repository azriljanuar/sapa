import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { School, Users, UserCheck, CalendarCheck, Activity } from "lucide-react"

export default function SuperAdminDashboardPage() {
  const recentActivities = [
    { id: 1, action: "Login ke sistem", user: "Admin SMP", role: "Admin Jenjang", time: "2 menit lalu", status: "Sukses" },
    { id: 2, action: "Membuat Tahun Ajaran 2024/2025", user: "Ahmad Super", role: "Super Admin", time: "1 jam lalu", status: "Sukses" },
    { id: 3, action: "Gagal login (Password salah)", user: "Unknown", role: "Guest", time: "3 jam lalu", status: "Gagal" },
    { id: 4, action: "Menambahkan Jenjang SMA", user: "Ahmad Super", role: "Super Admin", time: "1 hari lalu", status: "Sukses" },
    { id: 5, action: "Menambahkan Guru (Budi S.Pd)", user: "Admin SMP", role: "Admin Jenjang", time: "2 hari lalu", status: "Sukses" },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Banner Header Premium */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-md border-0 h-64 md:h-72 flex items-center p-8 md:p-12">
        <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay">
          <Image 
            src="/images/banner_islamic.png" 
            alt="Banner Background" 
            fill 
            className="object-cover"
            priority
          />
        </div>
        
        <div className="relative z-10 w-full">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">Hi, Ahmad Super 👋</h1>
          <p className="text-slate-300 text-lg md:text-xl max-w-lg leading-relaxed">
            Selamat datang di Dasbor SIAKAD Pusat. Pantau statistik utama dan kelola sistem secara keseluruhan.
          </p>
        </div>
      </div>

      {/* Baris 1: Summary Statistics (Grid 4 Kolom) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <Card className="border-none shadow-sm shadow-slate-200/50 hover:shadow-md transition-shadow relative overflow-hidden bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-600">Total Jenjang</CardTitle>
            <School className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">4</div>
            <p className="text-xs text-green-600 font-medium mt-1">
              +1 jenjang baru bulan ini
            </p>
            <School className="absolute -bottom-4 -right-4 h-24 w-24 text-slate-100/60 -z-10" />
          </CardContent>
        </Card>

        {/* Card 2 */}
        <Card className="border-none shadow-sm shadow-slate-200/50 hover:shadow-md transition-shadow relative overflow-hidden bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-600">Total Pengguna</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">12</div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Termasuk 2 Super Admin
            </p>
            <Users className="absolute -bottom-4 -right-4 h-24 w-24 text-slate-100/60 -z-10" />
          </CardContent>
        </Card>

        {/* Card 3 */}
        <Card className="border-none shadow-sm shadow-slate-200/50 hover:shadow-md transition-shadow relative overflow-hidden bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-600">Tahun Ajaran Aktif</CardTitle>
            <CalendarCheck className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">24/25</div>
            <p className="text-xs text-amber-600 font-medium mt-1">
              Semester Ganjil berjalan
            </p>
            <CalendarCheck className="absolute -bottom-4 -right-4 h-24 w-24 text-slate-100/60 -z-10" />
          </CardContent>
        </Card>

        {/* Card 4 */}
        <Card className="border-none shadow-sm shadow-slate-200/50 hover:shadow-md transition-shadow relative overflow-hidden bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-600">Total Guru</CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">45</div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Tersebar di seluruh jenjang
            </p>
            <UserCheck className="absolute -bottom-4 -right-4 h-24 w-24 text-slate-100/60 -z-10" />
          </CardContent>
        </Card>
      </div>

      {/* Baris 2: Tabel Aktivitas Terbaru */}
      <Card className="border-none shadow-sm shadow-slate-200/50 bg-white">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-800">Log Aktivitas Terbaru</CardTitle>
              <p className="text-sm text-slate-500 mt-1">Merekam segala perubahan penting di dalam sistem.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-slate-600">Aktivitas</TableHead>
                <TableHead className="font-semibold text-slate-600">Pengguna</TableHead>
                <TableHead className="font-semibold text-slate-600">Waktu</TableHead>
                <TableHead className="text-right font-semibold text-slate-600">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivities.map((activity) => (
                <TableRow key={activity.id} className="hover:bg-slate-50/50 border-slate-100 transition-colors">
                  <TableCell className="font-medium text-slate-800">{activity.action}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700">{activity.user}</span>
                      <span className="text-xs text-slate-500">{activity.role}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">{activity.time}</TableCell>
                  <TableCell className="text-right">
                    <Badge 
                      variant={activity.status === "Sukses" ? "default" : "destructive"}
                      className={
                        activity.status === "Sukses" 
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-transparent shadow-none" 
                          : "shadow-none"
                      }
                    >
                      {activity.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
