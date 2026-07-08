import { prisma } from "../src/lib/prisma"
import bcrypt from "bcryptjs"

async function main() {
  const password = await bcrypt.hash("password123", 10)

  // Buat Tahun Ajaran Aktif
  const ta = await prisma.tahunAjaran.upsert({
    where: { nama: "2024/2025" },
    update: {},
    create: {
      nama: "2024/2025",
      isActive: true,
    }
  })

  // Buat Jenjang SMP
  const jenjang = await prisma.jenjangPendidikan.create({
    data: {
      nama: "Sekolah Menengah Pertama",
      singkatan: "SMP"
    }
  })

  // Buat Admin Jenjang
  await prisma.user.upsert({
    where: { email: "admin.smp@pesantren.com" },
    update: {
      jenjangId: jenjang.id
    },
    create: {
      nama: "Admin SMP",
      email: "admin.smp@pesantren.com",
      password,
      role: "ADMIN_JENJANG",
      jenjangId: jenjang.id,
    }
  })

  // Buat Super Admin
  await prisma.user.upsert({
    where: { email: "super.admin@pesantren.com" },
    update: {},
    create: {
      nama: "Super Admin",
      email: "super.admin@pesantren.com",
      password,
      role: "SUPER_ADMIN",
    }
  })

  console.log("Seeding sukses:")
  console.log("- Super Admin: super.admin@pesantren.com / password123")
  console.log("- Admin SMP: admin.smp@pesantren.com / password123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
