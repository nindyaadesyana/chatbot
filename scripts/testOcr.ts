import { OCRService } from '../src/lib/ocrService';
import { join } from 'path';

const PDF_PATH = join(process.cwd(), "public", "uploads", "Company_Profile_TVKU_2025_web.pdf");

async function testOCR() {
  try {
    console.log("Testing OCR on PDF...");
    const text = await OCRService.extractTextFromPDF(PDF_PATH);
    
    console.log(`Extracted text length: ${text.length}`);
    console.log("Preview:", text.substring(0, 500));
    
  } catch (error) {
    console.error("OCR Test failed:", error);
  }
}

testOCR();