/**
 * Sanitization utilities for user input
 * Prevents XSS attacks by escaping HTML
 */

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Sanitize text for display (basic XSS protection)
 */
export function sanitizeText(text: string): string {
  return escapeHtml(text);
}
