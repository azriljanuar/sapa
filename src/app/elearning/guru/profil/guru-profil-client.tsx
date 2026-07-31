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
import { updateProfilGuru, uploadFotoWajahAction } from "./actions"
import { Camera } from "lucide-react"
import { IdCardPreview } from "@/components/id-card-preview"

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

export function GuruProfilClient({ guru, templateKartu }: { guru: any, templateKartu: any }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [password, setPassword] = useState("")
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    
    setIsUploadingPhoto(true)
    const formData = new FormData()
    formData.append("file", file)
    
    try {
      const res = await uploadFotoWajahAction(formData)
      if (res.success) {
        alert("Foto profil berhasil diperbarui!")
        window.location.reload()
      } else {
        alert("Gagal mengupload foto: " + res.error)
      }
    } catch (err) {
      alert("Terjadi kesalahan saat mengupload foto.")
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      {/* Left Column: Profil & Informasi Tugas */}
      <div className="xl:col-span-1 space-y-6">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="relative group mb-4">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-sm flex items-center justify-center">
              {guru.fotoWajah ? (
                <img src={guru.fotoWajah} alt="Foto Profil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-slate-400 text-sm text-center">Belum ada foto</span>
              )}
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <Camera className="w-6 h-6 mr-1" />
              <span className="text-xs font-medium">Ubah</span>
              <input 
                type="file" 
                className="hidden" 
                accept="image/png, image/jpeg" 
                onChange={handlePhotoUpload}
                disabled={isUploadingPhoto}
              />
            </label>
          </div>
          <h2 className="text-xl font-bold text-slate-800">{guru.nama}</h2>
          <p className="text-sm text-slate-500">{guru.email}</p>
          {isUploadingPhoto && <p className="text-xs text-indigo-600 mt-2 animate-pulse">Sedang mengupload...</p>}
        </div>

        {/* Informasi Tugas */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h2 className="font-semibold text-lg text-slate-800 border-b border-slate-100 pb-2">Informasi Tugas</h2>
          <div>
            <p className="text-sm text-slate-500 font-medium mb-2">Mengajar di Jenjang:</p>
            <div className="flex flex-wrap gap-2">
              {guru.jenjangs.map((j: any) => (
                <span key={j.id} className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-md font-bold">
                  {j.nama}
                </span>
              ))}
              {guru.jenjangs.length === 0 && <span className="text-sm text-slate-400">-</span>}
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium mb-2 mt-4">Wali Kelas:</p>
            <ul className="space-y-2">
              {guru.waliKelas.map((w: any) => (
                <li key={w.id} className="text-sm font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  Kelas {w.namaKelas} <span className="text-slate-500 font-normal ml-1">({w.tahunAjaran.nama})</span>
                </li>
              ))}
              {guru.waliKelas.length === 0 && <li className="text-sm text-slate-400">Tidak menjadi wali kelas</li>}
            </ul>
          </div>
        </div>

        {/* Kartu Identitas */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
          <h2 className="font-semibold text-lg text-slate-800 w-full border-b border-slate-100 pb-2 mb-4">Kartu Identitas</h2>
          <IdCardPreview user={guru} tipe="GURU" template={templateKartu} />
        </div>
      </div>

      {/* Right Column: Biodata */}
      <div className="xl:col-span-2 space-y-6">
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-semibold text-lg text-slate-800">Biodata Pribadi</h2>
            <Button variant={isEditing ? "outline" : "default"} onClick={() => setIsEditing(!isEditing)} className="rounded-xl">
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
    </div>
    </div>
  )
}
