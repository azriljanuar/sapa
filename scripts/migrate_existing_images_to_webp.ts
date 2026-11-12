import fs from "fs/promises";
import path from "path";
import prisma from "../src/lib/prisma";
import { convertToWebPBuffer } from "../src/lib/image-processor";

async function main() {
  console.log("=== MEMULAI MIGRASI GAMBAR KE WEBP ===");

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const processedFiles: { oldPath: string; newPath: string; oldSize: number; newSize: number; oldUrl: string; newUrl: string }[] = [];

  async function scanDirectory(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await scanDirectory(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (ext === ".png" || ext === ".jpg" || ext === ".jpeg") {
          const stats = await fs.stat(fullPath);
          const oldBuffer = await fs.readFile(fullPath);

          const newFileName = entry.name.replace(/\.[^/.]+$/, ".webp");
          const newPath = path.join(dir, newFileName);

          console.log(`Mengonversi: ${entry.name} (${(stats.size / 1024).toFixed(1)} KB)...`);
          const webpBuffer = await convertToWebPBuffer(oldBuffer, { quality: 85 });
          await fs.writeFile(newPath, webpBuffer);
          const newStats = await fs.stat(newPath);

          // Buat relative URL
          const relDir = path.relative(path.join(process.cwd(), "public"), dir).replace(/\\/g, "/");
          const oldUrl = `/${relDir}/${entry.name}`;
          const newUrl = `/${relDir}/${newFileName}`;

          processedFiles.push({
            oldPath: fullPath,
            newPath,
            oldSize: stats.size,
            newSize: newStats.size,
            oldUrl,
            newUrl,
          });

          // Hapus file lama jika path berbeda
          if (fullPath !== newPath) {
            await fs.unlink(fullPath);
            console.log(`  -> Berhasil dikonversi ke ${newFileName} (${(newStats.size / 1024).toFixed(1)} KB). File lama dihapus.`);
          }
        }
      }
    }
  }

  await scanDirectory(uploadsDir);

  console.log(`\nMemperbarui referensi di Database (${processedFiles.length} file)...`);

  for (const item of processedFiles) {
    // 1. IdentitasLembaga
    await prisma.identitasLembaga.updateMany({
      where: { logoUrl: item.oldUrl },
      data: { logoUrl: item.newUrl },
    });
    await prisma.identitasLembaga.updateMany({
      where: { iconUrl: item.oldUrl },
      data: { iconUrl: item.newUrl },
    });
    await prisma.identitasLembaga.updateMany({
      where: { kopSuratUrl: item.oldUrl },
      data: { kopSuratUrl: item.newUrl },
    });

    // 2. JenjangPendidikan
    try {
      await prisma.jenjangPendidikan.updateMany({
        where: { logoUrl: item.oldUrl },
        data: { logoUrl: item.newUrl },
      });
      await prisma.jenjangPendidikan.updateMany({
        where: { iconUrl: item.oldUrl },
        data: { iconUrl: item.newUrl },
      });
      await prisma.jenjangPendidikan.updateMany({
        where: { kopSuratUrl: item.oldUrl },
        data: { kopSuratUrl: item.newUrl },
      });
    } catch (e) {
      // Ignore if table/fields don't exist
    }

    // 3. TemplateKartu
    await prisma.templateKartu.updateMany({
      where: { frontUrl: item.oldUrl },
      data: { frontUrl: item.newUrl },
    });
    await prisma.templateKartu.updateMany({
      where: { backUrl: item.oldUrl },
      data: { backUrl: item.newUrl },
    });

    // 4. Santri
    await prisma.santri.updateMany({
      where: { fotoWajah: item.oldUrl },
      data: { fotoWajah: item.newUrl },
    });

    // 5. Guru
    await prisma.guru.updateMany({
      where: { fotoWajah: item.oldUrl },
      data: { fotoWajah: item.newUrl },
    });

    // 6. LandingPageContent
    try {
      const landing = await prisma.landingPageContent.findFirst();
      if (landing) {
        let changed = false;
        let heroData = (landing.heroData as any) || {};
        let profileData = (landing.profileData as any) || {};

        if (heroData.imageUrl === item.oldUrl) {
          heroData.imageUrl = item.newUrl;
          changed = true;
        }
        if (profileData.imageUrl === item.oldUrl) {
          profileData.imageUrl = item.newUrl;
          changed = true;
        }

        if (changed) {
          await prisma.landingPageContent.update({
            where: { id: landing.id },
            data: { heroData, profileData },
          });
        }
      }
    } catch (e) {
      // Ignore
    }
  }

  const totalOldBytes = processedFiles.reduce((acc, f) => acc + f.oldSize, 0);
  const totalNewBytes = processedFiles.reduce((acc, f) => acc + f.newSize, 0);
  const savedBytes = totalOldBytes - totalNewBytes;
  const savedPercent = totalOldBytes > 0 ? ((savedBytes / totalOldBytes) * 100).toFixed(1) : "0";

  console.log("\n=== HASIL MIGRASI KE WEBP ===");
  console.log(`Total File Diproses   : ${processedFiles.length}`);
  console.log(`Ukuran Awal           : ${(totalOldBytes / 1024).toFixed(1)} KB (${(totalOldBytes / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`Ukuran Setelah WebP   : ${(totalNewBytes / 1024).toFixed(1)} KB (${(totalNewBytes / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`Penghematan Storage   : ${(savedBytes / 1024).toFixed(1)} KB (${(savedBytes / (1024 * 1024)).toFixed(2)} MB) atau berkurang ~${savedPercent}%!`);
  console.log("==============================\n");

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Gagal migrasi:", err);
  process.exit(1);
});
