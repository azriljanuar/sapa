"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Pencil, Trash2, Eye } from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createKelas, updateKelas, deleteKelas } from "./actions"

const kelasSchema = z.object({
  id: z.number().optional(),
  namaKelas: z.string().min(1, "Nama kelas wajib diisi"),
  waliKelasId: z.number().optional(),
})

type KelasType = {
  id: number
  namaKelas: string
  waliKelas: {
    id: number
    nama: string
  } | null
  _count: {
    anggota: number
  }
}

type GuruType = {
  id: number
  nama: string
}

export function KelasClient({ 
  initialData, 
  guruList 
}: { 
  initialData: KelasType[]
  guruList: GuruType[] 
}) {
  const [data, setData] = useState<KelasType[]>(initialData)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingData, setEditingData] = useState<KelasType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof kelasSchema>>({
    resolver: zodResolver(kelasSchema),
    defaultValues: {
      namaKelas: "",
      waliKelasId: 0,
    },
  })

  const handleOpenDialog = (item?: KelasType) => {
    if (item) {
      setEditingData(item)
      form.reset({
        id: item.id,
        namaKelas: item.namaKelas,
        waliKelasId: item.waliKelas?.id || 0,
      })
    } else {
      setEditingData(null)
      form.reset({
        namaKelas: "",
        waliKelasId: 0,
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingData(null)
    form.reset()
  }

  const onSubmit = async (values: z.infer<typeof kelasSchema>) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("namaKelas", values.namaKelas)
      formData.append("waliKelasId", (values.waliKelasId || 0).toString())
      
      let res
      if (editingData && values.id) {
        formData.append("id", values.id.toString())
        res = await updateKelas(formData)
        if (res.success) {
          const guruSelected = guruList.find(g => g.id === values.waliKelasId)
          setData(data.map((d) => (d.id === values.id ? { 
            ...d, 
            namaKelas: values.namaKelas,
            waliKelas: values.waliKelasId ? { id: values.waliKelasId, nama: guruSelected?.nama || "" } : null
          } : d)))
          handleCloseDialog()
        }
      } else {
        res = await createKelas(formData)
        if (res.success) {
          window.location.reload()
        }
      }
      
      if (res?.error) {
        alert(res.error)
      }
    } catch (error) {
      console.error(error)
      alert("Terjadi kesalahan!")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus kelas ini? Semua santri di dalamnya akan terhapus dari kelas (namun data santrinya tetap ada).")) return
    const res = await deleteKelas(id)
    if (res.success) {
      setData(data.filter((d) => d.id !== id))
    } else {
      alert(res.error || "Gagal menghapus data")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Kelas Formal</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola wadah kelas dan penugasan wali kelas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Buat Kelas
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">No</TableHead>
              <TableHead>Nama Kelas</TableHead>
              <TableHead>Wali Kelas</TableHead>
              <TableHead className="text-center">Jml Anggota</TableHead>
              <TableHead className="w-[160px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{item.namaKelas}</TableCell>
                  <TableCell>{item.waliKelas?.nama || "Belum Diatur"}</TableCell>
                  <TableCell className="text-center">{item._count.anggota}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link 
                        href={`/admin-jenjang/kelas-formal/${item.id}`}
                        className={cn(buttonVariants({ variant: "outline", size: "icon" }), "h-8 w-8")}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Detail</span>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenDialog(item)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Belum ada kelas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingData ? "Edit Kelas" : "Buat Kelas Baru"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="namaKelas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Kelas</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: 7A, 8B" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="waliKelasId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wali Kelas</FormLabel>
                    <Select 
                      onValueChange={(val) => field.onChange(Number(val))} 
                      value={field.value ? String(field.value) : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Guru..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {guruList.map(guru => (
                          <SelectItem key={guru.id} value={guru.id.toString()}>
                            {guru.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" type="button" onClick={handleCloseDialog}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
