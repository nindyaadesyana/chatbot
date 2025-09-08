import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { join } from "path";

const PDF_PATH = join(process.cwd(), "public", "uploads", "Company_Profile_TVKU_2025_web.pdf");

async function testPDF() {
  try {
    console.log("Testing PDF:", PDF_PATH);
    
    const loader = new PDFLoader(PDF_PATH, {
      splitPages: true,
      parsedItemSeparator: " "
    });
    
    const docs = await loader.load();
    console.log(`Loaded ${docs.length} pages`);
    
    if (docs.length > 0) {
      console.log("First page preview:", docs[0].pageContent.substring(0, 200));
    }
    
  } catch (error) {
    console.error("Error:", error);
  }
}

testPDF();