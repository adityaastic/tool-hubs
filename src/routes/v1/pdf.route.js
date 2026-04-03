import { Router } from "express";
import { upload, uploadDisk } from "../../middlewares/upload.js";
import { 
  splitPdf, jpgToPdf, compressPdf, pdfToWord, wordToPdf, pdfToJpg, 
  unlockPdf, removePages, lockPdf, pdfToZip, mergePdf,
  pptToPdf, excelToPdf, pdfToExcel, pdfToPpt, pdfToPdfA 
} from "../../controllers/pdf.controller.js";

const router = Router();

// Use disk storage for heavy PDF operations to avoid Node.js OOM on large files
router.post("/pdf/merge", uploadDisk.array("files", 20), mergePdf);
router.post("/pdf/split", uploadDisk.single("file"), splitPdf);
router.post("/pdf/compress", uploadDisk.single("file"), compressPdf);
router.post("/pdf/unlock", uploadDisk.single("file"), unlockPdf);
router.post("/pdf/remove-pages", uploadDisk.single("file"), removePages);
router.post("/pdf/lock", uploadDisk.single("file"), lockPdf);
router.post("/pdf/to-pdfa", uploadDisk.single("file"), pdfToPdfA);

router.post("/convert/pdf-to-zip", uploadDisk.single("file"), pdfToZip);
router.post("/convert/pdf-to-word", uploadDisk.single("file"), pdfToWord);
router.post("/convert/word-to-pdf", uploadDisk.single("file"), wordToPdf);
router.post("/convert/pdf-to-jpg", uploadDisk.single("file"), pdfToJpg);
router.post("/convert/jpg-to-pdf", upload.single("file"), jpgToPdf);
router.post("/convert/ppt-to-pdf", uploadDisk.single("file"), pptToPdf);
router.post("/convert/excel-to-pdf", uploadDisk.single("file"), excelToPdf);
router.post("/convert/pdf-to-excel", uploadDisk.single("file"), pdfToExcel);
router.post("/convert/pdf-to-ppt", uploadDisk.single("file"), pdfToPpt);

export default router;

