import { Router } from "express";
import { upload } from "../../middlewares/upload.js";
import { 
  jpgToPng, 
  pngToJpg, 
  heicToJpg, 
  webpToPng, 
  compressImage 
} from "../../controllers/image.controller.js";
import { 
  svgToPng, 
  svgToJpg, 
  svgToPdf 
} from "../../controllers/svg.controller.js";

const router = Router();

// Image conversion endpoints
router.post("/convert/jpg-to-png", upload.single("file"), jpgToPng);
router.post("/convert/png-to-jpg", upload.single("file"), pngToJpg);
router.post("/convert/heic-to-jpg", upload.single("file"), heicToJpg);
router.post("/convert/webp-to-png", upload.single("file"), webpToPng);
router.post("/image/compress", upload.single("file"), compressImage);

// SVG conversion endpoints
router.post("/convert/svg-to-png", upload.single("file"), svgToPng);
router.post("/convert/svg-to-jpg", upload.single("file"), svgToJpg);
router.post("/convert/svg-to-pdf", upload.single("file"), svgToPdf);

export default router;