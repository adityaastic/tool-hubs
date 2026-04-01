import { Router } from "express";
import { upload } from "../../middlewares/upload.js";
import { 
  jpgToPng, 
  pngToJpg, 
  heicToJpg, 
  webpToPng, 
  compressImage,
  resizeImage,
  cropImage,
  compressToSize,
  jpgToWebp,
  pngToWebp,
  webpToJpg,
  rotateImage,
  grayscaleImage,
  borderImage,
} from "../../controllers/image.controller.js";
import { 
  svgToPng, 
  svgToJpg, 
  svgToPdf 
} from "../../controllers/svg.controller.js";

const router = Router();

// ── Existing image conversion ──────────────────────────────────────────────
router.post("/convert/jpg-to-png", upload.single("file"), jpgToPng);
router.post("/convert/png-to-jpg", upload.single("file"), pngToJpg);
router.post("/convert/heic-to-jpg", upload.single("file"), heicToJpg);
router.post("/convert/webp-to-png", upload.single("file"), webpToPng);
router.post("/image/compress", upload.single("file"), compressImage);

// ── SVG conversion ─────────────────────────────────────────────────────────
router.post("/convert/svg-to-png", upload.single("file"), svgToPng);
router.post("/convert/svg-to-jpg", upload.single("file"), svgToJpg);
router.post("/convert/svg-to-pdf", upload.single("file"), svgToPdf);

// ── New image editing tools ────────────────────────────────────────────────
router.post("/image/resize", upload.single("file"), resizeImage);
router.post("/image/crop", upload.single("file"), cropImage);
router.post("/image/compress-to-size", upload.single("file"), compressToSize);
router.post("/convert/jpg-to-webp", upload.single("file"), jpgToWebp);
router.post("/convert/png-to-webp", upload.single("file"), pngToWebp);
router.post("/convert/webp-to-jpg", upload.single("file"), webpToJpg);
router.post("/image/rotate", upload.single("file"), rotateImage);
router.post("/image/grayscale", upload.single("file"), grayscaleImage);
router.post("/image/border", upload.single("file"), borderImage);

export default router;