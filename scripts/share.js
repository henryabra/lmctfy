/**
 * LMCTFY - Share Utilities
 * Handles copy, share, and modal functionality
 */

// DOM Elements (cached on first use)
let els = null;

function getElements() {
  if (els) return els;

  els = {
    modal: document.getElementById('share-modal'),
    modalBackdrop: document.querySelector('.modal-backdrop'),
    modalClose: document.querySelector('.modal-close'),
    shareUrl: document.getElementById('share-url'),
    copyBtn: document.getElementById('copy-btn'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message'),
    shareTwitter: document.getElementById('share-twitter'),
    shareLinkedin: document.getElementById('share-linkedin'),
    shareSlack: document.getElementById('share-slack'),
  };

  return els;
}

/**
 * Initialize share functionality
 */
export function initShare() {
  const elements = getElements();

  // Close modal on backdrop click
  elements.modalBackdrop?.addEventListener('click', hideShareModal);

  // Close modal on close button
  elements.modalClose?.addEventListener('click', hideShareModal);

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !elements.modal.classList.contains('hidden')) {
      hideShareModal();
    }
  });

  // Copy button
  elements.copyBtn?.addEventListener('click', handleCopy);

  // Social share buttons
  elements.shareTwitter?.addEventListener('click', shareToTwitter);
  elements.shareLinkedin?.addEventListener('click', shareToLinkedIn);
  elements.shareSlack?.addEventListener('click', copyForSlack);
}

/**
 * Show the share modal with a URL
 */
export function showShareModal(url) {
  const elements = getElements();

  elements.shareUrl.value = url;
  elements.modal.classList.remove('hidden');

  // Focus the URL input and select it
  setTimeout(() => {
    elements.shareUrl.select();
  }, 100);
}

/**
 * Hide the share modal
 */
export function hideShareModal() {
  const elements = getElements();
  elements.modal.classList.add('hidden');
}

/**
 * Handle copy button click
 */
async function handleCopy() {
  const elements = getElements();
  const url = elements.shareUrl.value;

  try {
    await navigator.clipboard.writeText(url);

    // Update button state
    elements.copyBtn.classList.add('copied');
    elements.copyBtn.querySelector('span').textContent = 'Copied!';

    // Show toast
    showToast('Link copied to clipboard!');

    // Reset button after 2 seconds
    setTimeout(() => {
      elements.copyBtn.classList.remove('copied');
      elements.copyBtn.querySelector('span').textContent = 'Copy';
    }, 2000);
  } catch (err) {
    // Fallback for older browsers
    elements.shareUrl.select();
    document.execCommand('copy');
    showToast('Link copied!');
  }
}

/**
 * Show a toast notification
 */
function showToast(message, duration = 3000) {
  const elements = getElements();

  elements.toastMessage.textContent = message;
  elements.toast.classList.remove('hidden');
  elements.toast.classList.add('visible');

  setTimeout(() => {
    elements.toast.classList.remove('visible');
    setTimeout(() => {
      elements.toast.classList.add('hidden');
    }, 300);
  }, duration);
}

/**
 * Share to X (Twitter)
 */
function shareToTwitter() {
  const url = document.getElementById('share-url').value;
  if (!url) return;

  const text = "Let me Claude that for you 🤖";
  const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  window.open(xUrl, '_blank');
}

/**
 * Share to LinkedIn
 */
function shareToLinkedIn() {
  const url = document.getElementById('share-url').value;
  if (!url) return;

  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  window.open(linkedinUrl, '_blank');
}

/**
 * Copy formatted message for Slack
 */
async function copyForSlack() {
  const url = document.getElementById('share-url').value;
  if (!url) return;

  const message = `Let me Claude that for you: ${url}`;

  try {
    await navigator.clipboard.writeText(message);
    showToast('Copied for Slack!');
  } catch (err) {
    showToast('Copy the link manually');
  }
}
