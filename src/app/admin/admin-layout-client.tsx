"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Menu, Search, Bell, Home, Users, BookOpen, GraduationCap, 
  Settings, LogOut, ChevronLeft, Building, Box, Library, CalendarDays, 
  IdCard, ClipboardList, BarChart2, Shield, LayoutTemplate, LayoutDashboard, UserCheck
} from "lucide-react"

import { cn } from "@/lib/utils"
import { TaSwitcher } from "@/components/ta-switcher"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function AdminLayoutClient({ 
  children,
  admin,
  lembaga,
  allTa,
  activeSemesterId
}: {
  children: React.ReactNode
  admin: any
  lembaga: any
  allTa: any[]
  activeSemesterId: number | null
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  const sebutanSantri = lembaga?.sebutanSantri || "Santri"
  const sebutanGuru = lembaga?.sebutanGuru || "Guru"

  const navGroups = [
    {
      title: "Overview",
      items: [
        { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { name: "Landing Page", href: "/admin/landing-page", icon: LayoutTemplate },
      ]
    },
    {
      title: "Akademik & Kesiswaan",
      items: [
        { name: `Data ${sebutanSantri}`, href: "/admin/santri", icon: GraduationCap },
        { name: "Data Alumni", href: "/admin/alumni", icon: GraduationCap },
        { name: `Data ${sebutanGuru}`, href: "/admin/guru", icon: Users },
        { name: "Guru Piket", href: "/admin/guru-piket", icon: UserCheck },
        { name: "Kelas Formal", href: "/admin/kelas-formal", icon: BookOpen },
        { name: "Mata Pelajaran", href: "/admin/mata-pelajaran", icon: Library },
        { name: "Jadwal Pelajaran", href: "/admin/jadwal-pelajaran", icon: CalendarDays },
        { name: "Penilaian", href: "/admin/penilaian", icon: BarChart2 },
        { name: "Rekap Kehadiran", href: "/admin/rekap-kehadiran", icon: ClipboardList },
        { name: "Kartu Identitas", href: "/admin/kartu-identitas", icon: IdCard },
        { name: "Data Sarpras", href: "/admin/sarpras", icon: Box },
      ]
    },
    {
      title: "Konfigurasi & Sistem",
      items: [
        { name: "Profil Lembaga", href: "/admin/profil", icon: Building },
        { name: "Tahun Ajaran", href: "/admin/tahun-ajaran", icon: CalendarDays },
        { name: "Manajemen Akun", href: "/admin/pengguna", icon: Shield },
        { name: "Pengaturan Akun", href: "/admin/settings", icon: Settings },
      ]
    }
  ]

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin"
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="flex min-h-dvh bg-background text-foreground font-sans antialiased">
      
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col print:hidden select-none",
        isSidebarOpen ? "translate-x-0 shadow-xl lg:shadow-none" : "-translate-x-full",
        isCollapsed ? "w-18" : "w-64"
      )}>
        {/* Sidebar Header */}
        <div className={cn(
          "flex h-14 shrink-0 items-center border-b border-sidebar-border transition-all",
          isCollapsed ? "justify-center px-0" : "justify-between px-5"
        )}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            {lembaga?.logoUrl ? (
              <img 
                src={lembaga.logoUrl} 
                alt="Logo" 
                className={cn("object-contain shrink-0 transition-all", isCollapsed ? "h-7 w-7" : "h-8 w-8")} 
              />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <GraduationCap className="h-5 w-5" />
              </div>
            )}
            
            {!isCollapsed && (
              <div className="flex flex-col whitespace-nowrap min-w-0">
                <span className="text-base font-bold leading-none tracking-tight text-foreground">SAPA</span>
                <span className="text-[10px] font-medium text-muted-foreground leading-tight mt-0.5 truncate max-w-[150px]">
                  {lembaga?.singkatan || lembaga?.namaLembaga || "Super Admin"}
                </span>
              </div>
            )}
          </div>
          
          {/* Mobile close button */}
          <button 
            className="lg:hidden text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted" 
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Tutup sidebar"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-2.5 space-y-5 scrollbar-none">
          {navGroups.map((group, idx) => (
            <div key={idx}>
              {!isCollapsed ? (
                <p className="px-2.5 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
                  {group.title}
                </p>
              ) : (
                <div className="h-px bg-sidebar-border my-2 mx-2" />
              )}
              
              <nav className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      title={isCollapsed ? item.name : undefined}
                      className={cn(
                        "group flex items-center text-sm font-medium rounded-lg transition-all duration-150",
                        isCollapsed 
                          ? "justify-center h-10 w-10 mx-auto px-0" 
                          : "px-3 py-2 h-9 gap-3",
                        active 
                          ? "text-sidebar-accent-foreground bg-sidebar-accent font-semibold shadow-2xs" 
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon className={cn(
                        "shrink-0 transition-colors",
                        isCollapsed ? "h-5 w-5" : "h-4 w-4",
                        active ? "text-sidebar-primary" : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
                      )} />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </Link>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Sidebar Footer / User Profile */}
        <div className="p-2.5 mt-auto border-t border-sidebar-border bg-sidebar">
          <form action={async () => {
            const { logoutAction } = await import("@/app/login/actions")
            await logoutAction()
          }} className="w-full">
            <button
              type="submit"
              title="Keluar dari akun"
              className={cn(
                "group flex items-center text-sm font-medium rounded-lg hover:bg-destructive/10 transition-all w-full text-left",
                isCollapsed ? "justify-center p-2" : "px-2.5 py-2 gap-3"
              )}
            >
              <Avatar className="h-8 w-8 shrink-0 rounded-lg border border-border">
                <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                  {admin?.nama?.charAt(0) || "A"}
                </AvatarFallback>
              </Avatar>
              
              {!isCollapsed && (
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold text-foreground truncate group-hover:text-destructive transition-colors">
                    {admin?.nama || "Super Admin"}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {admin?.email || "admin@sapa.id"}
                  </span>
                </div>
              )}
              
              {!isCollapsed && (
                <LogOut className="h-4 w-4 text-muted-foreground group-hover:text-destructive shrink-0 transition-colors" />
              )}
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Buka menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Perkecil menu"
              title="Perkecil menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            <span className="text-xs font-semibold text-muted-foreground hidden sm:inline-block">
              {lembaga?.namaLembaga || "Sistem Akademik"}
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4">
            <TaSwitcher tahunAjarans={allTa} selectedSemesterId={activeSemesterId} />

            <div className="h-4 w-px bg-border hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                SUPER ADMIN
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

    </div>
  )
}
