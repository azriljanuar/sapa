"use client"

import { useActionState } from "react"
import { loginAction } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, { error: "" })

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left side - Image/Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900">
        <Image
          src="/images/banner_islamic.png"
          alt="SIAKAD Background"
          fill
          className="object-cover opacity-60"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-12 text-white h-full">
          <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center mb-6">
            <span className="text-blue-700 font-bold text-xl">S</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Sistem Informasi Akademik</h1>
          <p className="text-blue-100 text-lg max-w-md">
            Kelola data akademik, santri, dan tenaga pendidik dengan mudah, cepat, dan terintegrasi dalam satu platform modern.
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:w-1/2 lg:px-20 xl:px-24 bg-slate-50">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
             <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-2xl font-bold text-slate-900">SIAKAD</span>
          </div>

          <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
            Selamat Datang Kembali
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Silakan masuk menggunakan akun yang telah terdaftar.
          </p>

          <div className="mt-8">
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
                  <Label htmlFor="username" className="text-slate-700">Email atau NISN</Label>
                  <div className="mt-2">
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required
                      placeholder="Masukkan email atau NISN"
                      className="block w-full rounded-xl border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
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
                      className="block w-full rounded-xl border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Button 
                  type="submit" 
                  disabled={isPending}
                  className="flex w-full justify-center rounded-xl bg-blue-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
                >
                  {isPending ? "Sedang memverifikasi..." : "Masuk ke Sistem"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
