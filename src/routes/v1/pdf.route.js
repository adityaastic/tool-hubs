import { Router } from "express";
import { upload } from "../../middlewares/upload.js";
import { 
  splitPdf, jpgToPdf, compressPdf, pdfToWord, wordToPdf, pdfToJpg, 
  unlockPdf, removePages, lockPdf, pdfToZip, mergePdf,
  pptToPdf, excelToPdf, pdfToExcel, pdfToPpt, pdfToPdfA 
} from "../../controllers/pdf.controller.js";

const router = Router();

router.post("/pdf/merge", upload.array("files", 20), mergePdf);

router.post("/pdf/split", upload.single("file"), splitPdf);
router.post("/pdf/compress", upload.single("file"), compressPdf);
router.post("/pdf/unlock", upload.single("file"), unlockPdf);
router.post("/pdf/remove-pages", upload.single("file"), removePages);
router.post("/pdf/lock", upload.single("file"), lockPdf);
router.post("/pdf/to-pdfa", upload.single("file"), pdfToPdfA);

router.post("/convert/pdf-to-zip", upload.single("file"), pdfToZip);
router.post("/convert/pdf-to-word", upload.single("file"), pdfToWord);
router.post("/convert/word-to-pdf", upload.single("file"), wordToPdf);
router.post("/convert/pdf-to-jpg", upload.single("file"), pdfToJpg);
router.post("/convert/jpg-to-pdf", upload.single("file"), jpgToPdf);
router.post("/convert/ppt-to-pdf", upload.single("file"), pptToPdf);
router.post("/convert/excel-to-pdf", upload.single("file"), excelToPdf);
router.post("/convert/pdf-to-excel", upload.single("file"), pdfToExcel);
router.post("/convert/pdf-to-ppt", upload.single("file"), pdfToPpt);

export default router;
