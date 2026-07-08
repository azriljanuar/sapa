import { getLoggedInAdminJenjang } from "@/lib/auth"
import prisma from "@/lib/prisma"
import Image from "next/image"
import Link from "next/link"
import { Users, BookOpen, GraduationCap, ArrowRight } from "lucide-react"

export default async function AdminJenjangDashboard() {
  const admin = await getLoggedInAdminJenjang()

  // Ambil statistik
  const [jumlahGuru, jumlahSantri, jumlahKelas] = await Promise.all([
    prisma.guru.count({ where: { jenjangs: { some: { id: admin.jenjangId! } } } }),
    prisma.santri.count({ where: { jenjangs: { some: { jenjangId: admin.jenjangId! } } } }),
    prisma.kelasFormal.count({ where: { jenjangId: admin.jenjangId! } })
  ])

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 xl:gap-8 items-start">
      
      {/* Kolom Utama */}
      <div className="space-y-8">
        
        {/* Header Dashboard Minimalis */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Dashboard</h1>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-500 border-b border-slate-200 pb-2">
            <span className="hover:text-slate-900 cursor-pointer">This week</span>
            <span className="text-emerald-700 border-b-2 border-emerald-700 pb-2 -mb-[9px]">Last week</span>
            <span className="hover:text-slate-900 cursor-pointer">Last month</span>
            <span className="hover:text-slate-900 cursor-pointer">Last year</span>
          </div>
        </div>

        {/* Statistik / Overview Area ala Tarifa */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Students */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-4">
              <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              Total Santri Aktif
            </div>
            <div className="flex items-end gap-3 mb-6">
              <span className="text-4xl font-bold text-slate-900">{jumlahSantri}</span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                100%
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div>
                <p className="text-slate-500">Total Enrolled</p>
                <p className="font-bold text-slate-900 text-lg">{jumlahSantri}</p>
              </div>
              <div>
                <p className="text-slate-500">Inactive/Alumni</p>
                <p className="font-bold text-slate-900 text-lg">0</p>
              </div>
            </div>
          </div>

          {/* Card 2: Staff */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-4">
              <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-blue-600" />
              </div>
              Total Guru Terdaftar
            </div>
            <div className="flex items-end gap-3 mb-6">
              <span className="text-4xl font-bold text-slate-900">{jumlahGuru}</span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                100%
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div>
                <p className="text-slate-500">Total Kelas</p>
                <p className="font-bold text-slate-900 text-lg">{jumlahKelas}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-4">Quick Access</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Kartu Guru */}
            <Link href="/admin-jenjang/guru" className="group block bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all h-full flex flex-col">
              <div className="h-40 relative bg-indigo-50 w-full overflow-hidden p-3 rounded-t-3xl">
                <div className="relative w-full h-full rounded-2xl overflow-hidden">
                  <Image src="/images/card_guru.png" alt="Guru" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-700 transition-colors">Data Guru</h3>
                  <p className="text-slate-500 text-sm mt-1">Kelola direktori pendidik</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-full">
                    <Users className="w-4 h-4 text-indigo-500" /> {jumlahGuru} Terdaftar
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Kartu Santri */}
            <Link href="/admin-jenjang/santri" className="group block bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all h-full flex flex-col">
              <div className="h-40 relative bg-emerald-50 w-full overflow-hidden p-3 rounded-t-3xl">
                <div className="relative w-full h-full rounded-2xl overflow-hidden">
                  <Image src="/images/card_santri.png" alt="Santri" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-emerald-700 transition-colors">Data Santri</h3>
                  <p className="text-slate-500 text-sm mt-1">Kelola rekapitulasi siswa</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-full">
                    <GraduationCap className="w-4 h-4 text-emerald-500" /> {jumlahSantri} Terdaftar
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Kartu Kelas */}
            <Link href="/admin-jenjang/kelas-formal" className="group block bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all h-full flex flex-col">
              <div className="h-40 relative bg-blue-50 w-full overflow-hidden p-3 rounded-t-3xl">
                <div className="relative w-full h-full rounded-2xl overflow-hidden">
                  <Image src="/images/card_kelas.png" alt="Kelas" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-700 transition-colors">Kelas Formal</h3>
                  <p className="text-slate-500 text-sm mt-1">Atur pembagian kelas</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-full">
                    <BookOpen className="w-4 h-4 text-blue-500" /> {jumlahKelas} Kelas
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>

          </div>
        </div>
      </div>

      {/* Kolom Kanan (Profil Admin & Ringkasan) */}
      <div className="space-y-6">
        
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4 bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={`https://api.dicebear.com/7.x/notionists/svg?seed=${admin.nama}`} 
              alt={admin.nama} 
              className="object-cover w-full h-full"
            />
          </div>
          <h3 className="text-xl font-bold text-slate-900">{admin.nama}</h3>
          <p className="text-slate-500 font-medium text-sm mt-1">{admin.email}</p>
          
          <div className="w-full border-t border-slate-100 mt-6 pt-6 flex justify-between px-2">
            <div className="text-center w-1/2 border-r border-slate-100">
              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Role</p>
              <p className="text-slate-800 font-bold mt-1">Admin</p>
            </div>
            <div className="text-center w-1/2">
              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Jenjang</p>
              <p className="text-slate-800 font-bold mt-1 text-sm truncate">{admin.jenjang?.singkatan || "N/A"}</p>
            </div>
          </div>

          <div className="w-full mt-6 bg-emerald-600 rounded-2xl p-4 text-white flex justify-between items-center shadow-md">
            <div className="text-left">
              <p className="text-emerald-200 text-xs uppercase tracking-wider font-semibold">ID Pengguna</p>
              <p className="font-bold text-lg leading-none mt-1">#{admin.id}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
