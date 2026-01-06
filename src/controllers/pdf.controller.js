import { PDFDocument } from "pdf-lib";
import archiver from "archiver";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { createTempDir, writeTempFile, removeDir, readFileBuffer, listFiles } from "../utils/temp.js";
import { spawn } from "child_process";
import path from "path";

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

const runCmd = (cmd, args, cwd) =>
  new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd, windowsHide: true });
    let stderr = "";
    p.stderr.on("data", d => (stderr += d.toString()));
    p.on("error", reject);
    p.on("close", code => {
      if (code === 0) resolve(true);
      else reject(new Error(stderr || `Exit code ${code}`));
    });
  });

export const compressPdf = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) throw new ApiError(400, "PDF file is required");
  const dir = await createTempDir();
  try {
    const inPath = await writeTempFile(dir, "input.pdf", file.buffer);
    const outPath = path.join(dir, "output.pdf");
    const gs = process.env.GS_BIN || "gswin64c";
    const args = [
      "-sDEVICE=pdfwrite",
      "-dCompatibilityLevel=1.4",
      "-dPDFSETTINGS=/ebook",
      "-dNOPAUSE",
      "-dQUIET",
      "-dBATCH",
      `-sOutputFile=${outPath}`,
      inPath
    ];
    try {
      await runCmd(gs, args, dir);
    } catch {
      const alt = "gswin32c";
      await runCmd(alt, args, dir);
    }
    const buf = await readFileBuffer(outPath);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="compressed.pdf"`);
    res.status(200).end(buf);
  } catch (e) {
    throw new ApiError(503, `Ghostscript not available or failed: ${e.message}`);
  } finally {
    await removeDir(dir);
  }
});

export const pdfToWord = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) throw new ApiError(400, "PDF file is required");
  const dir = await createTempDir();
  try {
    const inPath = await writeTempFile(dir, "input.pdf", file.buffer);
    const soffice = process.env.SOFFICE_BIN || "soffice";
    try {
      await runCmd(soffice, ["--headless", "--convert-to", "docx", inPath, "--outdir", dir], dir);
    } catch (e) {
      throw new ApiError(503, `LibreOffice not available or failed: ${e.message}`);
    }
    const outPath = path.join(dir, "input.docx");
    const buf = await readFileBuffer(outPath);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="converted.docx"`);
    res.status(200).end(buf);
  } finally {
    await removeDir(dir);
  }
});

export const wordToPdf = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) throw new ApiError(400, "Word file is required");
  const dir = await createTempDir();
  try {
    const name = (file.originalname || "input.docx").toLowerCase().endsWith(".doc") ? "input.doc" : "input.docx";
    const inPath = await writeTempFile(dir, name, file.buffer);
    const soffice = process.env.SOFFICE_BIN || "soffice";
    try {
      await runCmd(soffice, ["--headless", "--convert-to", "pdf", inPath, "--outdir", dir], dir);
    } catch (e) {
      throw new ApiError(503, `LibreOffice not available or failed: ${e.message}`);
    }
    const outPath = path.join(dir, name.replace(/\.docx?$/i, ".pdf"));
    const buf = await readFileBuffer(outPath);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="converted.pdf"`);
    res.status(200).end(buf);
  } finally {
    await removeDir(dir);
  }
});

export const pdfToJpg = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) throw new ApiError(400, "PDF file is required");
  const dir = await createTempDir();
  try {
    const inPath = await writeTempFile(dir, "input.pdf", file.buffer);
    const outBase = path.join(dir, "page");
    const bin = process.env.POPPLER_PPM_BIN || "pdftoppm";
    try {
      await runCmd(bin, [inPath, outBase, "-jpeg", "-r", "150"], dir);
    } catch (e) {
      throw new ApiError(503, `Poppler pdftoppm not available or failed: ${e.message}`);
    }
    const files = await listFiles(dir);
    const jpgs = files.filter(f => f.toLowerCase().endsWith(".jpg"));
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="images.zip"`);
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", err => { throw err; });
    archive.pipe(res);
    let idx = 1;
    for (const f of jpgs) {
      const buf = await readFileBuffer(f);
      archive.append(buf, { name: `page-${idx++}.jpg` });
    }
    await archive.finalize();
  } finally {
    await removeDir(dir);
  }
});
