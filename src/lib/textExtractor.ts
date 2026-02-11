import * as pdfjsLib from 'pdfjs-dist';

// For pdfjs-dist v5, use the bundled worker via CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === 'text/plain') {
    return await file.text();
  }

  if (file.type === 'application/pdf') {
    return await extractPdfText(file);
  }

  if (
    file.type ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  throw new Error(`Unsupported file type: ${file.type}`);
}

async function extractPdfText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Try loading with standard worker first, fall back to no worker
    let pdf;
    try {
      pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
    } catch (workerErr) {
      console.warn('PDF.js worker failed, retrying without worker:', workerErr);
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';
      pdf = await pdfjsLib.getDocument({ data: uint8Array, disableAutoFetch: true }).promise;
    }
    
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .filter((item: any) => 'str' in item)
        .map((item: any) => item.str)
        .join(' ');
      text += pageText + '\n\n';
    }

    const result = text.trim();
    if (!result || result.length < 20) {
      throw new Error(
        'No text could be extracted from this PDF. It may be a scanned/image-based PDF. Please try a text-based PDF or convert it to a DOCX/TXT file first.'
      );
    }
    return result;
  } catch (err: any) {
    console.error('PDF extraction error:', err);
    if (err.message?.includes('No text could be extracted')) throw err;
    if (err.message?.includes('Invalid PDF')) {
      throw new Error('This file appears to be corrupted or is not a valid PDF. Please try a different file.');
    }
    throw new Error(`Failed to read PDF: ${err.message || 'Unknown error'}. Please try uploading again or use a different file.`);
  }
}
