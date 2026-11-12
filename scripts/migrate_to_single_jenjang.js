const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const parsed = new URL(process.env.DATABASE_URL);
const adapter = new PrismaMariaDb({
  host: parsed.hostname,
  port: Number(parsed.port) || 3306,
  user: decodeURIComponent(parsed.username || 'root'),
  password: decodeURIComponent(parsed.password || ''),
  database: parsed.pathname.replace(/^\//, ''),
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 Memulai Migrasi Data Single-Jenjang (Fase 1)...");

  // 1. Identitas Lembaga
  console.log("\n1. Migrasi Identitas Lembaga...");
  const jenjangMA = await prisma.jenjangPendidikan.findFirst({
    where: {
      OR: [
        { id: 2 },
        { singkatan: "MA" },
        { nama: { contains: "Aliyah" } }
      ]
    }
  });

  const profilPesantren = await prisma.profilPesantren.findFirst();

  await prisma.identitasLembaga.upsert({
    where: { id: 1 },
    update: {
      namaLembaga: jenjangMA?.nama || "Madrasah Aliyah Plus Al-Ittihaad",
      singkatan: jenjangMA?.singkatan || "MA",
      tingkatJenjang: "MA",
      sebutanSantri: "Santri",
      sebutanGuru: "Guru",
      npsn: jenjangMA?.npsn || null,
      alamat: jenjangMA?.alamat || profilPesantren?.alamatLengkap || null,
      telepon: jenjangMA?.telepon || profilPesantren?.telepon || null,
      email: jenjangMA?.email || profilPesantren?.email || null,
      website: profilPesantren?.website || null,
      logoUrl: jenjangMA?.logoUrl || profilPesantren?.logoUrl || "/uploads/logo_2_1787041914994-77974567.png",
      kopSuratUrl: jenjangMA?.kopSuratUrl || null,
      namaKepalaMadrasah: jenjangMA?.namaKepalaMadrasah || profilPesantren?.namaPimpinan || null,
      nipKepalaMadrasah: jenjangMA?.nipKepalaMadrasah || null,
      templateSKL: jenjangMA?.templateSKL || null,
      waktuMulaiAbsen: jenjangMA?.waktuMulaiAbsen || "06:00",
      waktuAkhirAbsen: jenjangMA?.waktuAkhirAbsen || "08:00",
    },
    create: {
      id: 1,
      namaLembaga: jenjangMA?.nama || "Madrasah Aliyah Plus Al-Ittihaad",
      singkatan: jenjangMA?.singkatan || "MA",
      tingkatJenjang: "MA",
      sebutanSantri: "Santri",
      sebutanGuru: "Guru",
      npsn: jenjangMA?.npsn || null,
      alamat: jenjangMA?.alamat || profilPesantren?.alamatLengkap || null,
      telepon: jenjangMA?.telepon || profilPesantren?.telepon || null,
      email: jenjangMA?.email || profilPesantren?.email || null,
      website: profilPesantren?.website || null,
      logoUrl: jenjangMA?.logoUrl || profilPesantren?.logoUrl || "/uploads/logo_2_1787041914994-77974567.png",
      kopSuratUrl: jenjangMA?.kopSuratUrl || null,
      namaKepalaMadrasah: jenjangMA?.namaKepalaMadrasah || profilPesantren?.namaPimpinan || null,
      nipKepalaMadrasah: jenjangMA?.nipKepalaMadrasah || null,
      templateSKL: jenjangMA?.templateSKL || null,
      waktuMulaiAbsen: jenjangMA?.waktuMulaiAbsen || "06:00",
      waktuAkhirAbsen: jenjangMA?.waktuAkhirAbsen || "08:00",
    }
  });
  console.log("✅ IdentitasLembaga berhasil disimpan!");

  // 2. Migrasi Data Santri dari SantriJenjang
  console.log("\n2. Migrasi Data Santri dari SantriJenjang...");
  const allSJ = await prisma.santriJenjang.findMany();
  console.log(`Ditemukan ${allSJ.length} data SantriJenjang.`);

  let updatedSantri = 0;
  for (const sj of allSJ) {
    let status = "AKTIF";
    if (sj.isAlumni) {
      status = "ALUMNI";
    } else if (sj.statusKeluar === "PINDAH_SEKOLAH") {
      status = "MUTASI";
    } else if (sj.statusKeluar) {
      status = "KELUAR";
    }

    await prisma.santri.update({
      where: { id: sj.santriId },
      data: {
        status,
        statusMukim: sj.statusMukim ?? false,
        statusKeluar: sj.statusKeluar,
        namaSekolahTujuan: sj.namaSekolahTujuan,
        tanggalPindah: sj.tanggalPindah,
        alasanPindah: sj.alasanPindah,
        tahunMasukId: sj.tahunMasukId,
        tahunLulusId: sj.tahunLulusId,
        keteranganLulus: sj.keteranganLulus,
        statusLanjutan: sj.statusLanjutan,
        namaInstansi: sj.namaInstansi,
        programStudi: sj.programStudi,
        kotaDomisiliSekarang: sj.kotaDomisiliSekarang,
        kontakWA: sj.kontakWA,
        emailAlumni: sj.email,
      }
    });
    updatedSantri++;
  }
  console.log(`✅ Berhasil menyelaraskan ${updatedSantri} santri langsung ke tabel Santri!`);

  // 3. Elevasi Admin Jenjang menjadi Super Admin
  console.log("\n3. Elevasi Role Admin...");
  const adminJenjangUsers = await prisma.user.findMany({
    where: { role: "ADMIN_JENJANG" }
  });

  for (const u of adminJenjangUsers) {
    await prisma.user.update({
      where: { id: u.id },
      data: { role: "SUPER_ADMIN" }
    });
    console.log(`User ${u.nama} (${u.email}) berhasil di-upgrade ke SUPER_ADMIN`);
  }

  console.log("\n🎉 Fase 1 Migrasi Data Selesai dengan Sukses!");
}

main()
  .catch((e) => {
    console.error("❌ Error saat migrasi:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
