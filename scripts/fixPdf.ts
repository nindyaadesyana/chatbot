import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { readFileSync } from "fs";
import { join } from "path";

const PDF_PATH = join(process.cwd(), "public", "uploads", "Company_Profile_TVKU_2025_web.pdf");

async function fixPDF() {
  try {
    // Try WebPDFLoader instead
    const buffer = readFileSync(PDF_PATH);
    const blob = new Blob([buffer], { type: "application/pdf" });
    
    const loader = new WebPDFLoader(blob, {
      splitPages: true,
    });
    
    const docs = await loader.load();
    console.log(`WebPDFLoader: ${docs.length} pages`);
    
    if (docs.length > 0) {
      console.log("Preview:", docs[0].pageContent.substring(0, 200));
    }
    
  } catch (error) {
    console.error("WebPDFLoader failed:", error);
  }
}

fixPDF();