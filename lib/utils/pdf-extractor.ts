import { extractText } from 'unpdf';

export interface ClientPdfExtractionResult {
  success: boolean;
  text?: string;
  totalPages?: number;
  error?: string;
}

/**
 * Extracts text and total page count directly from a PDF ArrayBuffer or Uint8Array.
 * Works seamlessly in Browser (Client-side) and Edge / Node.js runtimes without calling Gemini.
 */
export async function extractPdfTextDirect(
  data: ArrayBuffer | Uint8Array
): Promise<ClientPdfExtractionResult> {
  try {
    const { text, totalPages } = await extractText(data);
    const combinedText = Array.isArray(text) ? text.join('\n\n') : String(text || '');
    const cleanText = combinedText.trim();

    return {
      success: cleanText.length >= 50,
      text: cleanText,
      totalPages: totalPages || 1,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
