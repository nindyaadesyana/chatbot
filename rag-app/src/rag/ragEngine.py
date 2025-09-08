def process_uploaded_pdfs():
    import os
    from ocr.ocrProcessor import extract_text_from_pdf
    from some_rag_library import RagSystem  # Placeholder for actual RAG library

    upload_folder = '../upload_pdf'
    pdf_files = [f for f in os.listdir(upload_folder) if f.endswith('.pdf')]

    rag_system = RagSystem()

    for pdf_file in pdf_files:
        pdf_path = os.path.join(upload_folder, pdf_file)
        text = extract_text_from_pdf(pdf_path)
        rag_system.process_text(text)

    rag_system.generate_output()

if __name__ == "__main__":
    process_uploaded_pdfs()