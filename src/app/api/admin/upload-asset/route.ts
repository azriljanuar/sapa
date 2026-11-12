import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import path from "path";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { processAndSaveWebP } from "@/lib/image-processor";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN_JENJANG" && session.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const jenjangId = session.jenjangId || 2;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const rawType = formData.get("type") as string | null;
    const type = rawType?.trim() || "landing"; // Fallback ke landing jika tidak disertakan

    if (!file) {
      return NextResponse.json({ success: false, error: "Tidak ada file yang diunggah" }, { status: 400 });
    }

    // Validasi tipe file gambar yang didukung
    const validMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Format file harus JPG, PNG, atau WebP" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Tentukan subfolder upload
    let subfolder = "general";
    if (type === "logoSekolah" || type === "kopSurat") {
      subfolder = "jenjang";
    } else if (type === "hero" || type === "landing" || type === "profile") {
      subfolder = "landing";
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", subfolder);
    const uniqueId = crypto.randomBytes(6).toString("hex");
    const baseName = `${type}_${jenjangId}_${Date.now()}_${uniqueId}`;

    // Otomatis kompresi dan konversi ke WebP
    const { fileUrl } = await processAndSaveWebP({
      input: buffer,
      targetDir: uploadDir,
      baseName,
      maxWidth: type === "hero" ? 1920 : 1200,
      quality: 82,
    });

    // Jika tipe adalah logoSekolah atau kopSurat, perbarui ke tabel IdentitasLembaga & Jenjang
    if (type === "logoSekolah" || type === "kopSurat") {
      const updateData: Record<string, string> = {};
      if (type === "logoSekolah") {
        updateData.logoUrl = fileUrl;
      } else {
        updateData.kopSuratUrl = fileUrl;
      }

      await prisma.identitasLembaga.upsert({
        where: { id: 1 },
        update: updateData,
        create: { id: 1, ...updateData },
      });

      try {
        await prisma.jenjangPendidikan.update({
          where: { id: jenjangId },
          data: updateData,
        });
      } catch (e) {
        // Ignore if jenjang table is removed
      }
    }

    return NextResponse.json({
      success: true,
      message: "Berhasil mengunggah aset",
      url: fileUrl,
    });
  } catch (error: any) {
    console.error("Upload asset error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Terjadi kesalahan server saat upload" },
      { status: 500 }
    );
  }
}
