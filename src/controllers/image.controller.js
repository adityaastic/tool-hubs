import sharp from "sharp";
import convert from "heic-convert";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { createTempDir, writeTempFile, removeDir, readFileBuffer } from "../utils/temp.js";
import path from "path";

export const jpgToPng = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) throw new ApiError(400, "Image file is required");
  
  const dir = await createTempDir();
  try {
    const inputPath = await writeTempFile(dir, "input.jpg", file.buffer);
    const outputPath = path.join(dir, "output.png");
    
    await sharp(inputPath).png().toFile(outputPath);
    
    const buffer = await readFileBuffer(outputPath);
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `attachment; filename="converted.png"`);
    res.status(200).end(buffer);
  } finally {
    await removeDir(dir);
  }
});

export const pngToJpg = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) throw new ApiError(400, "Image file is required");
  
  const dir = await createTempDir();
  try {
    const inputPath = await writeTempFile(dir, "input.png", file.buffer);
    const outputPath = path.join(dir, "output.jpg");
    
    await sharp(inputPath).jpeg().toFile(outputPath);
    
    const buffer = await readFileBuffer(outputPath);
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Content-Disposition", `attachment; filename="converted.jpg"`);
    res.status(200).end(buffer);
  } finally {
    await removeDir(dir);
  }
});

export const heicToJpg = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) throw new ApiError(400, "HEIC image file is required");
  
  try {
    const outputBuffer = await convert({
      buffer: file.buffer,
      format: 'JPEG',
      quality: 1
    });
    
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Content-Disposition", `attachment; filename="converted.jpg"`);
    res.status(200).end(outputBuffer);
  } catch (error) {
    throw new ApiError(500, "Failed to convert HEIC image: " + error.message);
  }
});

export const webpToPng = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) throw new ApiError(400, "WEBP image file is required");
  
  const dir = await createTempDir();
  try {
    const inputPath = await writeTempFile(dir, "input.webp", file.buffer);
    const outputPath = path.join(dir, "output.png");
    
    await sharp(inputPath).png().toFile(outputPath);
    
    const buffer = await readFileBuffer(outputPath);
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `attachment; filename="converted.png"`);
    res.status(200).end(buffer);
  } finally {
    await removeDir(dir);
  }
});

export const compressImage = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) throw new ApiError(400, "Image file is required");
  
  const quality = parseInt(req.body.quality) || 80;
  if (quality < 1 || quality > 100) throw new ApiError(400, "Quality must be between 1-100");
  
  const dir = await createTempDir();
  try {
    const inputPath = await writeTempFile(dir, "input" + path.extname(file.originalname), file.buffer);
    const outputPath = path.join(dir, "compressed.jpg");
    
    await sharp(inputPath).jpeg({ quality }).toFile(outputPath);
    
    const buffer = await readFileBuffer(outputPath);
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Content-Disposition", `attachment; filename="compressed.jpg"`);
    res.status(200).end(buffer);
  } finally {
    await removeDir(dir);
  }
});

// ── NEW TOOLS ──────────────────────────────────────────────────────────────

export const resizeImage = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) throw new ApiError(400, "Image file is required");

  const width = parseInt(req.body.width) || null;
  const height = parseInt(req.body.height) || null;
  const fit = ["cover","contain","fill","inside","outside"].includes(req.body.fit) ? req.body.fit : "inside";

  if (!width && !height) throw new ApiError(400, "At least one of width or height is required");

  const dir = await createTempDir();
  try {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const inputPath = await writeTempFile(dir, "input" + ext, file.buffer);
    const outputPath = path.join(dir, "resized" + ext);

    await sharp(inputPath).resize(width, height, { fit, withoutEnlargement: false }).toFile(outputPath);

    const buffer = await readFileBuffer(outputPath);
    res.setHeader("Content-Type", file.mimetype || "image/jpeg");
    res.setHeader("Content-Disposition", `attachment; filename="resized${ext}"`);
    res.status(200).end(buffer);
  } finally {
    await removeDir(dir);
  }
});

export const cropImage = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) throw new ApiError(400, "Image file is required");

  const left = parseInt(req.body.left) || 0;
  const top = parseInt(req.body.top) || 0;
  const width = parseInt(req.body.width);
  const height = parseInt(req.body.height);

  if (!width || !height || width < 1 || height < 1) throw new ApiError(400, "Width and height are required and must be positive");

  const dir = await createTempDir();
  try {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const inputPath = await writeTempFile(dir, "input" + ext, file.buffer);
    const outputPath = path.join(dir, "cropped" + ext);

    await sharp(inputPath).extract({ left, top, width, height }).toFile(outputPath);

    const buffer = await readFileBuffer(outputPath);
    res.setHeader("Content-Type", file.mimetype || "image/jpeg");
    res.setHeader("Content-Disposition", `attachment; filename="cropped${ext}"`);
    res.status(200).end(buffer);
  } finally {
    await removeDir(dir);
  }
});

export const compressToSize = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) throw new ApiError(400, "Image file is required");

  const targetKB = parseFloat(req.body.targetKB);
  if (!targetKB || targetKB < 1) throw new ApiError(400, "targetKB must be a positive number");

  const targetBytes = targetKB * 1024;

  const dir = await createTempDir();
  try {
    const inputPath = await writeTempFile(dir, "input" + path.extname(file.originalname), file.buffer);

    // Binary search for quality that produces file closest to targetBytes
    let lo = 1, hi = 100, bestQuality = 80, bestBuffer = null;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const buf = await sharp(inputPath).jpeg({ quality: mid }).toBuffer();
      if (buf.length <= targetBytes) {
        bestQuality = mid;
        bestBuffer = buf;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    if (!bestBuffer) {
      // Even quality=1 is too large — just use quality=1
      bestBuffer = await sharp(inputPath).jpeg({ quality: 1 }).toBuffer();
    }

    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Content-Disposition", `attachment; filename="compressed.jpg"`);
    res.status(200).end(bestBuffer);
  } finally {
    await removeDir(dir);
  }
});

export const jpgToWebp = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) throw new ApiError(400, "Image file is required");

  const quality = parseInt(req.body.quality) || 85;
  const dir = await createTempDir();
  try {
    const inputPath = await writeTempFile(dir, "input.jpg", file.buffer);
    const buffer = await sharp(inputPath).webp({ quality }).toBuffer();
    res.setHeader("Content-Type", "image/webp");
    res.setHeader("Content-Disposition", `attachment; filename="converted.webp"`);
    res.status(200).end(buffer);
  } finally {
    await removeDir(dir);
  }
});

export const pngToWebp = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) throw new ApiError(400, "Image file is required");

  const quality = parseInt(req.body.quality) || 85;
  const dir = await createTempDir();
  try {
    const inputPath = await writeTempFile(dir, "input.png", file.buffer);
    const buffer = await sharp(inputPath).webp({ quality, lossless: false }).toBuffer();
    res.setHeader("Content-Type", "image/webp");
    res.setHeader("Content-Disposition", `attachment; filename="converted.webp"`);
    res.status(200).end(buffer);
  } finally {
    await removeDir(dir);
  }
});

export const webpToJpg = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) throw new ApiError(400, "WebP image file is required");

  const quality = parseInt(req.body.quality) || 90;
  const dir = await createTempDir();
  try {
    const inputPath = await writeTempFile(dir, "input.webp", file.buffer);
    const buffer = await sharp(inputPath).jpeg({ quality }).toBuffer();
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Content-Disposition", `attachment; filename="converted.jpg"`);
    res.status(200).end(buffer);
  } finally {
    await removeDir(dir);
  }
});

export const rotateImage = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) throw new ApiError(400, "Image file is required");

  const angle = parseInt(req.body.angle) || 0;
  const flipH = req.body.flipH === "true";
  const flipV = req.body.flipV === "true";

  const dir = await createTempDir();
  try {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const inputPath = await writeTempFile(dir, "input" + ext, file.buffer);

    let pipeline = sharp(inputPath).rotate(angle);
    if (flipH) pipeline = pipeline.flop();
    if (flipV) pipeline = pipeline.flip();

    const buffer = await pipeline.toBuffer();
    res.setHeader("Content-Type", file.mimetype || "image/jpeg");
    res.setHeader("Content-Disposition", `attachment; filename="rotated${ext}"`);
    res.status(200).end(buffer);
  } finally {
    await removeDir(dir);
  }
});

export const grayscaleImage = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) throw new ApiError(400, "Image file is required");

  const dir = await createTempDir();
  try {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const inputPath = await writeTempFile(dir, "input" + ext, file.buffer);
    const buffer = await sharp(inputPath).grayscale().toBuffer();

    res.setHeader("Content-Type", file.mimetype || "image/jpeg");
    res.setHeader("Content-Disposition", `attachment; filename="grayscale${ext}"`);
    res.status(200).end(buffer);
  } finally {
    await removeDir(dir);
  }
});

export const borderImage = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) throw new ApiError(400, "Image file is required");

  const borderSize = parseInt(req.body.borderSize) || 20;
  const colorHex = (req.body.color || "#ffffff").replace("#", "");

  if (borderSize < 1 || borderSize > 500) throw new ApiError(400, "Border size must be between 1-500px");

  // Parse hex color to RGB
  const r = parseInt(colorHex.substring(0, 2), 16) || 255;
  const g = parseInt(colorHex.substring(2, 4), 16) || 255;
  const b = parseInt(colorHex.substring(4, 6), 16) || 255;

  const dir = await createTempDir();
  try {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const inputPath = await writeTempFile(dir, "input" + ext, file.buffer);

    const buffer = await sharp(inputPath)
      .extend({
        top: borderSize,
        bottom: borderSize,
        left: borderSize,
        right: borderSize,
        background: { r, g, b, alpha: 1 }
      })
      .flatten({ background: { r, g, b } })
      .toBuffer();

    res.setHeader("Content-Type", file.mimetype || "image/jpeg");
    res.setHeader("Content-Disposition", `attachment; filename="bordered${ext}"`);
    res.status(200).end(buffer);
  } finally {
    await removeDir(dir);
  }
});