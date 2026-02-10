
import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

async function createTestPdf() {
  const doc = await PDFDocument.create();
  doc.addPage([500, 500]).drawText('Page 1');
  doc.addPage([500, 500]).drawText('Page 2');
  doc.addPage([500, 500]).drawText('Page 3');
  const bytes = await doc.save();
  fs.writeFileSync('test_input.pdf', bytes);
  console.log('Created test_input.pdf');
}

async function testEndpoints() {
  await createTestPdf();
  const baseUrl = 'http://localhost:5000/api/v1';
  
  // 1. Lock PDF
  console.log('\nTesting Lock PDF...');
  const formDataLock = new FormData();
  formDataLock.append('file', new Blob([fs.readFileSync('test_input.pdf')]), 'test_input.pdf');
  formDataLock.append('password', 'secret123');
  
  const resLock = await fetch(`${baseUrl}/pdf/lock`, { method: 'POST', body: formDataLock });
  if (resLock.ok) {
    const buf = await resLock.arrayBuffer();
    fs.writeFileSync('test_locked.pdf', Buffer.from(buf));
    console.log('Lock PDF success: saved test_locked.pdf');
    
    // 2. Unlock PDF (only if lock succeeded)
    console.log('\nTesting Unlock PDF...');
    const formDataUnlock = new FormData();
    formDataUnlock.append('file', new Blob([fs.readFileSync('test_locked.pdf')]), 'test_locked.pdf');
    formDataUnlock.append('password', 'secret123');
    
    const resUnlock = await fetch(`${baseUrl}/pdf/unlock`, { method: 'POST', body: formDataUnlock });
    if (resUnlock.ok) {
      const buf = await resUnlock.arrayBuffer();
      fs.writeFileSync('test_unlocked.pdf', Buffer.from(buf));
      console.log('Unlock PDF success: saved test_unlocked.pdf');
    } else {
      console.error('Unlock PDF failed:', await resUnlock.text());
    }

  } else {
    console.error('Lock PDF failed:', await resLock.text());
    console.log('Skipping Unlock PDF test due to Lock failure.');
  }

  // 3. Remove Pages (remove page 2, i.e., index 1)
  console.log('\nTesting Remove Pages...');
  const formDataRemove = new FormData();
  formDataRemove.append('file', new Blob([fs.readFileSync('test_input.pdf')]), 'test_input.pdf');
  formDataRemove.append('pages', '2'); 
  
  const resRemove = await fetch(`${baseUrl}/pdf/remove-pages`, { method: 'POST', body: formDataRemove });
  if (resRemove.ok) {
    const buf = await resRemove.arrayBuffer();
    fs.writeFileSync('test_removed.pdf', Buffer.from(buf));
    console.log('Remove Pages success: saved test_removed.pdf');
  } else {
    console.error('Remove Pages failed:', await resRemove.text());
  }

  // 4. PDF to ZIP
  console.log('\nTesting PDF to ZIP...');
  const formDataZip = new FormData();
  formDataZip.append('file', new Blob([fs.readFileSync('test_input.pdf')]), 'test_input.pdf');
  
  const resZip = await fetch(`${baseUrl}/convert/pdf-to-zip`, { method: 'POST', body: formDataZip });
  if (resZip.ok) {
    const buf = await resZip.arrayBuffer();
    fs.writeFileSync('test_zip.zip', Buffer.from(buf));
    console.log('PDF to ZIP success: saved test_zip.zip');
  } else {
    console.error('PDF to ZIP failed:', await resZip.text());
  }
}

testEndpoints().catch(console.error);
