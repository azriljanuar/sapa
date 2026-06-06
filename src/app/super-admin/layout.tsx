import Link from "next/link"
import { type ReactNode } from "react"
import { LayoutDashboard, CalendarDays, GraduationCap, Users, LogOut, UserCheck, Building, Box } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-foreground flex flex-col md:flex-row">
      {/* Sidebar - Hidden on very small screens, fixed width on md+ */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">S</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">SIAKAD</span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wider ml-1">
              Super
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-auto py-6 px-4">
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
              className={cn(buttonVariants({ variant: "ghost" }), "w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 font-medium")}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Keluar Sesi
            </button>
          </form>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm shadow-slate-100/50">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-slate-800 tracking-tight">Super Admin Panel</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-sm font-semibold text-slate-700">Ahmad Super</span>
              <span className="text-xs text-slate-500">Administrator Utama</span>
            </div>
            <Avatar className="h-9 w-9 ring-2 ring-slate-100">
              <AvatarImage src="https://github.com/shadcn.png" alt="@admin" />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">SA</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
