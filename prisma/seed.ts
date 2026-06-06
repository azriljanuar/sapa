import { PrismaClient } from "../src/generated/prisma"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

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

  console.log("Seeding sukses: admin.smp@pesantren.com / password123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
