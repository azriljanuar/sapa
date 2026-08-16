import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN_JENJANG") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!session.jenjangId) {
      return NextResponse.json({ success: false, error: "Jenjang ID not found" }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null; // "logoSekolah" or "kopSurat"

    if (!file) {
      return NextResponse.json({ success: false, error: "Tidak ada file yang diunggah" }, { status: 400 });
    }

    if (type !== "logoSekolah" && type !== "kopSurat") {
      return NextResponse.json({ success: false, error: "Tipe aset tidak valid" }, { status: 400 });
    }

    // Validate file type
    const validMimeTypes = ["image/jpeg", "image/png"];
    if (!validMimeTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: "Format file harus JPG atau PNG" }, { status: 400 });
    }

    // Process file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const ext = path.extname(file.name) || (file.type === "image/png" ? ".png" : ".jpg");
    const uniqueId = crypto.randomBytes(8).toString("hex");
    const fileName = `${type}_${session.jenjangId}_${uniqueId}${ext}`;
    
    // Save to public/uploads/jenjang/
    const uploadDir = path.join(process.cwd(), "public", "uploads", "jenjang");
    
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // Ignore directory exists error
    }

    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/jenjang/${fileName}`;

    // Update database
    const updateData: any = {};
    if (type === "logoSekolah") {
      updateData.logoUrl = publicUrl;
    } else {
      updateData.kopSuratUrl = publicUrl;
    }

    await prisma.jenjangPendidikan.update({
      where: { id: session.jenjangId },
      data: updateData
    });

    return NextResponse.json({ 
      success: true, 
      message: "Berhasil mengunggah aset", 
      url: publicUrl 
    });

  } catch (error: any) {
    console.error("Upload asset error:", error);
    return NextResponse.json({ success: false, error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}
