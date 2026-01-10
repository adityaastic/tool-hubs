import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { createTempDir, writeTempFile, removeDir, readFileBuffer } from "../utils/temp.js";
import path from "path";

export const svgToPng = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) throw new ApiError(400, "SVG file is required");
  
  const width = parseInt(req.body.width) || 1024;
  const height = parseInt(req.body.height) || 1024;
  
  if (width < 1 || width > 4096 || height < 1 || height > 4096) {
    throw new ApiError(400, "Width and height must be between 1-4096 pixels");
  }
  
  const dir = await createTempDir();
  try {
    const inputPath = await writeTempFile(dir, "input.svg", file.buffer);
    
    // Use Sharp to convert SVG to PNG
    const sharp = (await import("sharp")).default;
    const buffer = await sharp(inputPath, { 
      density: 300,
      limitInputPixels: false 
    })
    .resize(width, height, { fit: "inside" })
    .png()
    .toBuffer();
    
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `attachment; filename="converted.png"`);
    res.status(200).end(buffer);
  } finally {
    await removeDir(dir);
  }
});

export const svgToJpg = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) throw new ApiError(400, "SVG file is required");
  
  const width = parseInt(req.body.width) || 1024;
  const height = parseInt(req.body.height) || 1024;
  const quality = parseInt(req.body.quality) || 90;
  
  if (width < 1 || width > 4096 || height < 1 || height > 4096) {
    throw new ApiError(400, "Width and height must be between 1-4096 pixels");
  }
  if (quality < 1 || quality > 100) throw new ApiError(400, "Quality must be between 1-100");
  
  const dir = await createTempDir();
  try {
    const inputPath = await writeTempFile(dir, "input.svg", file.buffer);
    
    // Use Sharp to convert SVG to JPG
    const sharp = (await import("sharp")).default;
    const buffer = await sharp(inputPath, { 
      density: 300,
      limitInputPixels: false 
    })
    .resize(width, height, { fit: "inside" })
    .jpeg({ quality })
    .toBuffer();
    
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Content-Disposition", `attachment; filename="converted.jpg"`);
    res.status(200).end(buffer);
  } finally {
    await removeDir(dir);
  }
});

export const svgToPdf = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) throw new ApiError(400, "SVG file is required");
  
  const width = parseInt(req.body.width) || 1024;
  const height = parseInt(req.body.height) || 1024;
  
  if (width < 1 || width > 4096 || height < 1 || height > 4096) {
    throw new ApiError(400, "Width and height must be between 1-4096 pixels");
  }
  
  const dir = await createTempDir();
  try {
    const inputPath = await writeTempFile(dir, "input.svg", file.buffer);
    
    // Use Sharp to convert SVG to PDF
    const sharp = (await import("sharp")).default;
    const buffer = await sharp(inputPath, { 
      density: 300,
      limitInputPixels: false 
    })
    .resize(width, height, { fit: "inside" })
    .pdf()
    .toBuffer();
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="converted.pdf"`);
    res.status(200).end(buffer);
  } finally {
    await removeDir(dir);
  }
});