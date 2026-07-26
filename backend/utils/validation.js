const crypto = require('crypto');
const xss = require('xss');

function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  return trimmed.endsWith('@nst.rishihood.edu.in');
}

function isValidPassword(password) {
  if (typeof password !== 'string') return false;
  const trimmed = password.trim();
  if (trimmed.length < 8) return false;
  const hasNumberOrSpecial = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(trimmed);
  return hasNumberOrSpecial;
}

function isValidName(name) {
  return typeof name === 'string' && name.trim().length >= 2;
}

function isValidBio(bio) {
  return typeof bio === 'string' && bio.trim().length >= 10;
}

function isValidUrl(url) {
  if (typeof url !== 'string' || url.trim().length === 0) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Stricter variant: must be a valid URL AND use https:// only.
// Use this for meetingLink to block http://, javascript:, etc.
function isHttpsUrl(url) {
  if (!isValidUrl(url)) return false;
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return xss(str.trim()); 
}

function isValidArray(arr) {
  return Array.isArray(arr);
}

/**
 * Hash an auth token with SHA-256 before storing in the database.
 * Tokens are cryptographically random hex strings used for refresh,
 * email verification, and password reset flows. Storing them as
 * SHA-256 hashes ensures a database breach does not expose active
 * tokens that could be used to impersonate users.
 */
function hashToken(token) {
  if (typeof token !== 'string' || token.length === 0) return '';
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidName,
  isValidBio,
  isValidUrl,
  isHttpsUrl,
  sanitizeString,
  isValidArray,
  hashToken,
};
