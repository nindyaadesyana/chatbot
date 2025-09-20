import { createWorker } from 'tesseract.js';
import { readFileSync } from 'fs';
import { join } from 'path';

async function testPdfOcr() {
  try {
    console.log('🔍 Testing PDF OCR...');
    
    const pdfPath = join(process.cwd(), 'public', 'uploads', 'Company_Profile_TVKU_2025_web.pdf');
    
    // Check if we can read the PDF as text first
    const pdfParse = require('pdf-parse');
    const pdfBuffer = readFileSync(pdfPath);
    const pdfData = await pdfParse(pdfBuffer);
    
    console.log('📄 PDF Info:');
    console.log('- Pages:', pdfData.numpages);
    console.log('- Text length:', pdfData.text.length);
    console.log('- Has text:', pdfData.text.trim().length > 0);
    
    if (pdfData.text.trim().length > 100) {
      console.log('✅ PDF has extractable text!');
      console.log('📝 Sample text:', pdfData.text.substring(0, 500) + '...');
      return pdfData.text;
    } else {
      console.log('❌ PDF appears to be image-based, needs OCR');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

testPdfOcr();