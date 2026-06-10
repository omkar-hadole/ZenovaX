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
  // At least one number or special character
  const hasNumberOrSpecial = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(trimmed);
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

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidName,
  isValidBio,
  isValidUrl,
  isHttpsUrl,
  sanitizeString,
  isValidArray,
};
