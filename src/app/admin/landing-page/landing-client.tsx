"use client"

import { useState, useRef, useTransition } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save, Loader2, Plus, Trash2, ImageIcon } from "lucide-react"

export default function LandingPageClient({ initialData }: { initialData: any }) {
  const [isPending, startTransition] = useTransition()
  
  // Default values
  const defaultHero = { badge: "Sistem Akademik Pesantren Terpadu", title: "Digitalisasi Pesantren untuk", titleHighlight: "Masa Depan", desc: "SAPA mengintegrasikan manajemen data akademik dan pembelajaran elektronik dalam satu pintu.", btnLabel: "Masuk Sekarang", imageUrl: "/images/hero.jpg" }
  const defaultProfile = { namaPesantren: "Pesantren Al-Ittihaad", desc: "Membentuk generasi qur'ani.", tahunBerdiri: "2010", imageUrl: "/images/hero.jpg" }
  const defaultStats = [ { angka: "1.200+", label: "Santri" }, { angka: "80+", label: "Guru" } ]
  const defaultFeatures = [ { iconName: "Clipboard", title: "Absensi QR Code", desc: "Rekam kehadiran santri & guru otomatis." } ]
  const defaultContact = { alamat: "Jl. Pendidikan", telepon: "08123456789", email: "info@alittihaad.sch.id", mapsUrl: "", instagram: "", facebook: "" }
  const defaultFooter = { tagline: "Membangun peradaban Islam melalui teknologi.", copyright: "© 2026 SAPA" }

  const [heroData, setHeroData] = useState(initialData?.heroData || defaultHero)
  const [profileData, setProfileData] = useState(initialData?.profileData || defaultProfile)
  const [statsData, setStatsData] = useState<any[]>(initialData?.statsData || defaultStats)
  const [featuresData, setFeaturesData] = useState<any[]>(initialData?.featuresData || defaultFeatures)
  const [contactData, setContactData] = useState(initialData?.contactData || defaultContact)
  const [footerData, setFooterData] = useState(initialData?.footerData || defaultFooter)

  const [uploadingHero, setUploadingHero] = useState(false)
  const [uploadingProfile, setUploadingProfile] = useState(false)
  const heroFileRef = useRef<HTMLInputElement>(null)
  const profileFileRef = useRef<HTMLInputElement>(null)

  const handleUploadHero = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingHero(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", "hero")
    try {
      const res = await fetch("/api/admin/upload-asset", { method: "POST", body: formData })
      const data = await res.json()
      if (res.ok && data.url) {
        setHeroData({ ...heroData, imageUrl: data.url })
      } else alert(data.error || "Gagal upload")
    } catch (e) { alert("Error upload") }
    finally { 
      setUploadingHero(false) 
      if (heroFileRef.current) heroFileRef.current.value = ""
    }
  }

  const handleUploadProfile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingProfile(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", "profile")
    try {
      const res = await fetch("/api/admin/upload-asset", { method: "POST", body: formData })
      const data = await res.json()
      if (res.ok && data.url) {
        setProfileData({ ...profileData, imageUrl: data.url })
      } else alert(data.error || "Gagal upload")
    } catch (e) { alert("Error upload") }
    finally { 
      setUploadingProfile(false) 
      if (profileFileRef.current) profileFileRef.current.value = ""
    }
  }

  const handleSave = () => {
    startTransition(async () => {
      try {
        const payload = { heroData, profileData, statsData, featuresData, contactData, footerData }
        const res = await fetch("/api/admin/landing-page", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
        if (res.ok) alert("Perubahan berhasil disimpan!")
        else alert("Gagal menyimpan perubahan")
      } catch (e) { alert("Error menyimpan") }
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <Tabs defaultValue="hero" className="w-full">
        <div className="border-b px-4 py-2">
          <TabsList className="bg-transparent space-x-2">
            <TabsTrigger value="hero" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Hero</TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Statistik</TabsTrigger>
            <TabsTrigger value="features" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Fitur</TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Profil Pesantren</TabsTrigger>
            <TabsTrigger value="contact" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Kontak & Footer</TabsTrigger>
          </TabsList>
        </div>

        {/* HERO */}
        <TabsContent value="hero" className="p-6 m-0">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div><Label>Teks Badge (Kecil di Atas)</Label><Input value={heroData.badge} onChange={e => setHeroData({...heroData, badge: e.target.value})} /></div>
              <div><Label>Judul Utama</Label><Input value={heroData.title} onChange={e => setHeroData({...heroData, title: e.target.value})} /></div>
              <div><Label>Judul Highlight (Warna Emerald)</Label><Input value={heroData.titleHighlight} onChange={e => setHeroData({...heroData, titleHighlight: e.target.value})} /></div>
              <div><Label>Deskripsi</Label><Textarea value={heroData.desc} onChange={e => setHeroData({...heroData, desc: e.target.value})} rows={3} /></div>
              <div><Label>Label Tombol</Label><Input value={heroData.btnLabel} onChange={e => setHeroData({...heroData, btnLabel: e.target.value})} /></div>
            </div>
            <div className="space-y-4">
              <Label>Gambar Hero</Label>
              <div className="border-2 border-dashed rounded-xl p-4 text-center">
                {heroData.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={heroData.imageUrl} alt="Hero" className="w-full h-48 object-cover rounded-lg mb-4" />
                ) : (
                  <div className="h-48 bg-slate-100 flex items-center justify-center rounded-lg mb-4 text-slate-400"><ImageIcon /></div>
                )}
                <input 
                  type="file" 
                  ref={heroFileRef} 
                  className="hidden" 
                  accept="image/png, image/jpeg, image/jpg, image/webp" 
                  onChange={handleUploadHero} 
                />
                <Button variant="outline" onClick={() => heroFileRef.current?.click()} disabled={uploadingHero}>
                  {uploadingHero ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Ganti Gambar"}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* STATS */}
        <TabsContent value="stats" className="p-6 m-0 space-y-4">
          <Button variant="outline" onClick={() => setStatsData([...statsData, { angka: "0", label: "Baru" }])}><Plus className="h-4 w-4 mr-2"/> Tambah Statistik</Button>
          <div className="grid gap-3">
            {statsData.map((stat, i) => (
              <div key={i} className="flex gap-4 items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex-1"><Label className="text-xs text-slate-500">Angka</Label><Input value={stat.angka} onChange={e => { const n = [...statsData]; n[i].angka = e.target.value; setStatsData(n) }} /></div>
                <div className="flex-1"><Label className="text-xs text-slate-500">Label</Label><Input value={stat.label} onChange={e => { const n = [...statsData]; n[i].label = e.target.value; setStatsData(n) }} /></div>
                <Button variant="ghost" className="text-red-500 mt-5" onClick={() => setStatsData(statsData.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* FEATURES */}
        <TabsContent value="features" className="p-6 m-0 space-y-4">
          <Button variant="outline" onClick={() => setFeaturesData([...featuresData, { iconName: "Star", title: "Fitur Baru", desc: "Deskripsi fitur" }])}><Plus className="h-4 w-4 mr-2"/> Tambah Fitur</Button>
          <div className="grid gap-3">
            {featuresData.map((feat, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div><Label className="text-xs text-slate-500">Ikon (Lucide)</Label><Input value={feat.iconName} onChange={e => { const n = [...featuresData]; n[i].iconName = e.target.value; setFeaturesData(n) }} placeholder="Misal: Clipboard" /></div>
                <div><Label className="text-xs text-slate-500">Judul</Label><Input value={feat.title} onChange={e => { const n = [...featuresData]; n[i].title = e.target.value; setFeaturesData(n) }} /></div>
                <div className="md:col-span-2 flex gap-2">
                  <div className="flex-1"><Label className="text-xs text-slate-500">Deskripsi</Label><Textarea value={feat.desc} onChange={e => { const n = [...featuresData]; n[i].desc = e.target.value; setFeaturesData(n) }} rows={2} /></div>
                  <Button variant="ghost" className="text-red-500 mt-5 shrink-0" onClick={() => setFeaturesData(featuresData.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* PROFILE */}
        <TabsContent value="profile" className="p-6 m-0 grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div><Label>Nama Pesantren</Label><Input value={profileData.namaPesantren} onChange={e => setProfileData({...profileData, namaPesantren: e.target.value})} /></div>
              <div><Label>Tahun Berdiri</Label><Input value={profileData.tahunBerdiri} onChange={e => setProfileData({...profileData, tahunBerdiri: e.target.value})} /></div>
              <div><Label>Deskripsi / Visi Misi</Label><Textarea value={profileData.desc} onChange={e => setProfileData({...profileData, desc: e.target.value})} rows={5} /></div>
            </div>
            <div className="space-y-4">
              <Label>Foto Pesantren (Opsional)</Label>
              <div className="border-2 border-dashed rounded-xl p-4 text-center">
                {profileData.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profileData.imageUrl} alt="Profil Pesantren" className="w-full h-48 object-cover rounded-lg mb-4" />
                ) : (
                  <div className="h-48 bg-slate-100 flex items-center justify-center rounded-lg mb-4 text-slate-400"><ImageIcon /></div>
                )}
                <div className="flex gap-2">
                  <Input placeholder="URL Foto..." value={profileData.imageUrl} onChange={e => setProfileData({...profileData, imageUrl: e.target.value})} />
                  <input 
                    type="file" 
                    ref={profileFileRef} 
                    className="hidden" 
                    accept="image/png, image/jpeg, image/jpg, image/webp" 
                    onChange={handleUploadProfile} 
                  />
                  <Button variant="outline" onClick={() => profileFileRef.current?.click()} disabled={uploadingProfile}>
                    {uploadingProfile ? <Loader2 className="animate-spin h-4 w-4" /> : "Upload"}
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-2">Upload file foto langsung atau paste URL gambar</p>
              </div>
            </div>
        </TabsContent>

        {/* CONTACT & FOOTER */}
        <TabsContent value="contact" className="p-6 m-0 grid md:grid-cols-2 gap-8">
           <div className="space-y-4">
             <h3 className="font-bold border-b pb-2">Info Kontak</h3>
              <div><Label>Alamat Lengkap</Label><Textarea value={contactData.alamat} onChange={e => setContactData({...contactData, alamat: e.target.value})} rows={2} /></div>
              <div><Label>Telepon / WhatsApp</Label><Input value={contactData.telepon} onChange={e => setContactData({...contactData, telepon: e.target.value})} /></div>
              <div><Label>Email</Label><Input type="email" value={contactData.email} onChange={e => setContactData({...contactData, email: e.target.value})} /></div>
           </div>
           <div className="space-y-4">
             <h3 className="font-bold border-b pb-2">Footer & Sosial</h3>
              <div><Label>URL Google Maps (Embed)</Label><Input value={contactData.mapsUrl} onChange={e => setContactData({...contactData, mapsUrl: e.target.value})} /></div>
              <div><Label>Tagline Footer</Label><Input value={footerData.tagline} onChange={e => setFooterData({...footerData, tagline: e.target.value})} /></div>
              <div><Label>Teks Copyright</Label><Input value={footerData.copyright} onChange={e => setFooterData({...footerData, copyright: e.target.value})} /></div>
           </div>
        </TabsContent>

        <div className="p-4 border-t bg-slate-50 flex justify-end">
          <Button onClick={handleSave} disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700">
            {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Simpan Perubahan
          </Button>
        </div>
      </Tabs>
    </div>
  )
}
