"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Settings, User, Image as ImageIcon, KeyRound, Upload, Trash2, Save, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import Image from "next/image"
import { updateAccountProfile, updatePassword, uploadBrandingAsset } from "./actions"

const profileSchema = z.object({
  nama: z.string().min(2, "Nama terlalu pendek"),
  email: z.string().email("Format email tidak valid"),
})

const passwordSchema = z.object({
  oldPassword: z.string().min(1, "Password lama wajib diisi"),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
  confirmPassword: z.string().min(6, "Konfirmasi password wajib diisi"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Password baru dan konfirmasi tidak cocok",
  path: ["confirmPassword"],
})

export function SettingsClient({ user, jenjang }: { user: any, jenjang: any }) {
  const [activeTab, setActiveTab] = useState("branding")
  
  // States for branding
  const [logoUploading, setLogoUploading] = useState(false)
  const [iconUploading, setIconUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState(jenjang.logoUrl)
  const [iconPreview, setIconPreview] = useState(jenjang.iconUrl)

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { nama: user.nama, email: user.email },
  })

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
  })

  async function onProfileSubmit(values: any) {
    const res = await updateAccountProfile(values)
    if (res.success) {
      alert("Profil akun berhasil diperbarui!")
      window.location.reload()
    } else {
      alert(res.error)
    }
  }

  async function onPasswordSubmit(values: any) {
    const res = await updatePassword(values)
    if (res.success) {
      alert("Password berhasil diubah!")
      passwordForm.reset()
    } else {
      alert(res.error)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "icon") {
    const file = e.target.files?.[0]
    if (!file) return

    if (type === "logo") setLogoUploading(true)
    else setIconUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", type)
      
      const res = await uploadBrandingAsset(formData)
      if (res.success) {
        if (type === "logo") setLogoPreview(res.url)
        else setIconPreview(res.url)
        alert(`${type === "logo" ? "Logo Utama" : "Icon Favicon"} berhasil diupload! Refresh halaman untuk melihat perubahan.`)
      } else {
        alert(res.error)
      }
    } catch (err) {
      alert("Terjadi kesalahan saat mengupload gambar.")
    } finally {
      if (type === "logo") setLogoUploading(false)
      else setIconUploading(false)
      
      // Reset file input
      e.target.value = ""
    }
  }

  return (
    <div className="space-y-6 max-w-4xl pb-10">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Account Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola branding jenjang dan keamanan akun admin Anda.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="branding">Branding & Tampilan</TabsTrigger>
          <TabsTrigger value="account">Akun Saya</TabsTrigger>
        </TabsList>
        
        <TabsContent value="branding" className="mt-6 space-y-8">
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-indigo-500" />
              Logo Utama ({jenjang.singkatan})
            </h3>
            <p className="text-sm text-slate-500 mb-6 max-w-xl">
              Logo ini akan muncul di sidebar aplikasi untuk seluruh user (Admin, Guru, Santri) yang berada di jenjang {jenjang.nama}. Gunakan format PNG transparan untuk hasil terbaik.
            </p>
            
            <div className="flex items-start gap-8">
              <div className="w-32 h-32 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                {logoUploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                ) : logoPreview ? (
                  <Image src={logoPreview} alt="Logo Utama" width={128} height={128} className="w-full h-full object-contain p-2" />
                ) : (
                  <ImageIcon className="w-10 h-10 text-slate-300" />
                )}
              </div>
              
              <div className="space-y-3">
                <div className="relative">
                  <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, "logo")} disabled={logoUploading} />
                  <label htmlFor="logo-upload" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 cursor-pointer shadow-sm gap-2">
                    {logoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Upload Logo Baru
                  </label>
                </div>
                <p className="text-xs text-slate-400">Direkomendasikan: Rasio 1:1, max 2MB.</p>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-pink-500" />
              Icon Website (Favicon)
            </h3>
            <p className="text-sm text-slate-500 mb-6 max-w-xl">
              Icon kecil yang muncul di tab browser.
            </p>
            
            <div className="flex items-start gap-8">
              <div className="w-16 h-16 bg-slate-100 rounded-xl border border-slate-300 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                {iconUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                ) : iconPreview ? (
                  <Image src={iconPreview} alt="Favicon" width={64} height={64} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-300" />
                )}
              </div>
              
              <div className="space-y-3">
                <div className="relative">
                  <input type="file" id="icon-upload" className="hidden" accept="image/png, image/x-icon, image/jpeg" onChange={(e) => handleUpload(e, "icon")} disabled={iconUploading} />
                  <label htmlFor="icon-upload" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-white border border-input hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer shadow-sm gap-2">
                    {iconUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Upload Icon Baru
                  </label>
                </div>
                <p className="text-xs text-slate-400">Direkomendasikan: Persegi presisi (mis. 512x512px).</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="account" className="mt-6 space-y-8">
          <div className="bg-white border rounded-xl p-6 shadow-sm max-w-2xl">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              Informasi Profil
            </h3>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="nama"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap Admin</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email / Username Login</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={profileForm.formState.isSubmitting} className="mt-2">
                  {profileForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Simpan Perubahan
                </Button>
              </form>
            </Form>
          </div>

          <div className="bg-white border border-red-100 rounded-xl p-6 shadow-sm max-w-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <KeyRound className="w-32 h-32" />
            </div>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
              <KeyRound className="w-5 h-5 text-amber-500" />
              Keamanan Password
            </h3>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 relative z-10">
                <FormField
                  control={passwordForm.control}
                  name="oldPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password Saat Ini</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password Baru</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Konfirmasi Password Baru</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" variant="destructive" disabled={passwordForm.formState.isSubmitting} className="mt-2">
                  {passwordForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Update Password
                </Button>
              </form>
            </Form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
