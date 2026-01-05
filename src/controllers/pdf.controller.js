import { PDFDocument } from "pdf-lib";
import archiver from "archiver";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

export const splitPdf = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) throw new ApiError(400, "PDF file is required");
  const pdf = await PDFDocument.load(file.buffer);
  const total = pdf.getPageCount();
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="split-pages.zip"`);
  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.on("error", err => { throw err; });
  archive.pipe(res);
  for (let i = 0; i < total; i++) {
    const outDoc = await PDFDocument.create();
    const [page] = await outDoc.copyPages(pdf, [i]);
    outDoc.addPage(page);
    const bytes = await outDoc.save();
    archive.append(Buffer.from(bytes), { name: `page-${i + 1}.pdf` });
  }
  archive.finalize();
});

export const jpgToPdf = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) throw new ApiError(400, "Image file is required");
  const doc = await PDFDocument.create();
  let embedded;
  const mime = file.mimetype || "";
  if (mime.includes("png")) {
    embedded = await doc.embedPng(file.buffer);
  } else {
    embedded = await doc.embedJpg(file.buffer);
  }
  const page = doc.addPage([embedded.width, embedded.height]);
  page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
  const out = await doc.save();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="image.pdf"`);
  res.status(200).end(Buffer.from(out));
});

export const notImplemented = asyncHandler(async (req, res) => {
  throw new ApiError(501, "Not implemented. Requires external tools (Ghostscript/LibreOffice/Poppler).");
});
