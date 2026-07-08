import Link from "next/link"
import { type ReactNode } from "react"
import { LayoutDashboard, CalendarDays, GraduationCap, Users, LogOut, UserCheck, Building, Box, Search, Bell } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-foreground flex flex-col md:flex-row">
      {/* Sidebar - Hidden on very small screens, fixed width on md+ */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-100 flex-shrink-0 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-transparent">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div className="flex flex-col text-slate-900">
              <span className="text-xl font-bold leading-none tracking-tight">SAPA</span>
              <span className="text-[0.45rem] font-medium leading-[1.1] mt-0.5 whitespace-normal break-words max-w-[55px]">
                Sistem Akademik Pesantren Al-Ittihaad
              </span>
            </div>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wider ml-1">
              Super
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-auto py-6 px-4">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Main Menu
          </p>
          <nav className="flex flex-col gap-1.5">
            <Link
              href="/super-admin"
              className={cn(buttonVariants({ variant: "ghost" }), "justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium")}
            >
              <LayoutDashboard className="mr-3 h-5 w-5 opacity-70" />
              Dashboard
            </Link>
            <Link
              href="/super-admin/profil"
              className={cn(buttonVariants({ variant: "ghost" }), "justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium")}
            >
              <Building className="mr-3 h-5 w-5 opacity-70" />
              Profil Pesantren
            </Link>
            <Link
              href="/super-admin/sarpras"
              className={cn(buttonVariants({ variant: "ghost" }), "justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium")}
            >
              <Box className="mr-3 h-5 w-5 opacity-70" />
              Data Sarpras
            </Link>
            <Link
              href="/super-admin/tahun-ajaran"
              className={cn(buttonVariants({ variant: "ghost" }), "justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium")}
            >
              <CalendarDays className="mr-3 h-5 w-5 opacity-70" />
              Tahun Ajaran
            </Link>
            <Link
              href="/super-admin/jenjang"
              className={cn(buttonVariants({ variant: "ghost" }), "justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium")}
            >
              <GraduationCap className="mr-3 h-5 w-5 opacity-70" />
              Jenjang Pendidikan
            </Link>
            <Link
              href="/super-admin/pengguna"
              className={cn(buttonVariants({ variant: "ghost" }), "justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium")}
            >
              <Users className="mr-3 h-5 w-5 opacity-70" />
              Pengguna
            </Link>
            <Link
              href="/super-admin/santri"
              className={cn(buttonVariants({ variant: "ghost" }), "justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium")}
            >
              <Users className="mr-3 h-5 w-5 opacity-70" />
              Data Santri
            </Link>
            <Link
              href="/super-admin/guru"
              className={cn(buttonVariants({ variant: "ghost" }), "justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium")}
            >
              <UserCheck className="mr-3 h-5 w-5 opacity-70" />
              Data Guru
            </Link>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100">
          <form action={async () => {
            "use server"
            const { logoutAction } = await import("@/app/login/actions")
            await logoutAction()
          }}>
            <button
              type="submit"
              className={cn(buttonVariants({ variant: "ghost" }), "w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 font-bold rounded-xl")}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Log Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50">
        <header className="h-16 shrink-0 bg-transparent flex items-center justify-between px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center gap-4 flex-1">
            <div className="hidden sm:flex max-w-lg w-full relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search for staffs, student or bills" 
                className="w-full pl-11 bg-white border-0 shadow-sm focus-visible:ring-1 focus-visible:ring-emerald-500 rounded-full h-11 text-sm text-slate-700 outline-none"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-600 hover:text-slate-900 relative rounded-full hover:bg-slate-200/50 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 ring-2 ring-white shadow-sm">
                <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=SuperAdmin`} alt="Super Admin" />
                <AvatarFallback className="bg-emerald-100 text-emerald-700">SA</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
