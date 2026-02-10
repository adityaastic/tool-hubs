import { PDFDocument } from "pdf-lib";
import archiver from "archiver";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { createTempDir, writeTempFile, removeDir, readFileBuffer, listFiles } from "../utils/temp.js";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const muhammara = require('muhammara');
const Recipe = muhammara.Recipe;

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



export const pdfToZip = splitPdf; // Alias for PDF to ZIP

export const unlockPdf = asyncHandler(async (req, res) => {
  const file = req.file;
  const password = req.body.password || "";
  if (!file) throw new ApiError(400, "PDF file is required");

  const timestamp = Date.now();
  const inputPath = path.join(process.cwd(), `temp_unlock_in_${timestamp}.pdf`);
  const outputPath = path.join(process.cwd(), `temp_unlock_out_${timestamp}.pdf`);

  try {
    fs.writeFileSync(inputPath, file.buffer);

    // Use muhammara to create a new unencrypted PDF from the encrypted input
    const writer = muhammara.createWriter(outputPath);
    writer.appendPDFPagesFromPDF(inputPath, { password: password });
    writer.end();

    const unlockedBuffer = fs.readFileSync(outputPath);
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="unlocked.pdf"`);
    res.status(200).end(unlockedBuffer);
  } catch (error) {
    if (error.message && (error.message.includes("Encrypted") || error.message.includes("Password") || error.message.includes("wrong password"))) {
      throw new ApiError(400, "Incorrect password or password required");
    }
    throw new ApiError(500, `Failed to unlock PDF: ${error.message}`);
  } finally {
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  }
});

export const removePages = asyncHandler(async (req, res) => {
  const file = req.file;
  const pagesToRemoveStr = req.body.pages; // "1,3,5-7"
  if (!file) throw new ApiError(400, "PDF file is required");
  if (!pagesToRemoveStr) throw new ApiError(400, "Pages to remove are required (e.g., '1,3-5')");

  const pdf = await PDFDocument.load(file.buffer);
  const total = pdf.getPageCount();
  
  // Parse pages string to array of 0-based indices
  const pagesToRemove = new Set();
  const parts = pagesToRemoveStr.split(",");
  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map(n => parseInt(n.trim()));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) pagesToRemove.add(i - 1);
      }
    } else {
      const page = parseInt(part.trim());
      if (!isNaN(page)) pagesToRemove.add(page - 1);
    }
  }

  // Filter valid indices
  const indices = Array.from(pagesToRemove)
    .filter(i => i >= 0 && i < total)
    .sort((a, b) => b - a); // Sort descending to remove from end first

  if (indices.length === 0) {
    throw new ApiError(400, "No valid pages specified to remove");
  }

  for (const idx of indices) {
    pdf.removePage(idx);
  }

  const bytes = await pdf.save();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="modified.pdf"`);
  res.status(200).end(Buffer.from(bytes));
});

export const lockPdf = asyncHandler(async (req, res) => {
  const file = req.file;
  const password = req.body.password;
  if (!file) throw new ApiError(400, "PDF file is required");
  if (!password) throw new ApiError(400, "Password is required to lock PDF");

  const timestamp = Date.now();
  const inputPath = path.join(process.cwd(), `temp_lock_in_${timestamp}.pdf`);
  const outputPath = path.join(process.cwd(), `temp_lock_out_${timestamp}.pdf`);

  try {
    fs.writeFileSync(inputPath, file.buffer);

    const pdfDoc = new Recipe(inputPath, outputPath);
    pdfDoc.encrypt({
      userPassword: password,
      ownerPassword: password,
      userProtectionFlag: 4,
    });
    pdfDoc.endPDF();

    const lockedBuffer = fs.readFileSync(outputPath);
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="locked.pdf"`);
    res.status(200).end(lockedBuffer);

  } catch (error) {
    throw new ApiError(500, `Failed to lock PDF: ${error.message}`);
  } finally {
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  }
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
      await runCmd(soffice, ["--headless", `--infilter=writer_pdf_import`, "--convert-to", "docx:MS Word 2007 XML", inPath, "--outdir", dir], dir);
    } catch (e) {
      throw new ApiError(503, `LibreOffice not available or failed: ${e.message}`);
    }
    let files = await listFiles(dir);
    let docx = files.find(f => f.toLowerCase().endsWith(".docx"));
    if (!docx) {
      try {
        await runCmd(soffice, ["--headless", `--infilter=writer_pdf_import`, "--convert-to", "odt:writer_pdf_import", inPath, "--outdir", dir], dir);
        files = await listFiles(dir);
        const odt = files.find(f => f.toLowerCase().endsWith(".odt"));
        if (odt) {
          await runCmd(soffice, ["--headless", "--convert-to", "docx:MS Word 2007 XML", odt, "--outdir", dir], dir);
          files = await listFiles(dir);
          docx = files.find(f => f.toLowerCase().endsWith(".docx"));
        }
      } catch {}
    }
    if (!docx) {
      const cwdFiles = await listFiles(process.cwd());
      docx = cwdFiles.find(f => f.toLowerCase().endsWith(".docx"));
    }
    if (!docx) throw new ApiError(500, "Conversion succeeded but output .docx not found");
    const buf = await readFileBuffer(docx);
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
      await runCmd(soffice, ["--headless", "--convert-to", "pdf:writer_pdf_Export", inPath, "--outdir", dir], dir);
    } catch (e) {
      throw new ApiError(503, `LibreOffice not available or failed: ${e.message}`);
    }
    const files = await listFiles(dir);
    const pdf = files.find(f => f.toLowerCase().endsWith(".pdf"));
    if (!pdf) throw new ApiError(500, "Conversion succeeded but output .pdf not found");
    const buf = await readFileBuffer(pdf);
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
