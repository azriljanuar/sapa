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
        
        {/* Banner Utama */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-md border-0 h-64 md:h-72 flex items-center p-8 md:p-12">
          {/* Background Image Absolute */}
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
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">Hi, {admin.nama} 👋</h1>
            <p className="text-blue-100 text-lg md:text-xl max-w-lg leading-relaxed">
              Selamat datang di Dasbor SIAKAD {admin.jenjang?.nama}. The expert in anything was once a beginner!
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-bold text-slate-800">Quick Access</h2>
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

        {/* Statistik / Attendance Area */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-bold text-slate-800">Sistem Overview</h2>
          </div>
          
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <div className="grid grid-cols-3 gap-4 md:gap-8">
              
              {/* Circle 1 */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                    <circle cx="50" cy="50" r="40" stroke="#10b981" strokeWidth="12" fill="none" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * 1)} strokeLinecap="round" />
                  </svg>
                  <div className="absolute text-2xl sm:text-4xl font-bold text-slate-800">{jumlahSantri}</div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span className="text-sm sm:text-base font-medium text-slate-600">Total Santri</span>
                </div>
              </div>

              {/* Circle 2 */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                    <circle cx="50" cy="50" r="40" stroke="#3b82f6" strokeWidth="12" fill="none" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * 1)} strokeLinecap="round" />
                  </svg>
                  <div className="absolute text-2xl sm:text-4xl font-bold text-slate-800">{jumlahGuru}</div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  <span className="text-sm sm:text-base font-medium text-slate-600">Total Guru</span>
                </div>
              </div>

              {/* Circle 3 */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                    <circle cx="50" cy="50" r="40" stroke="#f59e0b" strokeWidth="12" fill="none" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * 1)} strokeLinecap="round" />
                  </svg>
                  <div className="absolute text-2xl sm:text-4xl font-bold text-slate-800">{jumlahKelas}</div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span className="text-sm sm:text-base font-medium text-slate-600">Total Kelas</span>
                </div>
              </div>

            </div>
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

          <div className="w-full mt-6 bg-blue-600 rounded-2xl p-4 text-white flex justify-between items-center shadow-md">
            <div className="text-left">
              <p className="text-blue-200 text-xs uppercase tracking-wider font-semibold">ID Pengguna</p>
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
