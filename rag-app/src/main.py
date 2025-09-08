# main.py

import os
from src.ocr.ocrProcessor import process_pdf
from src.rag.ragEngine import generate_output

def main():
    upload_folder = 'upload_pdf'
    
    # Check if the upload folder exists
    if not os.path.exists(upload_folder):
        print(f"Upload folder '{upload_folder}' does not exist.")
        return

    # List all PDF files in the upload folder
    pdf_files = [f for f in os.listdir(upload_folder) if f.endswith('.pdf')]
    
    if not pdf_files:
        print("No PDF files found in the upload folder.")
        return

    for pdf_file in pdf_files:
        pdf_path = os.path.join(upload_folder, pdf_file)
        print(f"Processing '{pdf_file}'...")

        # Process the PDF with OCR
        ocr_text = process_pdf(pdf_path)

        # Generate output using the RAG engine
        output = generate_output(ocr_text)

        # Here you can save or display the output as needed
        print(f"Output for '{pdf_file}': {output}")

if __name__ == "__main__":
    main()