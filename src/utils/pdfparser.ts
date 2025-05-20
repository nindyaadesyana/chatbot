import pdf from 'pdf-parse';
import fs from 'fs/promises';

interface PDFParseResult {
  text: string;
}

export async function extractTextFromPDF(filePath: string): Promise<string | null> {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const data: PDFParseResult = await pdf(fileBuffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return null;
  }
}
