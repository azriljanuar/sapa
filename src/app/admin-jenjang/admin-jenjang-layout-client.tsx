"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Menu, Search, Bell, Home, Users, BookOpen, GraduationCap, 
  Settings, LogOut, ChevronLeft, Building, Box 
} from "lucide-react"

import { cn } from "@/lib/utils"
import { TaSelector } from "./ta-selector"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function AdminJenjangLayoutClient({ 
  children,
  admin,
  allTa,
  activeTaId
}: {
  children: React.ReactNode
  admin: any
  allTa: any[]
  activeTaId: number | null
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { name: "Home", href: "/admin-jenjang", icon: Home },
    { name: "Data Guru", href: "/admin-jenjang/guru", icon: Users },
    { name: "Kelas Formal", href: "/admin-jenjang/kelas-formal", icon: BookOpen },
    { name: "Data Sarpras", href: "/admin-jenjang/sarpras", icon: Box },
    { name: "Data Santri", href: "/admin-jenjang/santri", icon: GraduationCap },
    { name: "Data Alumni", href: "/admin-jenjang/alumni", icon: GraduationCap },
  ]

  const isActive = (href: string) => {
    if (href === "/admin-jenjang") {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

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
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 shadow-sm transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-slate-50">
          <div className="flex items-center gap-2 text-xl font-bold text-blue-700">
            <GraduationCap className="h-6 w-6" />
            Siakad
          </div>
          <button className="lg:hidden text-slate-500" onClick={() => setIsSidebarOpen(false)}>
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
          <div className="px-2">
            <TaSelector items={allTa} currentTaId={activeTaId} />
          </div>

          <div>
            <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Overview
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
                      "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg relative overflow-hidden transition-all",
                      active 
                        ? "text-blue-700 bg-blue-50/50" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full" />
                    )}
                    <item.icon className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                      active ? "text-blue-700" : "text-slate-400 group-hover:text-slate-500"
                    )} />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div>
            <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Setting
            </p>
            <nav className="space-y-1">
              <Link
                href="/admin-jenjang/profil"
                className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
              >
                <Building className="mr-3 h-5 w-5 flex-shrink-0 text-slate-400 group-hover:text-slate-500" />
                Profil Jenjang
              </Link>
              <Link
                href="#"
                className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
              >
                <Settings className="mr-3 h-5 w-5 flex-shrink-0 text-slate-400 group-hover:text-slate-500" />
                Setting
              </Link>
              <form action={async () => {
                const { logoutAction } = await import("@/app/login/actions")
                await logoutAction()
              }}>
                <button
                  type="submit"
                  className="w-full group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition-all"
                >
                  <LogOut className="mr-3 h-5 w-5 flex-shrink-0 text-red-500" />
                  Logout
                </button>
              </form>
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 shrink-0 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm relative z-10">
          <div className="flex items-center gap-4 flex-1">
            <button 
              className="p-2 -ml-2 text-slate-500 hover:text-slate-600 lg:hidden rounded-full hover:bg-slate-50"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex max-w-md w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-9 bg-slate-50 border-transparent focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:bg-white rounded-full h-10"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-6">
            <button className="p-2 text-slate-400 hover:text-slate-600 relative rounded-full hover:bg-slate-50 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-4 sm:pl-6 border-l border-slate-200">
              <Avatar className="h-9 w-9 ring-2 ring-white shadow-sm">
                <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${admin.nama}`} alt={admin.nama} />
                <AvatarFallback className="bg-blue-100 text-blue-700">{admin.nama.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-sm">
                <p className="font-semibold text-slate-900 leading-none">{admin.nama}</p>
                <p className="text-slate-500 text-xs mt-1">Admin Jenjang</p>
              </div>
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
