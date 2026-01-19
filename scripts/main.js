/**
 * LMCTFY - Let Me Claude That For You
 * Main entry point: routing and state management
 */

import { playAnimation, skipAnimation } from './animation.js';
import { initShare, showShareModal } from './share.js';

// State
const state = {
  query: null,
  isPlaying: false,
};

// DOM Elements
const elements = {
  homepage: document.getElementById('homepage'),
  playback: document.getElementById('playback'),
  queryForm: document.getElementById('query-form'),
  queryInput: document.getElementById('query-input'),
  skipBtn: document.getElementById('skip-btn'),
  askClaudeBtn: document.getElementById('ask-claude-btn'),
};

/**
 * Initialize the application
 */
function init() {
  // Parse URL for query parameter
  const params = new URLSearchParams(window.location.search);
  const query = params.get('q');

  if (query) {
    // Playback mode (URLSearchParams already decodes)
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

  // Set the "Ask Claude" button href
  const claudeUrl = `https://claude.ai/new?q=${encodeURIComponent(state.query)}`;
  elements.askClaudeBtn.href = claudeUrl;

  // Start the animation
  state.isPlaying = true;
  playAnimation(state.query, () => {
    state.isPlaying = false;
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

  // Handle browser back/forward
  window.addEventListener('popstate', () => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');

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
  const url = new URL(window.location.pathname, window.location.origin);
  url.searchParams.set('q', query);

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
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
