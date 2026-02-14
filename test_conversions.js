
import fs from 'fs';
import path from 'path';

async function testNewConversions() {
  const baseUrl = 'http://localhost:5000/api/v1';
  const testPdf = 'test_input.pdf';

  if (!fs.existsSync(testPdf)) {
    console.error('test_input.pdf not found. Run test_pdf_new.js first.');
    return;
  }

  // 1. PDF to Excel
  console.log('\nTesting PDF to Excel...');
  const formDataExcel = new FormData();
  formDataExcel.append('file', new Blob([fs.readFileSync(testPdf)]), 'test_input.pdf');
  
  try {
    const resExcel = await fetch(`${baseUrl}/convert/pdf-to-excel`, { method: 'POST', body: formDataExcel });
    if (resExcel.ok) {
      const buf = await resExcel.arrayBuffer();
      fs.writeFileSync('test_output.xlsx', Buffer.from(buf));
      console.log('PDF to Excel success: saved test_output.xlsx');
    } else {
      console.error('PDF to Excel failed:', await resExcel.text());
    }
  } catch (e) {
    console.error('PDF to Excel Error:', e.message);
  }

  // 2. PDF to PPT
  console.log('\nTesting PDF to PPT...');
  const formDataPpt = new FormData();
  formDataPpt.append('file', new Blob([fs.readFileSync(testPdf)]), 'test_input.pdf');
  
  try {
    const resPpt = await fetch(`${baseUrl}/convert/pdf-to-ppt`, { method: 'POST', body: formDataPpt });
    if (resPpt.ok) {
      const buf = await resPpt.arrayBuffer();
      fs.writeFileSync('test_output.pptx', Buffer.from(buf));
      console.log('PDF to PPT success: saved test_output.pptx');
    } else {
      console.error('PDF to PPT failed:', await resPpt.text());
    }
  } catch (e) {
    console.error('PDF to PPT Error:', e.message);
  }

  console.log('\nNote: Office -> PDF and PDF/A tests require LibreOffice and Ghostscript installed on the system.');
}

testNewConversions().catch(console.error);
