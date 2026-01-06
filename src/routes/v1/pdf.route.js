import { Router } from "express";
import { upload } from "../../middlewares/upload.js";
import { splitPdf, jpgToPdf, compressPdf, pdfToWord, wordToPdf, pdfToJpg } from "../../controllers/pdf.controller.js";

const router = Router();

router.post("/pdf/split", upload.single("file"), splitPdf);
router.post("/pdf/compress", upload.single("file"), compressPdf);
router.post("/convert/pdf-to-word", upload.single("file"), pdfToWord);
router.post("/convert/word-to-pdf", upload.single("file"), wordToPdf);
router.post("/convert/pdf-to-jpg", upload.single("file"), pdfToJpg);
router.post("/convert/jpg-to-pdf", upload.single("file"), jpgToPdf);

export default router;
