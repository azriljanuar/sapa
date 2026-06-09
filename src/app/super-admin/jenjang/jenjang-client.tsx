"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import type { JenjangPendidikan } from "@prisma/client"
import { useForm } from "react-hook-form"
import { z } from "zod"

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { type ActionState, createJenjang, deleteJenjang, updateJenjang } from "./actions"

const emptyState: ActionState = { ok: false, message: "" }

const formSchema = z.object({
  nama: z.string().trim().min(2, "Nama jenjang wajib diisi."),
  singkatan: z.string().trim().min(1, "Singkatan wajib diisi."),
})

function JenjangFormDialog({
  mode,
  initial,
}: {
  mode: "create" | "edit"
  initial?: Pick<JenjangPendidikan, "id" | "nama" | "singkatan">
}) {
  const [open, setOpen] = React.useState(false)
  const [state, setState] = React.useState<ActionState>(emptyState)
  const [pending, startTransition] = React.useTransition()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: initial?.nama ?? "",
      singkatan: initial?.singkatan ?? "",
    },
  })

  React.useEffect(() => {
    if (!open) return
    form.reset({ nama: initial?.nama ?? "", singkatan: initial?.singkatan ?? "" })
  }, [form, initial?.nama, initial?.singkatan, open])

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const fd = new FormData()
    if (mode === "edit" && initial?.id) fd.set("id", String(initial.id))
    fd.set("nama", values.nama)
    fd.set("singkatan", values.singkatan)
    startTransition(async () => {
      const res =
        mode === "create"
          ? await createJenjang(emptyState, fd)
          : await updateJenjang(emptyState, fd)
      setState(res)

      if (res.fieldErrors) {
        for (const [key, message] of Object.entries(res.fieldErrors)) {
          if (key === "nama") form.setError("nama", { message })
          if (key === "singkatan") form.setError("singkatan", { message })
        }
      }

      if (res.ok) {
        setOpen(false)
        form.reset({ nama: "", singkatan: "" })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant={mode === "create" ? "default" : "outline"} size="sm" />}
      >
        {mode === "create" ? "Tambah Jenjang" : "Edit"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Tambah Jenjang" : "Edit Jenjang"}</DialogTitle>
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
                    <Input placeholder="Madrasah Tsanawiyah" {...field} />
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
                    <Input placeholder="MTs" {...field} />
                  </FormControl>
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

export default function JenjangClient({ jenjang }: { jenjang: JenjangPendidikan[] }) {
  const [deleteState, setDeleteState] = React.useState<ActionState>(emptyState)
  const [deletePending, startDelete] = React.useTransition()

  const onDelete = (id: number) => {
    const fd = new FormData()
    fd.set("id", String(id))
    startDelete(async () => {
      const res = await deleteJenjang(emptyState, fd)
      setDeleteState(res)
    })
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Total: {jenjang.length}</div>
        <JenjangFormDialog mode="create" />
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
              <TableHead>Singkatan</TableHead>
              <TableHead className="w-[260px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jenjang.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-sm text-muted-foreground">
                  Belum ada jenjang.
                </TableCell>
              </TableRow>
            ) : (
              jenjang.map((j) => (
                <TableRow key={j.id}>
                  <TableCell className="font-medium">{j.nama}</TableCell>
                  <TableCell>{j.singkatan}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <JenjangFormDialog
                        mode="edit"
                        initial={{ id: j.id, nama: j.nama, singkatan: j.singkatan }}
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deletePending}
                        onClick={() => onDelete(j.id)}
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
