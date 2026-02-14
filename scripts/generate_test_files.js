import { writeFileSync } from 'fs';
import path from 'path';
import { PDFDocument, rgb } from 'pdf-lib';
import ExcelJS from 'exceljs';
import PptxGenJS from 'pptxgenjs';

async function createTestPdf(outPath) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([600, 400]);
  page.drawText('Sample PDF for conversion tests', { x: 50, y: 300, size: 18, color: rgb(0, 0.53, 0.71) });
  page.drawText('Line 1: Hello world', { x: 50, y: 260, size: 14 });
  page.drawText('Line 2: Testing PDF to Excel/PPT', { x: 50, y: 240, size: 14 });
  const bytes = await doc.save();
  writeFileSync(outPath, Buffer.from(bytes));
}

async function createTestXlsx(outPath) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sheet1');
  ws.addRow(['Title', 'Value']);
  ws.addRow(['A', 1]);
  ws.addRow(['B', 2]);
  ws.addRow(['C', 3]);
  const buf = await wb.xlsx.writeBuffer();
  writeFileSync(outPath, Buffer.from(buf));
}

async function createTestPptx(outPath) {
  const pptx = new PptxGenJS();
  const slide = pptx.addSlide();
  slide.addText('Sample PPTX for conversion tests', { x: 0.5, y: 0.5, fontSize: 24 });
  slide.addText('Bullet 1', { x: 0.8, y: 1.2, fontSize: 18 });
  slide.addText('Bullet 2', { x: 0.8, y: 1.7, fontSize: 18 });
  const buf = await pptx.write('nodebuffer');
  writeFileSync(outPath, buf);
}

async function main() {
  const base = process.cwd();
  const pdfPath = path.join(base, 'test_input.pdf');
  const xlsxPath = path.join(base, 'test_input.xlsx');
  const pptxPath = path.join(base, 'test_input.pptx');

  await createTestPdf(pdfPath);
  console.log('Created', pdfPath);

  await createTestXlsx(xlsxPath);
  console.log('Created', xlsxPath);

  await createTestPptx(pptxPath);
  console.log('Created', pptxPath);
}

main().catch(err => {
  console.error('Failed generating test files:', err);
  process.exit(1);
});
