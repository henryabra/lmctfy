/**
 * LMCTFY - Analytics Module
 * Thin wrapper for Google Analytics gtag calls
 */

export function trackEvent(eventName, params = {}) {
  if (typeof gtag === 'function') {
    gtag('event', eventName, params);
  }
}
