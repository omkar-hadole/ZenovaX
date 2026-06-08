const xss = require('xss');

function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  const basicFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return basicFormat.test(trimmed);
}

function isValidPassword(password) {
  return typeof password === 'string' && password.trim().length >= 6;
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
