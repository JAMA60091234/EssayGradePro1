import mammoth from "mammoth";

/**
 * Parse DOCX file content to plain text
 */
export async function parseDocxFromBase64(base64Content: string): Promise<string> {
  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Content, "base64");
    
    // Extract text from DOCX
    const result = await mammoth.extractRawText({ buffer });
    
    return result.value;
  } catch (error) {
    console.error("Error parsing DOCX:", error);
    throw new Error("Failed to parse DOCX file. Please ensure it's a valid Word document.");
  }
}

/**
 * Check if content is a DOCX file marker
 */
export function isDocxMarker(content: string): boolean {
  return content.startsWith("DOCX_FILE:");
}

/**
 * Extract base64 content from DOCX marker
 */
export function extractDocxBase64(content: string): string {
  if (!isDocxMarker(content)) {
    throw new Error("Not a DOCX marker");
  }
  return content.substring("DOCX_FILE:".length);
}
