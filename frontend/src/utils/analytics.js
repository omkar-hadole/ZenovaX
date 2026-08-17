const GA_MEASUREMENT_ID = 'G-MZ8F4JSN6X';

const gtag = (...args) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
  }
};

export const trackEvent = (name, params = {}) => {
  gtag('event', name, params);
};

export const trackPageView = (path) => {
  gtag('config', GA_MEASUREMENT_ID, { page_path: path });
};