export function getOptimizedImageUrl(url, { width, height, format = 'auto', quality = 'auto:good' } = {}) {
  if (!url || !url.includes('cloudinary.com')) return url;
  
  let transformations = `f_${format},q_${quality}`;
  if (width && height) {
    transformations += `,w_${width},h_${height},c_fill`;
  } else if (width) {
    transformations += `,w_${width}`;
  } else if (height) {
    transformations += `,h_${height}`;
  }
  
  return url.replace('/upload/', `/upload/${transformations}/`);
}
