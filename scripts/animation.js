/**
 * LMCTFY - Animation Controller
 * Handles the playback sequence for the demo
 */

// Animation state
let animationState = {
  currentStage: 0,
  isSkipped: false,
  timeouts: [],
  onComplete: null,
};

// DOM Elements (cached on first use)
let els = null;

function getElements() {
  if (els) return els;

  els = {
    stageBranding: document.getElementById('stage-branding'),
    stageClaude: document.getElementById('stage-claude'),
    stageEnding: document.getElementById('stage-ending'),
    skipBtn: document.getElementById('skip-btn'),
    claudeHome: document.getElementById('claude-home'),
    claudeChat: document.getElementById('claude-chat'),
    typingText: document.getElementById('typing-text'),
    cursor: document.getElementById('cursor'),
    sendBtn: document.getElementById('send-btn'),
    userMessage: document.getElementById('user-message'),
    claudeResponse: document.getElementById('claude-response'),
    thinkingIndicator: document.getElementById('thinking-indicator'),
    animatedCursor: document.getElementById('animated-cursor'),
  };

  return els;
}

/**
 * Schedule a timeout that can be cleared on skip
 */
function scheduleTimeout(callback, delay) {
  const id = setTimeout(() => {
    if (!animationState.isSkipped) {
      callback();
    }
  }, delay);
  animationState.timeouts.push(id);
  return id;
}

/**
 * Clear all scheduled timeouts
 */
function clearAllTimeouts() {
  animationState.timeouts.forEach(id => clearTimeout(id));
  animationState.timeouts = [];
}

/**
 * Show a stage and hide others
 */
function showStage(stageElement) {
  const elements = getElements();

  // Hide all stages
  elements.stageBranding.classList.remove('active');
  elements.stageBranding.classList.add('hidden');
  elements.stageClaude.classList.remove('active');
  elements.stageClaude.classList.add('hidden');
  elements.stageEnding.classList.remove('active');
  elements.stageEnding.classList.add('hidden');

  // Show target stage
  stageElement.classList.remove('hidden');
  // Force reflow for transition
  void stageElement.offsetWidth;
  stageElement.classList.add('active');
}

/**
 * Type text character by character
 */
function typeText(text, element, speed = 80) {
  return new Promise((resolve) => {
    let index = 0;
    element.textContent = '';

    function typeChar() {
      if (animationState.isSkipped) {
        element.textContent = text;
        resolve();
        return;
      }

      if (index < text.length) {
        element.textContent += text[index];
        index++;
        scheduleTimeout(typeChar, speed);
      } else {
        resolve();
      }
    }

    typeChar();
  });
}

/**
 * Move the animated cursor to a position
 */
function moveCursor(x, y, duration = 800) {
  return new Promise((resolve) => {
    const elements = getElements();
    const cursor = elements.animatedCursor;

    // Check if mobile (no cursor animation)
    if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
      resolve();
      return;
    }

    cursor.classList.add('visible');
    cursor.style.transition = `left ${duration}ms cubic-bezier(0.16, 1, 0.3, 1), top ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
    cursor.style.left = `${x}px`;
    cursor.style.top = `${y}px`;

    scheduleTimeout(resolve, duration);
  });
}

/**
 * Hide the animated cursor
 */
function hideCursor() {
  const elements = getElements();
  elements.animatedCursor.classList.remove('visible');
}

/**
 * Simulate a click animation on an element
 */
function simulateClick(element) {
  element.classList.add('clicked');
  setTimeout(() => element.classList.remove('clicked'), 150);
}

/**
 * Play the full animation sequence
 */
export async function playAnimation(query, onComplete) {
  const elements = getElements();

  // Reset state
  animationState = {
    currentStage: 0,
    isSkipped: false,
    timeouts: [],
    onComplete,
  };

  // Reset UI elements
  elements.typingText.textContent = '';
  elements.userMessage.textContent = '';
  elements.claudeHome.classList.remove('hidden');
  elements.claudeChat.classList.add('hidden');
  elements.claudeResponse.classList.add('hidden');
  elements.cursor.style.display = 'inline-block';
  hideCursor();

  // Stage 1: Show branding (1.5s)
  showStage(elements.stageBranding);
  await sleep(1500);
  if (animationState.isSkipped) return showEnding(query);

  // Stage 2: Transition to Claude interface
  showStage(elements.stageClaude);
  await sleep(500);
  if (animationState.isSkipped) return showEnding(query);

  // Get input position for cursor animation
  const inputRect = elements.typingText.getBoundingClientRect();
  const inputX = inputRect.left + 20;
  const inputY = inputRect.top + inputRect.height / 2;

  // Move cursor to input (desktop only)
  if (!window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
    // Start cursor from top-right
    elements.animatedCursor.style.left = `${window.innerWidth - 100}px`;
    elements.animatedCursor.style.top = '100px';
    elements.animatedCursor.style.transition = 'none';
    void elements.animatedCursor.offsetWidth;

    await moveCursor(inputX, inputY, 1000);
    if (animationState.isSkipped) return showEnding(query);
  }

  await sleep(300);
  if (animationState.isSkipped) return showEnding(query);

  // Type the query
  await typeText(query, elements.typingText, 80);
  if (animationState.isSkipped) return showEnding(query);

  await sleep(400);
  if (animationState.isSkipped) return showEnding(query);

  // Move cursor to send button and click
  if (!window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
    const sendRect = elements.sendBtn.getBoundingClientRect();
    await moveCursor(sendRect.left + sendRect.width / 2, sendRect.top + sendRect.height / 2, 600);
    if (animationState.isSkipped) return showEnding(query);

    simulateClick(elements.sendBtn);
    await sleep(200);
  }

  hideCursor();

  // Hide cursor in input
  elements.cursor.style.display = 'none';

  // Transition to chat view
  elements.claudeHome.classList.add('hidden');
  elements.claudeChat.classList.remove('hidden');
  elements.userMessage.textContent = query;

  await sleep(500);
  if (animationState.isSkipped) return showEnding(query);

  // Show Claude thinking
  elements.claudeResponse.classList.remove('hidden');

  // Wait for "thinking" animation
  await sleep(2000);
  if (animationState.isSkipped) return showEnding(query);

  // Stage 3: Show ending
  showEnding(query);
}

/**
 * Show the ending stage
 */
function showEnding(query) {
  const elements = getElements();

  // Hide skip button
  elements.skipBtn.classList.add('hidden');

  // Show ending stage
  showStage(elements.stageEnding);

  // Call completion callback
  if (animationState.onComplete) {
    animationState.onComplete();
  }
}

/**
 * Skip to the end of the animation
 */
export function skipAnimation() {
  animationState.isSkipped = true;
  clearAllTimeouts();

  // Get query from URL
  const params = new URLSearchParams(window.location.search);
  const query = params.get('q') || '';

  showEnding(query);
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise((resolve) => {
    scheduleTimeout(resolve, ms);
  });
}
