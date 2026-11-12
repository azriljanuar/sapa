import sharp from "sharp";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export interface ImageProcessingOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * Mengonversi buffer gambar (JPEG, PNG, WebP, GIF, TIFF, dll) ke format WebP teroptimasi.
 * Otomatis memperbaiki orientasi EXIF (rotasi kamera ponsel) dan mengompres ukuran file.
 */
export async function convertToWebPBuffer(
  input: Buffer | Uint8Array,
  options: ImageProcessingOptions = {}
): Promise<Buffer> {
  const { quality = 82, maxWidth, maxHeight } = options;

  let pipeline = sharp(input).rotate(); // Otomatis rotasi sesuai EXIF

  if (maxWidth || maxHeight) {
    pipeline = pipeline.resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  return pipeline
    .webp({
      quality,
      effort: 4, // Keseimbangan optimal antara kecepatan kompresi dan ukuran file
    })
    .toBuffer();
}

export interface SaveWebPOptions extends ImageProcessingOptions {
  input: Buffer | Uint8Array;
  targetDir: string;
  baseName: string; // Nama dasar tanpa ekstensi, atau dengan ekstensi lama
}

/**
 * Memproses gambar dan menyimpannya langsung sebagai file .webp pada target direktori.
 */
export async function processAndSaveWebP(options: SaveWebPOptions): Promise<{
  fileName: string;
  filePath: string;
  fileUrl: string;
  buffer: Buffer;
}> {
  const { input, targetDir, baseName, ...processOptions } = options;

  // Pastikan folder tujuan ada
  await mkdir(targetDir, { recursive: true });

  // Hilangkan ekstensi lama jika ada
  const cleanName = baseName.replace(/\.[^/.]+$/, "");
  const fileName = `${cleanName}.webp`;
  const filePath = path.join(targetDir, fileName);

  // Konversi ke WebP
  const webpBuffer = await convertToWebPBuffer(input, processOptions);

  // Tulis file
  await writeFile(filePath, webpBuffer);

  // Buat relative URL untuk web (mengarah ke /uploads/...)
  const publicUploadsIndex = targetDir.replace(/\\/g, "/").indexOf("public/uploads");
  let fileUrl = "";
  if (publicUploadsIndex !== -1) {
    const subPath = targetDir.replace(/\\/g, "/").slice(publicUploadsIndex + "public".length);
    fileUrl = `${subPath.startsWith("/") ? "" : "/"}${subPath}/${fileName}`.replace(/\/+/g, "/");
  } else {
    fileUrl = `/uploads/${fileName}`;
  }

  return {
    fileName,
    filePath,
    fileUrl,
    buffer: webpBuffer,
  };
}
