"use client"

import { useActionState, useState } from "react"
import { loginSantriAction, searchSantriAction } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import Link from "next/link"
import { Search, Loader2 } from "lucide-react"

export default function LoginSantriPage() {
  const [state, formAction, isPending] = useActionState(loginSantriAction, { error: "" })
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
    <div className="flex min-h-screen bg-white">
      {/* Left side - Image/Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-emerald-900">
        <Image
          src="/images/banner_islamic.png"
          alt="SAPA Background"
          fill
          className="object-cover opacity-60"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/80 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-12 text-white h-full">
          <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center mb-6">
            <span className="text-emerald-700 font-bold text-xl">S</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Portal Santri SAPA</h1>
          <p className="text-emerald-100 text-lg max-w-md">
            Akses informasi akademik, rapor, dan kegiatan belajar Anda secara mudah dan cepat.
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:w-1/2 lg:px-20 xl:px-24 bg-slate-50">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
             <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-2xl font-bold text-slate-900">Portal Santri</span>
          </div>

          <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
            Login Santri
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Gunakan NISN sebagai Username Anda.
          </p>

          <div className="mt-8">
            {showSearch ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 mb-6">
                  <h3 className="font-medium text-emerald-800 flex items-center gap-2">
                    <Search className="h-4 w-4" /> Cari Akun Santri
                  </h3>
                  <p className="text-sm text-emerald-700 mt-1">
                    Ketik nama lengkap atau sebagian nama Anda untuk menemukan NISN (Username).
                  </p>
                </div>
                
                <form onSubmit={handleSearch} className="flex gap-2">
                  <Input 
                    placeholder="Masukkan nama santri..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-xl flex-1"
                  />
                  <Button type="submit" disabled={isSearching} className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cari"}
                  </Button>
                </form>

                {searchError && (
                  <p className="text-sm text-red-600">{searchError}</p>
                )}

                {searchResults.length > 0 && (
                  <div className="mt-4 border rounded-xl divide-y overflow-hidden bg-white">
                    {searchResults.map((santri) => (
                      <div key={santri.nisn} className="p-3 hover:bg-slate-50 transition-colors">
                        <div className="font-medium text-slate-900">{santri.namaLengkap}</div>
                        <div className="text-sm text-slate-500 mt-1 flex justify-between items-center">
                          <span>NISN: <span className="font-bold text-emerald-700">{santri.nisn}</span></span>
                          {santri.jenjangs?.length > 0 && (
                            <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full">
                              {santri.jenjangs.map((j: any) => j.jenjang.nama).join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-4 flex justify-center">
                  <Button variant="ghost" onClick={() => setShowSearch(false)} className="text-sm text-slate-600">
                    Kembali ke halaman Login
                  </Button>
                </div>
              </div>
            ) : (
              <form action={formAction} className="space-y-6">
                {state?.error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Gagal Masuk</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{state.error}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username" className="text-slate-700">NISN (Username)</Label>
                    <div className="mt-2">
                      <Input
                        id="username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        required
                        placeholder="Masukkan NISN Anda"
                        className="block w-full rounded-xl border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-slate-700">Kata Sandi</Label>
                    <div className="mt-2">
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        placeholder="••••••••"
                        className="block w-full rounded-xl border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                      />
                    </div>
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
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
                      Ingat saya
                    </label>
                  </div>

                  <div className="text-sm leading-6">
                    <button
                      type="button"
                      onClick={() => setShowSearch(true)}
                      className="font-semibold text-emerald-600 hover:text-emerald-500"
                    >
                      Lupa NISN? Cari akun
                    </button>
                  </div>
                </div>

                <div>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="flex w-full justify-center rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50 transition-all duration-200"
                  >
                    {isPending ? "Sedang Memproses..." : "Masuk ke Portal Santri"}
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-8 text-center text-sm text-slate-500">
              Bukan Santri?{" "}
              <Link href="/login" className="font-semibold leading-6 text-emerald-600 hover:text-emerald-500">
                Login sebagai Guru / Admin
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
