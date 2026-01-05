import { Router } from "express";
import { upload } from "../../middlewares/upload.js";
import { splitPdf, jpgToPdf, notImplemented } from "../../controllers/pdf.controller.js";

const router = Router();

router.post("/pdf/split", upload.single("file"), splitPdf);
router.post("/pdf/compress", upload.single("file"), notImplemented);
router.post("/convert/pdf-to-word", upload.single("file"), notImplemented);
router.post("/convert/word-to-pdf", upload.single("file"), notImplemented);
router.post("/convert/pdf-to-jpg", upload.single("file"), notImplemented);
router.post("/convert/jpg-to-pdf", upload.single("file"), jpgToPdf);

export default router;
