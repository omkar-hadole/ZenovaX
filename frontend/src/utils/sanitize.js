import DOMPurify from 'dompurify';

/**
 * Sanitizes an HTML string to prevent XSS attacks on the frontend.
 * @param {string} dirty - The unsanitized HTML string.
 * @returns {string} The clean HTML string.
 */
export const sanitizeHTML = (dirty) => {
  if (typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty);
};
