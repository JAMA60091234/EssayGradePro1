/**
 * Utility functions for parsing different file types
 */

/**
 * Parse text content from various file types
 */
export async function parseFileContent(file: File): Promise<string> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  // Plain text files
  if (
    fileType === "text/plain" ||
    fileName.endsWith(".txt")
  ) {
    return await file.text();
  }

  // For DOCX and other binary formats, we'll send to backend
  // For now, return a message indicating the file needs backend processing
  if (
    fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx")
  ) {
    // Return empty string - the backend will handle DOCX parsing via Google Drive or file upload
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    return `DOCX_FILE:${base64}`;
  }

  // DOC files (old Word format)
  if (
    fileType === "application/msword" ||
    fileName.endsWith(".doc")
  ) {
    return await file.text(); // Will show garbled text, but better than nothing
  }

  // Default: try to read as text
  return await file.text();
}

/**
 * Get a user-friendly file type description
 */
export function getFileTypeDescription(file: File): string {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  if (fileType === "text/plain" || fileName.endsWith(".txt")) {
    return "Text file";
  }
  if (
    fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx")
  ) {
    return "Word document";
  }
  if (fileType === "application/msword" || fileName.endsWith(".doc")) {
    return "Word document (legacy)";
  }
  return "Document";
}
