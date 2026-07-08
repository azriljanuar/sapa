import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { School, Users, UserCheck, CalendarCheck, Activity, GraduationCap } from "lucide-react"
import { prisma } from "@/lib/prisma"

export default async function SuperAdminDashboardPage() {
  const jenjangs = await prisma.jenjangPendidikan.findMany({
    orderBy: { id: "asc" }
  });

  const santriCounts = await prisma.santriJenjang.groupBy({
    by: ['jenjangId'],
    _count: { santriId: true },
    where: { isAlumni: false }
  });

  const rekapanSantri = jenjangs.map(j => {
    const countData = santriCounts.find(sc => sc.jenjangId === j.id);
    return {
      id: j.id,
      nama: j.nama,
      singkatan: j.singkatan,
      jumlah: countData ? countData._count.santriId : 0
    };
  });
  const recentActivities = [
    { id: 1, action: "Login ke sistem", user: "Admin SMP", role: "Admin Jenjang", time: "2 menit lalu", status: "Sukses" },
    { id: 2, action: "Membuat Tahun Ajaran 2024/2025", user: "Ahmad Super", role: "Super Admin", time: "1 jam lalu", status: "Sukses" },
    { id: 3, action: "Gagal login (Password salah)", user: "Unknown", role: "Guest", time: "3 jam lalu", status: "Gagal" },
    { id: 4, action: "Menambahkan Jenjang SMA", user: "Ahmad Super", role: "Super Admin", time: "1 hari lalu", status: "Sukses" },
    { id: 5, action: "Menambahkan Guru (Budi S.Pd)", user: "Admin SMP", role: "Admin Jenjang", time: "2 hari lalu", status: "Sukses" },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Header Dashboard Minimalis */}
      <div className="mb-2 mt-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Dashboard</h1>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-500 border-b border-slate-200 pb-2">
          <span className="hover:text-slate-900 cursor-pointer">This week</span>
          <span className="text-emerald-700 border-b-2 border-emerald-700 pb-2 -mb-[9px]">Last week</span>
          <span className="hover:text-slate-900 cursor-pointer">Last month</span>
          <span className="hover:text-slate-900 cursor-pointer">Last year</span>
        </div>
      </div>

      {/* Baris 1: Summary Statistics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
              <School className="w-4 h-4 text-slate-600" />
            </div>
            Total Jenjang
          </div>
          <div className="flex items-end gap-3 z-10">
            <span className="text-4xl font-bold text-slate-900">4</span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              100%
            </span>
          </div>
          <School className="absolute -bottom-4 -right-4 h-24 w-24 text-slate-50 group-hover:scale-110 transition-transform duration-500" />
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-slate-600" />
            </div>
            Total Pengguna
          </div>
          <div className="flex items-end gap-3 z-10">
            <span className="text-4xl font-bold text-slate-900">12</span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              15%
            </span>
          </div>
          <Users className="absolute -bottom-4 -right-4 h-24 w-24 text-slate-50 group-hover:scale-110 transition-transform duration-500" />
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4 text-slate-600" />
            </div>
            TA Aktif
          </div>
          <div className="flex items-end gap-3 z-10">
            <span className="text-3xl font-bold text-slate-900">24/25</span>
          </div>
          <CalendarCheck className="absolute -bottom-4 -right-4 h-24 w-24 text-slate-50 group-hover:scale-110 transition-transform duration-500" />
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
              <Activity className="w-4 h-4 text-slate-600" />
            </div>
            Sistem Status
          </div>
          <div className="flex items-end gap-3 z-10">
            <span className="text-2xl font-bold text-slate-900">Normal</span>
          </div>
          <Activity className="absolute -bottom-4 -right-4 h-24 w-24 text-slate-50 group-hover:scale-110 transition-transform duration-500" />
        </div>
      </div>

      {/* Baris 2: Rekapitulasi Santri & Tabel Aktivitas Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rekapitulasi Santri per Jenjang */}
        <Card className="border-none shadow-sm shadow-slate-200/50 bg-white">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <GraduationCap className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-800">Rekapitulasi Santri</CardTitle>
                <p className="text-sm text-slate-500 mt-1">Jumlah santri aktif di setiap jenjang pendidikan.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-slate-600">Jenjang</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600">Jumlah Santri</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rekapanSantri.map((rekap) => (
                  <TableRow key={rekap.id} className="hover:bg-slate-50/50 border-slate-100 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">{rekap.nama}</span>
                        <span className="text-xs text-slate-500">{rekap.singkatan}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-700">
                      {rekap.jumlah} orang
                    </TableCell>
                  </TableRow>
                ))}
                {rekapanSantri.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-slate-500 py-6">
                      Belum ada data jenjang.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tabel Aktivitas Terbaru */}
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
                  <TableHead className="text-right font-semibold text-slate-600">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivities.map((activity) => (
                  <TableRow key={activity.id} className="hover:bg-slate-50/50 border-slate-100 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800 text-sm">{activity.action}</span>
                        <span className="text-xs text-slate-400">{activity.time}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700">{activity.user}</span>
                        <span className="text-xs text-slate-500">{activity.role}</span>
                      </div>
                    </TableCell>
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
    </div>
  )
}
