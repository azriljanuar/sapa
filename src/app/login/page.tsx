"use client"

import { useActionState, useState } from "react"
import { loginAction, searchSantriAction } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import Link from "next/link"
import { Search, Loader2, ArrowLeft } from "lucide-react"

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, { error: "" })
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState("")

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery || searchQuery.length < 3) {
      setSearchError("Ketik minimal 3 huruf untuk mencari")
      return
    }
    
    setIsSearching(true)
    setSearchError("")
    try {
      const res = await searchSantriAction(searchQuery)
      if (res.success) {
        setSearchResults(res.data || [])
        if (res.data?.length === 0) {
          setSearchError("Tidak ada santri yang cocok dengan pencarian Anda.")
        }
      } else {
        setSearchError(res.error || "Gagal melakukan pencarian")
      }
    } catch {
      setSearchError("Terjadi kesalahan sistem")
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background relative font-sans antialiased">
      {/* Background with abstract shapes */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="flex w-full flex-col lg:flex-row z-10">
        {/* Left side - Branding / Info */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-foreground overflow-hidden">
          <Image
            src="/images/banner_islamic.png"
            alt="SAPA Background"
            fill
            className="object-cover opacity-20 mix-blend-overlay"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-foreground/95 to-foreground" />
          
          <div className="relative z-10 flex flex-col justify-center p-16 text-primary-foreground h-full w-full max-w-2xl mx-auto">
            <Link href="/" className="inline-flex items-center gap-2 mb-12 opacity-80 hover:opacity-100 transition-opacity">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Kembali ke Beranda</span>
            </Link>
            
            <div className="h-14 w-14 bg-primary text-primary-foreground rounded-xl flex items-center justify-center mb-8 shadow-xl">
              <span className="font-extrabold text-2xl">S</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold tracking-tight mb-4 leading-tight">
              Sistem Akademik Pesantren Terpadu
            </h1>
            <p className="text-primary-foreground/80 text-lg leading-relaxed mb-10">
              Satu pintu untuk semua akses akademik. Masuk sebagai Admin, Guru, atau Santri menggunakan akun Anda.
            </p>
            
            <div className="grid grid-cols-3 gap-6 pt-10 border-t border-primary-foreground/15">
              <div>
                <div className="text-2xl font-bold mb-1">100+</div>
                <div className="text-xs text-primary-foreground/70">Fitur Akademik</div>
              </div>
              <div>
                <div className="text-2xl font-bold mb-1">24/7</div>
                <div className="text-xs text-primary-foreground/70">Akses Sistem</div>
              </div>
              <div>
                <div className="text-2xl font-bold mb-1">Aman</div>
                <div className="text-xs text-primary-foreground/70">Enkripsi Data</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-20 xl:px-32 relative">
          
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="h-9 w-9 bg-primary text-primary-foreground rounded-lg flex items-center justify-center ml-2">
              <span className="font-bold text-base">S</span>
            </div>
            <span className="text-lg font-bold text-foreground">SAPA Portal</span>
          </div>

          <div className="mx-auto w-full max-w-md bg-card/90 backdrop-blur-xl rounded-2xl shadow-lg border border-border p-6 sm:p-10">
            
            {showSearch ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="mb-6">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Cari Akun Santri</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ketik nama lengkap Anda untuk menemukan NISN yang digunakan sebagai username.
                  </p>
                </div>
                
                <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                  <Input 
                    placeholder="Masukkan nama santri..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 text-xs h-9"
                  />
                  <Button type="submit" disabled={isSearching} size="sm" className="h-9">
                    {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                  </Button>
                </form>

                {searchError && (
                  <p className="text-xs text-destructive mb-4 bg-destructive/10 p-2.5 rounded-lg border border-destructive/20">{searchError}</p>
                )}

                {searchResults.length > 0 && (
                  <div className="border border-border rounded-xl divide-y divide-border overflow-hidden bg-card shadow-xs mb-4 max-h-[250px] overflow-y-auto">
                    {searchResults.map((santri) => (
                      <div key={santri.nisn} className="p-3 hover:bg-muted/50 transition-colors">
                        <div className="font-medium text-foreground text-sm">{santri.namaLengkap}</div>
                        <div className="text-xs text-muted-foreground mt-1.5 flex justify-between items-center">
                          <span className="bg-muted px-2 py-0.5 rounded-md font-mono">NISN: <span className="font-bold text-primary">{santri.nisn}</span></span>
                          {santri.jenjangs?.length > 0 && (
                            <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-medium">
                              {santri.jenjangs.map((j: any) => j.jenjang.nama).join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 flex justify-center">
                  <Button variant="ghost" size="sm" onClick={() => setShowSearch(false)} className="text-xs text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Kembali ke Login
                  </Button>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Selamat Datang
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Masukkan ID Pengguna (Email / NISN / NIK) dan kata sandi Anda.
                  </p>
                </div>

                <form action={formAction} className="space-y-4">
                  {state?.error && (
                    <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 animate-in shake">
                      <div className="flex">
                        <div>
                          <h3 className="text-xs font-semibold text-destructive">Login Gagal</h3>
                          <div className="mt-0.5 text-xs text-destructive/90">
                            <p>{state.error}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3.5">
                    <div>
                      <Label htmlFor="username" className="text-xs font-medium text-foreground">ID Pengguna</Label>
                      <div className="mt-1.5">
                        <Input
                          id="username"
                          name="username"
                          type="text"
                          autoComplete="username"
                          required
                          placeholder="Email / NISN / NIK"
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mt-1 mb-1.5">
                        <Label htmlFor="password" className="text-xs font-medium text-foreground">Kata Sandi</Label>
                      </div>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        placeholder="••••••••"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-input text-primary focus:ring-ring"
                      />
                      <label htmlFor="remember-me" className="ml-2 block text-xs text-muted-foreground">
                        Ingat saya
                      </label>
                    </div>

                    <div className="text-xs">
                      <button
                        type="button"
                        onClick={() => setShowSearch(true)}
                        className="font-medium text-primary hover:underline"
                      >
                        Lupa NISN Santri?
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="w-full h-10 text-sm font-semibold shadow-xs"
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Masuk ke Portal"}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
