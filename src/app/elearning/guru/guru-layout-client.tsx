"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Menu, Search, Bell, LayoutDashboard, Calendar, FileText, 
  Users, User, LogOut, ChevronLeft, BookOpen, ChevronRight
} from "lucide-react"

import { cn } from "@/lib/utils"
import { TaSwitcher } from "@/components/ta-switcher"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function GuruLayoutClient({ 
  children,
  session,
  allTa,
  activeSemesterId,
  isWaliKelas
}: {
  children: React.ReactNode
  session: any
  allTa: any[]
  activeSemesterId: number | null
  isWaliKelas: boolean
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { name: "Dashboard", href: "/elearning/guru", icon: LayoutDashboard },
    { name: "Jadwal Mengajar", href: "/elearning/guru/jadwal", icon: Calendar },
    { name: "Absensi", href: "/elearning/guru/absensi", icon: FileText },
    ...(isWaliKelas ? [{ name: "Rekap Absensi Kelas", href: "/elearning/guru/rekap-absensi", icon: Users }] : []),
    { name: "Profil Saya", href: "/elearning/guru/profil", icon: User },
  ]

  const isActive = (href: string) => {
    if (href === "/elearning/guru") {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const userInitial = session.email ? session.email.charAt(0).toUpperCase() : "G"
  const userName = session.email ? session.email.split('@')[0] : "Guru"

  return (
    <div className="flex min-h-dvh bg-slate-50 text-slate-900 font-sans">
      
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col print:hidden",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-transparent">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg flex items-center justify-center shadow-sm shrink-0">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col text-slate-900">
              <span className="text-xl font-black leading-none tracking-tight">SAPA</span>
              <span className="text-[0.6rem] font-bold text-indigo-600 leading-[1.1] mt-0.5">
                Portal Guru
              </span>
            </div>
          </Link>
          <button className="lg:hidden text-slate-500" onClick={() => setIsSidebarOpen(false)}>
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              E-Learning
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={cn(
                      "group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl relative transition-all",
                      active 
                        ? "text-indigo-700 bg-indigo-50" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <item.icon className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                      active ? "text-indigo-700" : "text-slate-400 group-hover:text-slate-500"
                    )} />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 mt-4">
          <form action={async () => {
            const { logoutAction } = await import("@/app/login/actions")
            await logoutAction()
          }}>
            <button
              type="submit"
              className="w-full group flex items-center px-3 py-2.5 text-sm font-bold rounded-xl text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOut className="mr-3 h-5 w-5 flex-shrink-0 text-red-500" />
              Log Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50">
        {/* Top Header */}
        <header className="h-16 shrink-0 bg-transparent flex items-center justify-between px-4 sm:px-6 lg:px-8 relative z-10 print:hidden">
          <div className="flex items-center gap-4 flex-1">
            <button 
              className="p-2 -ml-2 text-slate-500 hover:text-slate-600 lg:hidden rounded-full hover:bg-slate-50"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Breadcrumb for Desktop */}
            <div className="hidden lg:flex items-center gap-2.5 text-sm font-medium text-slate-500">
              <Link href="/" className="hover:text-indigo-600 transition-colors">Home</Link>
              <ChevronRight className="h-4 w-4 text-slate-300" />
              <span className="text-slate-800">Guru</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              {activeSemesterId && (
                <TaSwitcher tahunAjarans={allTa} selectedSemesterId={activeSemesterId} />
              )}
            </div>
            
            <button className="p-2 text-slate-600 hover:text-slate-900 relative rounded-full hover:bg-slate-200/50 transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 ring-2 ring-white shadow-sm bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <AvatarFallback className="bg-transparent text-white font-bold">{userInitial}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
