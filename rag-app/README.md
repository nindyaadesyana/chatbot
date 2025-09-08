# RAG Application

## Overview
The RAG (Retrieval-Augmented Generation) application is designed to process PDF files, extracting text from images using Optical Character Recognition (OCR) and integrating the results into a retrieval-augmented generation system. This project aims to provide a seamless experience for users to upload their PDF documents and receive processed outputs.

## Project Structure
```
rag-app
├── src
│   ├── ocr
│   │   └── ocrProcessor.py
│   ├── rag
│   │   └── ragEngine.py
│   └── main.py
├── upload_pdf
│   └── (place your PDF files here)
├── requirements.txt
└── README.md
```

## Installation
To set up the project, follow these steps:

1. Clone the repository:
   ```
   git clone <repository-url>
   cd rag-app
   ```

2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

## Usage
1. Place your PDF files in the `upload_pdf` directory. This is the designated folder for uploading files.
   
2. Run the application:
   ```
   python src/main.py
   ```

3. Follow the prompts to process your uploaded PDF files.

## Functionality
- **OCR Processing**: The application utilizes the `ocrProcessor.py` to extract text from images within the PDF files.
- **RAG Integration**: The `ragEngine.py` manages the integration of OCR results and facilitates the flow of data for output generation.
- **User-Friendly Interface**: The main application entry point is handled by `main.py`, which guides users through the upload and processing steps.

## Contributing
Contributions are welcome! Please feel free to submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.