"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Save, Building, GraduationCap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { updateProfilJenjang } from "./actions"

const profilSchema = z.object({
  id: z.number(),
  nama: z.string(),
  singkatan: z.string(),
  npsn: z.string().optional().nullable(),
  namaKepalaMadrasah: z.string().optional().nullable(),
  nipKepalaMadrasah: z.string().optional().nullable(),
  alamat: z.string().optional().nullable(),
  telepon: z.string().optional().nullable(),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")).nullable(),
})

type ProfilType = z.infer<typeof profilSchema>

export function ProfilJenjangClient({ initialData }: { initialData: ProfilType }) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ProfilType>({
    resolver: zodResolver(profilSchema),
    defaultValues: {
      id: initialData.id,
      nama: initialData.nama || "",
      singkatan: initialData.singkatan || "",
      npsn: initialData.npsn || "",
      namaKepalaMadrasah: initialData.namaKepalaMadrasah || "",
      nipKepalaMadrasah: initialData.nipKepalaMadrasah || "",
      alamat: initialData.alamat || "",
      telepon: initialData.telepon || "",
      email: initialData.email || "",
    },
  })

  const onSubmit = async (values: ProfilType) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      if (values.npsn) formData.append("npsn", values.npsn)
      if (values.namaKepalaMadrasah) formData.append("namaKepalaMadrasah", values.namaKepalaMadrasah)
      if (values.nipKepalaMadrasah) formData.append("nipKepalaMadrasah", values.nipKepalaMadrasah)
      if (values.alamat) formData.append("alamat", values.alamat)
      if (values.telepon) formData.append("telepon", values.telepon)
      if (values.email) formData.append("email", values.email)
      
      const res = await updateProfilJenjang(formData)
      if (res.success) {
        alert("Profil jenjang berhasil disimpan!")
        window.location.reload()
      } else {
        alert(res.error)
      }
    } catch (error) {
      console.error(error)
      alert("Terjadi kesalahan!")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Profil Jenjang: {initialData.nama}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola informasi spesifik untuk institusi {initialData.singkatan}.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Note: Nama & Singkatan di-disabled karena itu diatur oleh Super Admin */}
              <FormField
                control={form.control}
                name="nama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Institusi/Jenjang</FormLabel>
                    <FormControl>
                      <Input {...field} disabled className="bg-slate-50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="singkatan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Singkatan</FormLabel>
                    <FormControl>
                      <Input {...field} disabled className="bg-slate-50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="col-span-1 md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                <h3 className="text-lg font-medium mb-4 text-slate-800">Detail Informasi Institusi</h3>
              </div>

              <FormField
                control={form.control}
                name="npsn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NPSN / NSM</FormLabel>
                    <FormControl>
                      <Input placeholder="Nomor Pokok Sekolah Nasional" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="hidden md:block"></div>

              <FormField
                control={form.control}
                name="namaKepalaMadrasah"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Kepala Sekolah/Madrasah</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan Nama Lengkap" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nipKepalaMadrasah"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIP/NIY Kepala Sekolah</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan NIP" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telepon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor Telepon Institusi</FormLabel>
                    <FormControl>
                      <Input placeholder="08xxx / (0xx) xxx" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Institusi</FormLabel>
                    <FormControl>
                      <Input placeholder="email@sekolah.com" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="alamat"
                render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>Alamat Institusi (Jika berbeda dengan pusat)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detail alamat gedung / sekolah..." 
                        className="min-h-[100px]"
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
                {isSubmitting ? "Menyimpan..." : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Simpan Profil
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
