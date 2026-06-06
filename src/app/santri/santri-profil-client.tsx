"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { updateProfilSantri } from "./actions"

const profilSchema = z.object({
  namaLengkap: z.string().min(2, "Nama minimal 2 karakter"),
  nik: z.string().optional().nullable(),
  tempatLahir: z.string().optional().nullable(),
  tanggalLahir: z.string().optional().nullable(),
  jenisKelamin: z.string().optional().nullable(),
  alamat: z.string().optional().nullable(),
  noTelepon: z.string().optional().nullable(),
  kebutuhanKhusus: z.string().optional().nullable(),
  disabilitas: z.string().optional().nullable(),
  noKipPip: z.string().optional().nullable(),
  namaAyah: z.string().optional().nullable(),
  namaIbu: z.string().optional().nullable(),
  riwayatKesehatan: z.string().optional().nullable(),
})

export function SantriProfilClient({ santri, santriIds }: { santri: any, santriIds: number[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [password, setPassword] = useState("")

  const form = useForm<z.infer<typeof profilSchema>>({
    resolver: zodResolver(profilSchema),
    defaultValues: {
      namaLengkap: santri.namaLengkap || "",
      nik: santri.nik || "",
      tempatLahir: santri.tempatLahir || "",
      tanggalLahir: santri.tanggalLahir ? new Date(santri.tanggalLahir).toISOString().split('T')[0] : "",
      jenisKelamin: santri.jenisKelamin || "",
      alamat: santri.alamat || "",
      noTelepon: santri.noTelepon || "",
      kebutuhanKhusus: santri.kebutuhanKhusus || "",
      disabilitas: santri.disabilitas || "",
      noKipPip: santri.noKipPip || "",
      namaAyah: santri.namaAyah || "",
      namaIbu: santri.namaIbu || "",
      riwayatKesehatan: santri.riwayatKesehatan || "",
    },
  })

  // Hitung umur secara otomatis
  const watchTanggalLahir = form.watch("tanggalLahir")
  let umur = "-"
  if (watchTanggalLahir) {
    const today = new Date()
    const birthDate = new Date(watchTanggalLahir)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    if (age >= 0) {
      umur = `${age} Tahun`
    }
  }

  const onSubmit = async (values: z.infer<typeof profilSchema>) => {
    setIsSubmitting(true)
    try {
      const res = await updateProfilSantri(santriIds, values, password)
      if (res.success) {
        alert("Profil berhasil diperbarui.")
        setIsEditing(false)
        setPassword("")
        window.location.reload()
      } else {
        alert(res.error)
      }
    } catch (error) {
      alert("Terjadi kesalahan saat memperbarui profil.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-semibold text-lg">Biodata Pribadi</h2>
        <Button variant={isEditing ? "outline" : "default"} onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? "Batal Edit" : "Edit Profil"}
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="namaLengkap"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap *</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={!isEditing} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="col-span-1">
              <FormItem>
                <FormLabel>NISN (Tidak dapat diubah)</FormLabel>
                <FormControl>
                  <Input value={santri.nisn} disabled className="bg-slate-50" />
                </FormControl>
              </FormItem>
            </div>
            
            <FormField
              control={form.control}
              name="nik"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIK</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} disabled={!isEditing} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="jenisKelamin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis Kelamin</FormLabel>
                  <FormControl>
                    <Input placeholder="Laki-laki / Perempuan" {...field} value={field.value || ""} disabled={!isEditing} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tempatLahir"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tempat Lahir</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} disabled={!isEditing} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tanggalLahir"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Lahir</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ""} disabled={!isEditing} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="col-span-1">
              <FormItem>
                <FormLabel>Umur</FormLabel>
                <FormControl>
                  <Input value={umur} disabled className="bg-slate-50" />
                </FormControl>
              </FormItem>
            </div>
            
            <FormField
              control={form.control}
              name="noTelepon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>No Telepon</FormLabel>
                  <FormControl>
                    <Input placeholder="08xxx" {...field} value={field.value || ""} disabled={!isEditing} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="col-span-1 md:col-span-2">
              <FormField
                control={form.control}
                name="alamat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alamat Lengkap</FormLabel>
                    <FormControl>
                      <Textarea className="resize-none" {...field} value={field.value || ""} disabled={!isEditing} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="kebutuhanKhusus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kebutuhan Khusus</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} disabled={!isEditing} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="disabilitas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Disabilitas</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} disabled={!isEditing} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="noKipPip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>No KIP / PIP</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} disabled={!isEditing} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="riwayatKesehatan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Riwayat Kesehatan (Alergi, dll)</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} disabled={!isEditing} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              <FormField
                control={form.control}
                name="namaAyah"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Ayah Kandung</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} disabled={!isEditing} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="namaIbu"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Ibu Kandung</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} disabled={!isEditing} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {isEditing && (
              <div className="col-span-1 md:col-span-2 mt-4 pt-4 border-t border-slate-100">
                <FormItem>
                  <FormLabel>Password Baru (Opsional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Isi jika ingin mengubah password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)} 
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">Biarkan kosong jika tidak ingin merubah password.</p>
                </FormItem>
              </div>
            )}
          </div>
          
          {isEditing && (
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  )
}
