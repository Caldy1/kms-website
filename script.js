/* ============================================================
   KMS — AI Transition & Automation
   script.js
   ============================================================ */

'use strict';

/* ──────────────────────────────────────────
   SCROLL FADE-IN (IntersectionObserver)
   ────────────────────────────────────────── */
const fadeElements = document.querySelectorAll('.fade-in');

const fadeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px',
  }
);

fadeElements.forEach((el) => fadeObserver.observe(el));

// Hero elements animate in on page load (not waiting for scroll)
window.addEventListener('DOMContentLoaded', () => {
  const heroFades = document.querySelectorAll('.hero .fade-in');
  heroFades.forEach((el, index) => {
    setTimeout(() => el.classList.add('visible'), index * 160);
  });
});

/* ──────────────────────────────────────────
   STICKY NAV
   ────────────────────────────────────────── */
const nav = document.getElementById('nav');

/* ──────────────────────────────────────────
   MOBILE NAVIGATION TOGGLE
   ────────────────────────────────────────── */
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', isOpen);
  // Prevent body scroll while mobile menu is open
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

// Close menu when a link is clicked
navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && navLinks.classList.contains('open')) {
    navLinks.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    navToggle.focus();
  }
});

/* ──────────────────────────────────────────
   CHATBOT — ELEVENLABS CONVERSATIONAL AI
   ────────────────────────────────────────── */

// ── Config ──────────────────────────────────
const CHATBOT_CONFIG = {
  agentId:            'agent_6501knhfd05yfp6r682wqhwafmc1',
  calendlyLink:       'https://calendly.com/kyle-calderwood/kms-initial-meeting-webpage',
  emailjsPublicKey:   'b6WB2n_rerHBuUK2c',
  emailjsServiceId:   'service_hvxfrgk',
  emailjsTemplateNotify:  'template_fjuidou',
  emailjsTemplateConfirm: 'template_a7121wg',
  sdkUrl:             'https://cdn.jsdelivr.net/npm/@11labs/client/+esm',
  sessionMaxSeconds:  300,
  proactiveDelayMs:   45000,
};

// ── State ────────────────────────────────────
let elConversation   = null;
let sessionActive    = false;
let sessionTimer     = null;
let secondsLeft      = CHATBOT_CONFIG.sessionMaxSeconds;
let proactiveTimer   = null;
let isPanelOpen      = false;
let sdkModule        = null;
let sessionAborted   = false;

// ── DOM refs ────────────────────────────────
const chatbotBtn         = document.getElementById('chatbotBtn');
const chatbotPanel       = document.getElementById('chatbotPanel');
const chatbotClose       = document.getElementById('chatbotClose');
const chatbotOverlay     = document.getElementById('chatbotOverlay');
const chatbotStartScreen = document.getElementById('chatbotStartScreen');
const chatbotStartBtn    = document.getElementById('chatbotStartBtn');
const chatbotLoading     = document.getElementById('chatbotLoading');
const chatbotTranscript  = document.getElementById('chatbotTranscript');
const chatbotChips       = document.getElementById('chatbotChips');
const chatbotMicArea     = document.getElementById('chatbotMicArea');
const chatbotMicBtn      = document.getElementById('chatbotMicBtn');
const chatbotVoiceLabel  = document.getElementById('chatbotVoiceLabel');
const chatbotSessionEnd  = document.getElementById('chatbotSessionEnd');
const chatbotTimerEl     = document.getElementById('chatbotTimer');
const chatbotStatusBar   = document.getElementById('chatbotStatusBar');
const chatbotStatusText  = document.getElementById('chatbotStatusText');
const chatbotWaveform    = document.getElementById('chatbotWaveform');
const chatbotRestartBtn  = document.getElementById('chatbotRestartBtn');
const chatbotGotoContact = document.getElementById('chatbotGotoContact');

// ── Panel open/close ─────────────────────────
chatbotBtn.addEventListener('click', () => {
  isPanelOpen ? closePanel() : openPanel();
});

chatbotClose.addEventListener('click', closePanel);
chatbotOverlay.addEventListener('click', closePanel);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isPanelOpen) closePanel();
});

function openPanel() {
  isPanelOpen = true;
  chatbotPanel.style.display = 'flex';
  chatbotBtn.setAttribute('aria-expanded', 'true');
  chatbotOverlay.classList.add('active');
  removeBadge();
  clearTimeout(proactiveTimer);
}

function closePanel() {
  isPanelOpen = false;
  sessionAborted = true;
  chatbotPanel.style.display = 'none';
  chatbotBtn.setAttribute('aria-expanded', 'false');
  chatbotOverlay.classList.remove('active');
  if (sessionActive) {
    endSession(false);
  } else if (elConversation) {
    // Connected but onSessionConnected not yet run
    elConversation.endSession().catch(() => {});
    elConversation = null;
  }
  resetToStartScreen();
}

function resetToStartScreen() {
  chatbotTranscript.style.display  = 'none';
  chatbotChips.style.display       = 'none';
  chatbotMicArea.style.display     = 'none';
  chatbotStatusBar.style.display   = 'none';
  chatbotTimerEl.style.display     = 'none';
  chatbotSessionEnd.style.display  = 'none';
  chatbotLoading.style.display     = 'none';
  chatbotTimerEl.classList.remove('warning');
  secondsLeft = CHATBOT_CONFIG.sessionMaxSeconds;
  chatbotTranscript.innerHTML = '';
  chatbotStartScreen.style.display = 'flex';
}

// ── Session buttons ──────────────────────────
chatbotStartBtn.addEventListener('click', () => {
  // Unlock AudioContext synchronously within user gesture (required for iOS Safari)
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (AudioCtx) {
    try {
      const ctx = new AudioCtx();
      ctx.resume().then(() => ctx.close()).catch(() => {});
    } catch (e) {}
  }
  initSession();
});

chatbotRestartBtn.addEventListener('click', resetToStartScreen);

chatbotGotoContact.addEventListener('click', () => {
  closePanel();
  const contactEl = document.getElementById('contact');
  if (contactEl) contactEl.scrollIntoView({ behavior: 'smooth' });
});

// ── Quick chips ──────────────────────────────
chatbotChips.querySelectorAll('.chatbot-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    if (!sessionActive) return;
    const hints = {
      services: 'Say: "What services do you offer?"',
      how:      'Say: "How does the process work?"',
      book:     'Say: "I\'d like to book a discovery call"',
    };
    const hint = hints[chip.dataset.action];
    if (!hint) return;
    const old = chatbotTranscript.querySelector('.chatbot-msg--hint');
    if (old) old.remove();
    const hintEl = document.createElement('div');
    hintEl.className = 'chatbot-msg chatbot-msg--system chatbot-msg--hint';
    hintEl.textContent = hint;
    chatbotTranscript.appendChild(hintEl);
    chatbotTranscript.scrollTop = chatbotTranscript.scrollHeight;
    setTimeout(() => { if (hintEl.parentNode) hintEl.remove(); }, 4000);
  });
});

// ── Session init ─────────────────────────────
async function initSession() {
  sessionAborted = false;
  chatbotStartScreen.style.display = 'none';
  chatbotLoading.style.display     = 'flex';

  try {
    await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

    const { Conversation } = sdkModule || await import(CHATBOT_CONFIG.sdkUrl);

    const connectTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timed out')), 15000)
    );

    elConversation = await Promise.race([
      Conversation.startSession({
        agentId: CHATBOT_CONFIG.agentId,

        onDisconnect: () => {
          if (sessionActive) endSession(true);
        },

        onMessage: (msg) => {
          if (msg && msg.message) {
            addMessage(msg.source === 'user' ? 'user' : 'ai', msg.message);
          }
        },

        onModeChange: (modeObj) => {
          setMode(modeObj && modeObj.mode ? modeObj.mode : 'idle');
        },

        onError: (err) => {
          console.error('[KMS AI]', err);
          addMessage('system', 'Connection issue — please try again.');
          endSession(false);
        },
      }),
      connectTimeout,
    ]);

    // If user closed the panel while we were connecting, clean up immediately
    if (sessionAborted) {
      elConversation.endSession().catch(() => {});
      elConversation = null;
      return;
    }

    // startSession resolves when the WebSocket is connected — show the UI now
    onSessionConnected();

  } catch (err) {
    console.error('[KMS AI] Failed to start:', err);
    if (elConversation) { elConversation.endSession().catch(() => {}); elConversation = null; }
    chatbotLoading.style.display     = 'none';
    chatbotStartScreen.style.display = 'flex';
    const errNote = document.createElement('p');
    errNote.style.cssText = 'font-size:0.78rem;color:#e88;margin-top:-6px;text-align:center;';
    errNote.textContent = (err && err.name === 'NotAllowedError')
      ? 'Microphone access denied. Please allow it and try again.'
      : 'Could not connect. Please try the contact form below.';
    chatbotStartBtn.insertAdjacentElement('afterend', errNote);
    setTimeout(() => errNote.remove(), 6000);
  }
}

function onSessionConnected() {
  sessionActive = true;
  chatbotLoading.style.display     = 'none';
  chatbotTranscript.style.display  = 'flex';
  chatbotChips.style.display       = 'flex';
  chatbotMicArea.style.display     = 'flex';
  chatbotStatusBar.style.display   = 'flex';
  chatbotTimerEl.style.display     = 'block';
  chatbotMicBtn.classList.remove('disabled');
  startSessionTimer();
  setMode('listening');
}

// ── Session timer ────────────────────────────
function startSessionTimer() {
  secondsLeft = CHATBOT_CONFIG.sessionMaxSeconds;
  updateTimerDisplay();
  sessionTimer = setInterval(() => {
    secondsLeft--;
    updateTimerDisplay();
    if (secondsLeft <= 30) chatbotTimerEl.classList.add('warning');
    if (secondsLeft <= 0)  endSession(true);
  }, 1000);
}

function updateTimerDisplay() {
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  chatbotTimerEl.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
}

function endSession(showEnd) {
  sessionActive = false;
  clearInterval(sessionTimer);
  if (elConversation) {
    elConversation.endSession().catch(() => {});
    elConversation = null;
  }
  chatbotMicBtn.classList.add('disabled');
  setMode('idle');
  chatbotBtn.classList.remove('speaking');
  if (showEnd) {
    chatbotTranscript.style.display = 'none';
    chatbotChips.style.display      = 'none';
    chatbotMicArea.style.display    = 'none';
    chatbotStatusBar.style.display  = 'none';
    chatbotTimerEl.style.display    = 'none';
    chatbotSessionEnd.style.display = 'flex';
  }
}

// ── Mode / waveform ──────────────────────────
function setMode(mode) {
  chatbotWaveform.className = 'chatbot-waveform';
  chatbotBtn.classList.remove('speaking');
  chatbotMicBtn.classList.remove('listening');
  switch (mode) {
    case 'speaking':
      chatbotWaveform.classList.add('speaking');
      chatbotStatusText.textContent = 'Speaking…';
      chatbotBtn.classList.add('speaking');
      break;
    case 'listening':
      chatbotWaveform.classList.add('listening');
      chatbotStatusText.textContent = 'Listening…';
      chatbotMicBtn.classList.add('listening');
      break;
    case 'processing':
      chatbotStatusText.textContent = 'Thinking…';
      break;
    default:
      chatbotStatusText.textContent = 'Ready';
  }
}

// ── Transcript ───────────────────────────────
function addMessage(type, text) {
  if (!text || !text.trim()) return;
  const div = document.createElement('div');
  div.className = `chatbot-msg chatbot-msg--${type}`;
  div.textContent = text;
  chatbotTranscript.appendChild(div);
  chatbotTranscript.scrollTop = chatbotTranscript.scrollHeight;
}

// ── Pre-load SDK to minimise async hops on first click ───────────────────────
import(CHATBOT_CONFIG.sdkUrl).then((mod) => { sdkModule = mod; }).catch(() => {});

// ── Proactive badge (45s after page load) ────────────────────────────────────
proactiveTimer = setTimeout(() => {
  if (!isPanelOpen && !sessionActive) addBadge('Ask KMS AI');
}, CHATBOT_CONFIG.proactiveDelayMs);

const contactSection = document.getElementById('contact');
if (contactSection) {
  new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) { clearTimeout(proactiveTimer); removeBadge(); }
  }, { threshold: 0.3 }).observe(contactSection);
}

function addBadge(text) {
  if (chatbotBtn.querySelector('.chatbot-badge')) return;
  const badge = document.createElement('div');
  badge.className = 'chatbot-badge';
  badge.textContent = text;
  chatbotBtn.appendChild(badge);
}

function removeBadge() {
  const b = chatbotBtn.querySelector('.chatbot-badge');
  if (b) b.remove();
}

window.addEventListener('pagehide', () => {
  if (sessionActive && elConversation) elConversation.endSession().catch(() => {});
});

// ── Contact form (EmailJS) ───────────────────
const contactForm   = document.getElementById('contactForm');
const contactSubmit = document.getElementById('contactSubmit');
const contactMsg    = document.getElementById('contactFormMsg');

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name    = document.getElementById('contactName').value.trim();
    const email   = document.getElementById('contactEmail').value.trim();
    if (!name || !email) {
      contactMsg.textContent = 'Please fill in your name and email.';
      contactMsg.style.color = '#e88';
      return;
    }

    contactSubmit.disabled = true;
    contactSubmit.textContent = 'Sending…';
    contactMsg.textContent = '';
    contactMsg.style.color = '';

    const params = {
      customer_name:     name,
      customer_email:    email,
      customer_phone:    document.getElementById('contactPhone').value.trim()   || 'Not provided',
      customer_company:  document.getElementById('contactCompany').value.trim() || 'Not provided',
      customer_interest: document.getElementById('contactService').value        || 'Not specified',
      customer_message:  document.getElementById('contactMessage').value.trim() || 'Not provided',
      customer_time:     'Not specified',
      customer_source:   'KMS website contact form',
      calendly_link:     CHATBOT_CONFIG.calendlyLink,
    };

    try {
      if (typeof emailjs !== 'undefined') {
        await Promise.allSettled([
          emailjs.send(CHATBOT_CONFIG.emailjsServiceId, CHATBOT_CONFIG.emailjsTemplateNotify,  params, { publicKey: CHATBOT_CONFIG.emailjsPublicKey }),
          emailjs.send(CHATBOT_CONFIG.emailjsServiceId, CHATBOT_CONFIG.emailjsTemplateConfirm, params, { publicKey: CHATBOT_CONFIG.emailjsPublicKey }),
        ]);
      }
      contactForm.reset();
      contactMsg.textContent = "Thanks! We'll be in touch shortly.";
      contactMsg.style.color = '';
      if (typeof Calendly !== 'undefined') {
        Calendly.showPopupWidget(CHATBOT_CONFIG.calendlyLink);
      }
    } catch (err) {
      contactMsg.textContent = 'Something went wrong. Please email us directly at hello@kms-ai.co.uk';
      contactMsg.style.color = '#e88';
    } finally {
      contactSubmit.disabled = false;
      contactSubmit.textContent = 'Send Enquiry';
    }
  });
}

/* ──────────────────────────────────────────
   HERO CANVAS — NEURAL NETWORK ANIMATION
   ────────────────────────────────────────── */
function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const COUNT    = 80;
  const MAX_DIST = 220;

  const nodes = Array.from({ length: COUNT }, () => ({
    x:  Math.random() * canvas.width,
    y:  Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.45,
    vy: (Math.random() - 0.5) * 0.45,
    r:  Math.random() * 2 + 1,
    o:  Math.random() * 0.35 + 0.45,  // 0.45 – 0.80 opacity
  }));

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections first (below nodes)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx   = nodes[i].x - nodes[j].x;
        const dy   = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * 0.35;  // up from 0.12
          ctx.beginPath();
          ctx.strokeStyle = `rgba(74,234,165,${alpha})`;
          ctx.lineWidth   = 0.9;
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw nodes with a subtle glow
    nodes.forEach((n) => {
      // Glow halo
      const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 4);
      grd.addColorStop(0, `rgba(74,234,165,${n.o * 0.4})`);
      grd.addColorStop(1, 'rgba(74,234,165,0)');
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(74,234,165,${n.o})`;
      ctx.fill();

      // Move
      n.x += n.vx;
      n.y += n.vy;

      // Soft bounce at edges
      if (n.x < 0 || n.x > canvas.width)  n.vx *= -1;
      if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
    });

    requestAnimationFrame(frame);
  }

  frame();
}

initHeroCanvas();

/* ──────────────────────────────────────────
   CALENDLY POPUP — CTA BUTTONS
   ────────────────────────────────────────── */
[document.querySelector('.nav__cta'), document.querySelector('.hero__actions .btn--primary')].forEach((el) => {
  if (!el) return;
  el.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    if (typeof Calendly !== 'undefined') {
      Calendly.showPopupWidget(CHATBOT_CONFIG.calendlyLink);
    }
  });
});

/* ──────────────────────────────────────────
   SMOOTH SCROLL (for browsers that need it)
   ────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    const target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      const navHeight = nav.offsetHeight;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - navHeight - 12;
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    }
  });
});
