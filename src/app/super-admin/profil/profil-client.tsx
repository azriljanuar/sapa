"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Save, Building } from "lucide-react"

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
import { updateProfilPesantren } from "./actions"

const profilSchema = z.object({
  id: z.number(),
  namaPesantren: z.string().min(3, "Nama Pesantren minimal 3 karakter"),
  nspp: z.string().optional().nullable(),
  alamatLengkap: z.string().optional().nullable(),
  telepon: z.string().optional().nullable(),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")).nullable(),
  website: z.string().url("Format URL tidak valid").optional().or(z.literal("")).nullable(),
  namaPimpinan: z.string().optional().nullable(),
})

type ProfilType = z.infer<typeof profilSchema>

export function ProfilPesantrenClient({ initialData }: { initialData: ProfilType }) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ProfilType>({
    resolver: zodResolver(profilSchema),
    defaultValues: {
      id: initialData.id,
      namaPesantren: initialData.namaPesantren || "",
      nspp: initialData.nspp || "",
      alamatLengkap: initialData.alamatLengkap || "",
      telepon: initialData.telepon || "",
      email: initialData.email || "",
      website: initialData.website || "",
      namaPimpinan: initialData.namaPimpinan || "",
    },
  })

  const onSubmit = async (values: ProfilType) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("id", values.id.toString())
      formData.append("namaPesantren", values.namaPesantren)
      if (values.nspp) formData.append("nspp", values.nspp)
      if (values.alamatLengkap) formData.append("alamatLengkap", values.alamatLengkap)
      if (values.telepon) formData.append("telepon", values.telepon)
      if (values.email) formData.append("email", values.email)
      if (values.website) formData.append("website", values.website)
      if (values.namaPimpinan) formData.append("namaPimpinan", values.namaPimpinan)
      
      const res = await updateProfilPesantren(formData)
      if (res.success) {
        alert("Profil pesantren berhasil disimpan!")
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
          <Building className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Profil Pesantren</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola informasi utama dan identitas pondok pesantren.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="namaPesantren"
                render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>Nama Pesantren *</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Pondok Pesantren Darussalam" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nspp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NSPP (Nomor Statistik Pondok Pesantren)</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan NSPP" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="namaPimpinan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Pimpinan / Kyai</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan Nama Pimpinan" {...field} value={field.value || ""} />
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
                    <FormLabel>Nomor Telepon</FormLabel>
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
                    <FormLabel>Email Resmi</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@pesantren.com" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>Website (URL)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.pesantren.com" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="alamatLengkap"
                render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>Alamat Lengkap</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Masukkan alamat lengkap beserta jalan, RT/RW, dan Kodepos..." 
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
