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
    } catch (error) {
      setSearchError("Terjadi kesalahan sistem")
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 relative font-sans">
      {/* Background with abstract shapes */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-emerald-400/20 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[120px]" />
      </div>

      <div className="flex w-full flex-col lg:flex-row z-10">
        {/* Left side - Branding / Info */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
          <Image
            src="/images/banner_islamic.png"
            alt="SAPA Background"
            fill
            className="object-cover opacity-40 mix-blend-overlay"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 to-slate-900/90" />
          
          <div className="relative z-10 flex flex-col justify-center p-16 text-white h-full w-full max-w-2xl mx-auto">
            <Link href="/" className="inline-flex items-center gap-2 mb-12 hover:opacity-80 transition-opacity">
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Kembali ke Beranda</span>
            </Link>
            
            <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-2xl">
              <span className="text-emerald-700 font-extrabold text-3xl">S</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tight mb-6 leading-tight">
              Sistem Akademik Pesantren Terpadu
            </h1>
            <p className="text-emerald-100/80 text-xl leading-relaxed mb-12">
              Satu pintu untuk semua akses akademik. Masuk sebagai Admin, Guru, atau Santri menggunakan akun Anda.
            </p>
            
            <div className="grid grid-cols-3 gap-6 pt-12 border-t border-white/10">
              <div>
                <div className="text-3xl font-bold text-white mb-1">100+</div>
                <div className="text-sm text-emerald-200/60">Fitur Akademik</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-1">24/7</div>
                <div className="text-sm text-emerald-200/60">Akses Sistem</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-1">Aman</div>
                <div className="text-sm text-emerald-200/60">Enkripsi Data</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-20 xl:px-32 relative">
          
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center ml-2">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-slate-900">SAPA Portal</span>
          </div>

          <div className="mx-auto w-full max-w-md bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white p-8 sm:p-12">
            
            {showSearch ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">Cari Akun Santri</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Ketik nama lengkap Anda untuk menemukan NISN yang digunakan sebagai username.
                  </p>
                </div>
                
                <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                  <Input 
                    placeholder="Masukkan nama santri..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-xl flex-1 bg-white"
                  />
                  <Button type="submit" disabled={isSearching} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-md">
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </form>

                {searchError && (
                  <p className="text-sm text-red-600 mb-4 bg-red-50 p-3 rounded-xl border border-red-100">{searchError}</p>
                )}

                {searchResults.length > 0 && (
                  <div className="border border-slate-200 rounded-2xl divide-y overflow-hidden bg-white shadow-sm mb-6 max-h-[300px] overflow-y-auto">
                    {searchResults.map((santri) => (
                      <div key={santri.nisn} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="font-semibold text-slate-900">{santri.namaLengkap}</div>
                        <div className="text-sm text-slate-500 mt-2 flex justify-between items-center">
                          <span className="bg-slate-100 px-2 py-1 rounded-md">NISN: <span className="font-bold text-emerald-700">{santri.nisn}</span></span>
                          {santri.jenjangs?.length > 0 && (
                            <span className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full">
                              {santri.jenjangs.map((j: any) => j.jenjang.nama).join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 flex justify-center">
                  <Button variant="ghost" onClick={() => setShowSearch(false)} className="text-sm text-slate-600 hover:text-slate-900">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Login
                  </Button>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in zoom-in-95 duration-500">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                    Selamat Datang
                  </h2>
                  <p className="mt-2 text-slate-600">
                    Masukkan ID Pengguna (Email/NISN/NIK) dan kata sandi Anda.
                  </p>
                </div>

                <form action={formAction} className="space-y-6">
                  {state?.error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 animate-in shake">
                      <div className="flex">
                        <div className="ml-3">
                          <h3 className="text-sm font-semibold text-red-800">Login Gagal</h3>
                          <div className="mt-1 text-sm text-red-700">
                            <p>{state.error}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="username" className="text-sm font-semibold text-slate-700">ID Pengguna</Label>
                      <div className="mt-2">
                        <Input
                          id="username"
                          name="username"
                          type="text"
                          autoComplete="username"
                          required
                          placeholder="Email / NISN / NIK"
                          className="block w-full rounded-2xl border-slate-200 bg-white/50 px-4 py-3 text-slate-900 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mt-2 mb-2">
                        <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Kata Sandi</Label>
                      </div>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        placeholder="••••••••"
                        className="block w-full rounded-2xl border-slate-200 bg-white/50 px-4 py-3 text-slate-900 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                      />
                      <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600">
                        Ingat saya
                      </label>
                    </div>

                    <div className="text-sm">
                      <button
                        type="button"
                        onClick={() => setShowSearch(true)}
                        className="font-medium text-emerald-600 hover:text-emerald-500"
                      >
                        Lupa NISN Santri?
                      </button>
                    </div>
                  </div>

                  <div>
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="w-full rounded-2xl bg-emerald-600 py-6 text-base font-semibold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50 transition-all duration-300 hover:scale-[1.02]"
                    >
                      {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Masuk ke Portal"}
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
