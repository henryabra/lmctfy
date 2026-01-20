/**
 * LMCTFY - Let Me Claude That For You
 * Main entry point: routing and state management
 */

import { playAnimation, skipAnimation } from './animation.js';
import { initShare, showShareModal } from './share.js';
import { trackEvent } from './analytics.js';

// Prefix to identify Base64-encoded queries
const ENCODED_PREFIX = 'b64.';

/**
 * Encode a string to Base64 with prefix (handles Unicode)
 */
function encodeQuery(str) {
  return ENCODED_PREFIX + btoa(encodeURIComponent(str));
}

/**
 * Decode a query string - handles both Base64 (with prefix) and plaintext (legacy)
 */
function decodeQuery(str) {
  if (str.startsWith(ENCODED_PREFIX)) {
    try {
      return decodeURIComponent(atob(str.slice(ENCODED_PREFIX.length)));
    } catch {
      // Invalid Base64, fall through to return as-is
    }
  }
  // Legacy plaintext or invalid Base64 - return as-is
  return str;
}

// State
const state = {
  query: null,
  isPlaying: false,
  countdownInterval: null,
  countdownSeconds: 5,
};

// DOM Elements
const elements = {
  homepage: document.getElementById('homepage'),
  playback: document.getElementById('playback'),
  queryForm: document.getElementById('query-form'),
  queryInput: document.getElementById('query-input'),
  skipBtn: document.getElementById('skip-btn'),
  askClaudeBtn: document.getElementById('ask-claude-btn'),
  countdownNumber: document.getElementById('countdown-number'),
  countdownProgress: document.getElementById('countdown-progress'),
  countdownContainer: document.querySelector('.countdown-container'),
  cancelBtn: document.getElementById('cancel-redirect'),
};

/**
 * Initialize the application
 */
function init() {
  // Parse URL for query parameter
  const params = new URLSearchParams(window.location.search);
  const encodedQuery = params.get('q');
  const query = encodedQuery ? decodeQuery(encodedQuery) : null;

  if (query) {
    // Playback mode
    state.query = query;
    showPlayback();
  } else {
    // Homepage mode
    showHomepage();
  }

  // Initialize share functionality
  initShare();

  // Set up event listeners
  setupEventListeners();
}

/**
 * Show the homepage view
 */
function showHomepage() {
  elements.homepage.classList.remove('hidden');
  elements.playback.classList.add('hidden');
  elements.queryInput.focus();
}

/**
 * Show the playback view and start animation
 */
function showPlayback() {
  elements.homepage.classList.add('hidden');
  elements.playback.classList.remove('hidden');

  // Build Claude URL
  const claudeUrl = `https://claude.ai/new?q=${encodeURIComponent(state.query)}`;

  // Set the "Ask Claude" button href
  if (elements.askClaudeBtn) {
    elements.askClaudeBtn.href = claudeUrl;
  }

  // Start the animation
  state.isPlaying = true;
  playAnimation(state.query, () => {
    state.isPlaying = false;
    // Start countdown when animation ends
    startCountdown(claudeUrl);
  });

  // Show skip button after 2 seconds
  setTimeout(() => {
    if (state.isPlaying) {
      elements.skipBtn.classList.remove('hidden');
    }
  }, 2000);
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Form submission
  elements.queryForm.addEventListener('submit', handleFormSubmit);

  // Skip button
  elements.skipBtn.addEventListener('click', handleSkip);

  // Cancel redirect button
  elements.cancelBtn?.addEventListener('click', cancelCountdown);

  // Ask Claude button also cancels countdown
  elements.askClaudeBtn?.addEventListener('click', () => {
    trackEvent('open_claude', { method: 'button' });
    if (state.countdownInterval) {
      clearInterval(state.countdownInterval);
      state.countdownInterval = null;
    }
  });

  // Handle browser back/forward
  window.addEventListener('popstate', () => {
    const params = new URLSearchParams(window.location.search);
    const encodedQuery = params.get('q');
    const query = encodedQuery ? decodeQuery(encodedQuery) : null;

    if (query) {
      state.query = query;
      showPlayback();
    } else {
      showHomepage();
    }
  });
}

/**
 * Handle form submission
 */
function handleFormSubmit(e) {
  e.preventDefault();

  const query = elements.queryInput.value.trim();
  if (!query) return;

  // Generate the shareable URL (preserve pathname for GitHub Pages subdirectory)
  // Encode query to Base64 so it's not immediately readable in the URL
  const url = new URL(window.location.pathname, window.location.origin);
  url.searchParams.set('q', encodeQuery(query));

  trackEvent('generate_link', { query_length: query.length });

  // Show share modal with the generated URL
  showShareModal(url.toString());
}

/**
 * Handle skip button click
 */
function handleSkip() {
  elements.skipBtn.classList.add('hidden');
  skipAnimation();
  state.isPlaying = false;
  trackEvent('skip_animation');
}

/**
 * Start the countdown timer
 */
function startCountdown(redirectUrl) {
  let seconds = state.countdownSeconds;
  trackEvent('countdown_start');

  // Reset UI
  elements.countdownContainer?.classList.remove('cancelled');
  if (elements.countdownNumber) {
    elements.countdownNumber.textContent = seconds;
  }
  if (elements.countdownProgress) {
    elements.countdownProgress.style.transform = 'scaleX(1)';
    elements.countdownProgress.style.transition = 'none';
  }
  if (elements.cancelBtn) {
    elements.cancelBtn.textContent = 'Cancel';
  }

  // Clear any existing interval
  if (state.countdownInterval) {
    clearInterval(state.countdownInterval);
  }

  // Animate progress bar
  requestAnimationFrame(() => {
    if (elements.countdownProgress) {
      elements.countdownProgress.style.transition = `transform ${state.countdownSeconds}s linear`;
      elements.countdownProgress.style.transform = 'scaleX(0)';
    }
  });

  // Start countdown
  state.countdownInterval = setInterval(() => {
    seconds--;
    if (elements.countdownNumber) {
      elements.countdownNumber.textContent = seconds;
    }

    if (seconds <= 0) {
      clearInterval(state.countdownInterval);
      state.countdownInterval = null;
      trackEvent('open_claude', { method: 'countdown' });
      // Open Claude in new tab, fall back to redirect if blocked
      const newWindow = window.open(redirectUrl, '_blank', 'noopener,noreferrer');
      if (!newWindow) {
        trackEvent('open_claude', { method: 'countdown_fallback' });
        window.location.href = redirectUrl;
      }
    }
  }, 1000);
}

/**
 * Cancel the countdown
 */
function cancelCountdown() {
  if (state.countdownInterval) {
    clearInterval(state.countdownInterval);
    state.countdownInterval = null;
  }

  trackEvent('countdown_cancel');
  elements.countdownContainer?.classList.add('cancelled');
  if (elements.countdownNumber) {
    elements.countdownNumber.textContent = '—';
  }
  if (elements.countdownProgress) {
    elements.countdownProgress.style.transition = 'none';
  }
  if (elements.cancelBtn) {
    elements.cancelBtn.textContent = 'Cancelled';
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
