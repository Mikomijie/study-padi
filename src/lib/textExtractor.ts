import * as pdfjsLib from 'pdfjs-dist';

// For pdfjs-dist v5, use the bundled worker via CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === 'text/plain') {
    return await file.text();
  }

  if (file.type === 'application/pdf') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
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
      if (!result) {
        throw new Error('No text could be extracted from this PDF. It may be a scanned/image-based PDF.');
      }
      return result;
    } catch (err: any) {
      console.error('PDF extraction error:', err);
      if (err.message?.includes('No text could be extracted')) throw err;
      throw new Error(`Failed to read PDF: ${err.message || 'Unknown error'}. Please try a different file.`);
    }
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
