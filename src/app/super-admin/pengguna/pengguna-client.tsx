"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import type { JenjangPendidikan, User } from "@prisma/client"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  type ActionState,
  createAdminJenjang,
  deleteUser,
  updateAdminJenjang,
} from "./actions"

type UserWithJenjang = User & { jenjang: JenjangPendidikan | null }
type JenjangOption = Pick<JenjangPendidikan, "id" | "nama" | "singkatan">

const emptyState: ActionState = { ok: false, message: "" }

const createSchema = z.object({
  nama: z.string().trim().min(2, "Nama wajib diisi."),
  email: z.string().trim().email("Email tidak valid."),
  password: z.string().min(6, "Password minimal 6 karakter."),
  jenjangId: z.number().int().positive("Jenjang wajib dipilih."),
})

const updateSchema = z.object({
  id: z.number().int().positive(),
  nama: z.string().trim().min(2, "Nama wajib diisi."),
  email: z.string().trim().email("Email tidak valid."),
  password: z.string().optional(),
  jenjangId: z.number().int().positive("Jenjang wajib dipilih."),
})

function RoleBadge() {
  return <Badge variant="outline">ADMIN_JENJANG</Badge>
}

function CreateUserDialog({ jenjang }: { jenjang: JenjangOption[] }) {
  const [open, setOpen] = React.useState(false)
  const [state, setState] = React.useState<ActionState>(emptyState)
  const [pending, startTransition] = React.useTransition()

  const form = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      nama: "",
      email: "",
      password: "",
      jenjangId: 0,
    },
  })

  const onSubmit = (values: z.infer<typeof createSchema>) => {
    const fd = new FormData()
    fd.set("nama", values.nama)
    fd.set("email", values.email)
    fd.set("password", values.password)
    fd.set("jenjangId", String(values.jenjangId))
    startTransition(async () => {
      const res = await createAdminJenjang(emptyState, fd)
      setState(res)

      if (res.fieldErrors) {
        for (const [key, message] of Object.entries(res.fieldErrors)) {
          if (key === "nama") form.setError("nama", { message })
          if (key === "email") form.setError("email", { message })
          if (key === "password") form.setError("password", { message })
          if (key === "jenjangId") form.setError("jenjangId", { message })
        }
      }

      if (res.ok) {
        setOpen(false)
        form.reset({ nama: "", email: "", password: "", jenjangId: 0 })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Tambah Pengguna</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah ADMIN_JENJANG</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="nama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama pengguna" {...field} />
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="admin@pesantren.id" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Minimal 6 karakter" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jenjangId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenjang</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih jenjang" />
                    </SelectTrigger>
                    <SelectContent>
                      {jenjang.map((j) => (
                        <SelectItem key={j.id} value={String(j.id)}>
                          {j.singkatan} - {j.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {state.message ? (
              <div className={state.ok ? "text-sm text-foreground" : "text-sm text-destructive"}>
                {state.message}
              </div>
            ) : null}

            <DialogFooter>
              <Button type="submit" disabled={pending}>
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function EditUserDialog({
  user,
  jenjang,
}: {
  user: UserWithJenjang
  jenjang: JenjangOption[]
}) {
  const [open, setOpen] = React.useState(false)
  const [state, setState] = React.useState<ActionState>(emptyState)
  const [pending, startTransition] = React.useTransition()

  const form = useForm<z.infer<typeof updateSchema>>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      id: user.id,
      nama: user.nama,
      email: user.email,
      password: "",
      jenjangId: user.jenjangId ?? 0,
    },
  })

  React.useEffect(() => {
    if (!open) return
    form.reset({
      id: user.id,
      nama: user.nama,
      email: user.email,
      password: "",
      jenjangId: user.jenjangId ?? 0,
    })
  }, [form, open, user.email, user.id, user.jenjangId, user.nama])

  const onSubmit = (values: z.infer<typeof updateSchema>) => {
    const fd = new FormData()
    fd.set("id", String(values.id))
    fd.set("nama", values.nama)
    fd.set("email", values.email)
    if (values.password && values.password.length > 0) fd.set("password", values.password)
    fd.set("jenjangId", String(values.jenjangId))
    startTransition(async () => {
      const res = await updateAdminJenjang(emptyState, fd)
      setState(res)

      if (res.fieldErrors) {
        for (const [key, message] of Object.entries(res.fieldErrors)) {
          if (key === "nama") form.setError("nama", { message })
          if (key === "email") form.setError("email", { message })
          if (key === "password") form.setError("password", { message })
          if (key === "jenjangId") form.setError("jenjangId", { message })
        }
      }

      if (res.ok) setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>Edit</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Pengguna</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="nama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password Baru (opsional)</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Biarkan kosong jika tidak diubah" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jenjangId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenjang</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih jenjang" />
                    </SelectTrigger>
                    <SelectContent>
                      {jenjang.map((j) => (
                        <SelectItem key={j.id} value={String(j.id)}>
                          {j.singkatan} - {j.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {state.message ? (
              <div className={state.ok ? "text-sm text-foreground" : "text-sm text-destructive"}>
                {state.message}
              </div>
            ) : null}

            <DialogFooter>
              <Button type="submit" disabled={pending}>
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default function PenggunaClient({
  users,
  jenjang,
}: {
  users: UserWithJenjang[]
  jenjang: JenjangOption[]
}) {
  const [deleteState, setDeleteState] = React.useState<ActionState>(emptyState)
  const [deletePending, startDelete] = React.useTransition()

  const onDelete = (id: number) => {
    const fd = new FormData()
    fd.set("id", String(id))
    startDelete(async () => {
      const res = await deleteUser(emptyState, fd)
      setDeleteState(res)
    })
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Total: {users.length}</div>
        <CreateUserDialog jenjang={jenjang} />
      </div>

      {deleteState.message ? (
        <div className={deleteState.ok ? "text-sm text-foreground" : "text-sm text-destructive"}>
          {deleteState.message}
        </div>
      ) : null}

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Jenjang</TableHead>
              <TableHead className="w-[260px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-sm text-muted-foreground">
                  Belum ada pengguna.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nama}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <RoleBadge />
                  </TableCell>
                  <TableCell>
                    {u.jenjang ? `${u.jenjang.singkatan} - ${u.jenjang.nama}` : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <EditUserDialog user={u} jenjang={jenjang} />
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deletePending}
                        onClick={() => onDelete(u.id)}
                      >
                        Hapus
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
