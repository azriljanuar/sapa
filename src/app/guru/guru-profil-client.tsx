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
import { updateProfilGuru } from "./actions"

const profilSchema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  nip: z.string().optional().nullable(),
  nuptk: z.string().optional().nullable(),
  niPPPK: z.string().optional().nullable(),
  nik: z.string().optional().nullable(),
  tempatLahir: z.string().optional().nullable(),
  tanggalLahir: z.string().optional().nullable(),
  jenisKelamin: z.string().optional().nullable(),
  agama: z.string().optional().nullable(),
  alamatLengkap: z.string().optional().nullable(),
  noTelepon: z.string().optional().nullable(),
  pendidikanTerakhir: z.string().optional().nullable(),
  jurusan: z.string().optional().nullable(),
  statusPegawai: z.string().optional().nullable(),
  tmt: z.string().optional().nullable(),
  namaIbuKandung: z.string().optional().nullable(),
})

export function GuruProfilClient({ guru }: { guru: any }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [password, setPassword] = useState("")

  const form = useForm<z.infer<typeof profilSchema>>({
    resolver: zodResolver(profilSchema),
    defaultValues: {
      nama: guru.nama || "",
      email: guru.email || "",
      nip: guru.nip || "",
      nuptk: guru.nuptk || "",
      niPPPK: guru.niPPPK || "",
      nik: guru.nik || "",
      tempatLahir: guru.tempatLahir || "",
      tanggalLahir: guru.tanggalLahir ? new Date(guru.tanggalLahir).toISOString().split('T')[0] : "",
      jenisKelamin: guru.jenisKelamin || "",
      agama: guru.agama || "",
      alamatLengkap: guru.alamatLengkap || "",
      noTelepon: guru.noTelepon || "",
      pendidikanTerakhir: guru.pendidikanTerakhir || "",
      jurusan: guru.jurusan || "",
      statusPegawai: guru.statusPegawai || "",
      tmt: guru.tmt ? new Date(guru.tmt).toISOString().split('T')[0] : "",
      namaIbuKandung: guru.namaIbuKandung || "",
    },
  })

  const onSubmit = async (values: z.infer<typeof profilSchema>) => {
    setIsSubmitting(true)
    try {
      const res = await updateProfilGuru(values, password)
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
              name="nama"
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
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email * (Untuk Login)</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} disabled={!isEditing} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIP</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} disabled={!isEditing} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="niPPPK"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NI PPPK</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} disabled={!isEditing} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="nuptk"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NUPTK</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} disabled={!isEditing} />
                  </FormControl>
                </FormItem>
              )}
            />
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
            <FormField
              control={form.control}
              name="agama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agama</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} disabled={!isEditing} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="pendidikanTerakhir"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pendidikan Terakhir</FormLabel>
                  <FormControl>
                    <Input placeholder="S1/S2/dll" {...field} value={field.value || ""} disabled={!isEditing} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="jurusan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jurusan</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} disabled={!isEditing} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="statusPegawai"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status Pegawai</FormLabel>
                  <FormControl>
                    <Input placeholder="PNS/GTY/Honor dll" {...field} value={field.value || ""} disabled={!isEditing} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tmt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>TMT (Terhitung Mulai Tanggal)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ""} disabled={!isEditing} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="col-span-1 md:col-span-2">
              <FormField
                control={form.control}
                name="namaIbuKandung"
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
            
            <div className="col-span-1 md:col-span-2">
              <FormField
                control={form.control}
                name="alamatLengkap"
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
