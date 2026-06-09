import DOMPurify from 'dompurify';

/**
 * XSS Security Note (Project-wide):
 *
 * React automatically escapes all JSX expressions (e.g., {variable}) before
 * inserting them into the DOM. This means standard JSX text rendering is safe
 * against XSS by default — you do NOT need sanitizeHTML for regular JSX.
 *
 * sanitizeHTML MUST be used when:
 *   1. You use dangerouslySetInnerHTML={{ __html: ... }} to inject raw HTML.
 *   2. You call browser DOM APIs that write raw HTML (e.g., element.innerHTML = ...).
 *
 * ReactMarkdown (used in Zen.jsx for AI responses):
 *   - Does NOT use dangerouslySetInnerHTML by default.
 *   - Raw HTML tags inside markdown are stripped unless the `rehype-raw` plugin
 *     is explicitly installed and enabled. This project does NOT use rehype-raw,
 *     so ReactMarkdown is safe even for untrusted AI-generated content.
 *   - If rehype-raw is ever added, wrap content with sanitizeHTML first:
 *     <ReactMarkdown rehypePlugins={[rehypeRaw]}>
 *       {sanitizeHTML(aiResponseText)}
 *     </ReactMarkdown>
 *
 * Audit result (as of 2026-06-09):
 *   - No dangerouslySetInnerHTML usage found in this codebase.
 *   - No innerHTML DOM sink assignments found in JSX/JS files.
 *   - No document.write or eval() usage found.
 *   - ReactMarkdown renders without rehype-raw — raw HTML is safely stripped.
 */

/**
 * Sanitizes an HTML string using DOMPurify to prevent XSS attacks.
 * Only call this before passing HTML into dangerouslySetInnerHTML or
 * direct DOM innerHTML assignments.
 *
 * @param {string} dirty - The unsanitized HTML string (e.g. from user input or an AI response).
 * @returns {string} A safe HTML string with malicious content stripped.
 *
 * @example
 *   <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(userContent) }} />
 */
export const sanitizeHTML = (dirty) => {
  if (typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty);
};
