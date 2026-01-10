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