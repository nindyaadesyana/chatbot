import * as fs from 'fs';
import * as pdf from 'pdf-parse';
import { join } from "path";

const PDF_PATH = join(process.cwd(), "public", "Company_Profile_TVKU_2025_web.pdf");

async function testPDFParse() {
  try {
    const dataBuffer = fs.readFileSync(PDF_PATH);
    const data = await pdf(dataBuffer);
    
    console.log(`Pages: ${data.numpages}`);
    console.log(`Text length: ${data.text.length}`);
    console.log("Preview:", data.text.substring(0, 300));
    
  } catch (error) {
    console.error("Error:", error);
  }
}

testPDFParse();