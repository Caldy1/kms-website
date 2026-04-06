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
   CHATBOT — ELEVENLABS + CALENDLY + EMAILJS
   ────────────────────────────────────────── */

// ── Config ──────────────────────────────────
const CHATBOT_CONFIG = {
  agentId:               'agent_6501knhfd05yfp6r682wqhwafmc1',
  calendlyLink:          'https://calendly.com/kyle-calderwood/kms-initial-meeting-webpage',
  emailjsPublicKey:      'b6WB2n_rerHBuUK2c',
  emailjsServiceId:      'service_hvxfrgk',
  emailjsTemplateNotify: 'template_fjuidou',
  emailjsTemplateConfirm:'template_a7121wg',
};

// ── State ────────────────────────────────────
let elevenLabsConv = null;
let voiceActive    = false;
let customerData   = {};

// ── DOM refs ────────────────────────────────
const chatbotBtn        = document.getElementById('chatbotBtn');
const chatbotModal      = document.getElementById('chatbotModal');
const chatbotClose      = document.getElementById('chatbotClose');
const chatbotOverlay    = document.getElementById('chatbotOverlay');
const chatbotTranscript = document.getElementById('chatbotTranscript');
const chatbotTextInput  = document.getElementById('chatbotTextInput');
const chatbotSendBtn    = document.getElementById('chatbotSendBtn');
const chatbotMicBtn     = document.getElementById('chatbotMicBtn');

// ── EmailJS init ─────────────────────────────
if (typeof emailjs !== 'undefined') {
  emailjs.init({ publicKey: CHATBOT_CONFIG.emailjsPublicKey });
}

// ── Modal open/close ─────────────────────────
function openChatbot() {
  chatbotModal.classList.add('open');
  chatbotModal.setAttribute('aria-hidden', 'false');
  chatbotOverlay.classList.add('active');
  chatbotBtn.setAttribute('aria-expanded', 'true');
  if (chatbotTranscript.children.length === 0) {
    appendMessage('agent', "Hi there! I'm the KMS AI Assistant. I can tell you about our services or help you book a discovery call. What would you like to know?");
  }
  setTimeout(() => chatbotClose.focus(), 350);
}

function closeChatbot() {
  chatbotModal.classList.remove('open');
  chatbotModal.setAttribute('aria-hidden', 'true');
  chatbotOverlay.classList.remove('active');
  chatbotBtn.setAttribute('aria-expanded', 'false');
  if (voiceActive) stopVoice();
  chatbotBtn.focus();
}

chatbotBtn.addEventListener('click', openChatbot);
chatbotClose.addEventListener('click', closeChatbot);
chatbotOverlay.addEventListener('click', closeChatbot);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && chatbotModal.classList.contains('open')) closeChatbot();
});

// ── Transcript helpers ───────────────────────
function appendMessage(role, text) {
  const div = document.createElement('div');
  div.className = `chatbot-msg chatbot-msg--${role}`;
  div.textContent = text;
  chatbotTranscript.appendChild(div);
  chatbotTranscript.scrollTop = chatbotTranscript.scrollHeight;
  return div;
}

function showTyping() {
  const div = document.createElement('div');
  div.className = 'chatbot-msg chatbot-msg--typing';
  div.id = 'chatbotTyping';
  div.innerHTML = '<span class="dots-anim">···</span>';
  chatbotTranscript.appendChild(div);
  chatbotTranscript.scrollTop = chatbotTranscript.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById('chatbotTyping');
  if (t) t.remove();
}

// ── Text input ───────────────────────────────
chatbotTextInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendTextMessage();
  }
});
chatbotSendBtn.addEventListener('click', sendTextMessage);

async function sendTextMessage() {
  const text = chatbotTextInput.value.trim();
  if (!text) return;
  chatbotTextInput.value = '';
  appendMessage('user', text);
  showTyping();

  if (/book|call|calendly|schedule|appointment/i.test(text)) {
    removeTyping();
    triggerBooking();
    return;
  }

  try {
    if (elevenLabsConv) {
      await elevenLabsConv.sendUserInput(text);
    } else {
      const res = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${CHATBOT_CONFIG.agentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, conversation_id: customerData.convId || null })
      });
      const data = await res.json();
      if (data.conversation_id) customerData.convId = data.conversation_id;
      removeTyping();
      appendMessage('agent', data.response || data.text || '');
    }
  } catch (err) {
    removeTyping();
    appendMessage('agent', "I'm having a little trouble connecting right now. Please try again or send us a message using the contact form below.");
  }
}

// ── Voice (ElevenLabs SDK) ───────────────────
chatbotMicBtn.addEventListener('click', async () => {
  if (voiceActive) { stopVoice(); return; }
  await startVoice();
});

async function startVoice() {
  if (typeof ElevenLabs === 'undefined') {
    appendMessage('agent', 'Voice is not available right now. Please type your message instead.');
    return;
  }
  try {
    const conv = await ElevenLabs.Conversation.startSession({
      agentId: CHATBOT_CONFIG.agentId,
      onConnect: () => {
        voiceActive = true;
        chatbotMicBtn.setAttribute('aria-pressed', 'true');
        chatbotMicBtn.setAttribute('aria-label', 'Stop voice conversation');
      },
      onDisconnect: () => {
        voiceActive = false;
        chatbotMicBtn.setAttribute('aria-pressed', 'false');
        chatbotMicBtn.setAttribute('aria-label', 'Start voice conversation');
        elevenLabsConv = null;
      },
      onMessage: ({ message, source }) => {
        if (source === 'ai') {
          appendMessage('agent', message);
        } else if (source === 'user') {
          appendMessage('user', message);
        }
      },
      onError: (err) => {
        console.error('ElevenLabs error:', err);
        appendMessage('agent', 'Sorry, there was an issue with the voice connection. Try typing instead.');
        stopVoice();
      },
    });
    elevenLabsConv = conv;
  } catch (err) {
    appendMessage('agent', 'Microphone access is needed for voice. Please allow it or type your message.');
  }
}

function stopVoice() {
  if (elevenLabsConv) {
    elevenLabsConv.endSession();
    elevenLabsConv = null;
  }
  voiceActive = false;
  chatbotMicBtn.setAttribute('aria-pressed', 'false');
}

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
      customer_time:     'Not specified',
      customer_source:   'KMS website contact form',
      calendly_link:     CHATBOT_CONFIG.calendlyLink,
    };

    try {
      if (typeof emailjs !== 'undefined') {
        await Promise.allSettled([
          emailjs.send(CHATBOT_CONFIG.emailjsServiceId, CHATBOT_CONFIG.emailjsTemplateNotify,  params),
          emailjs.send(CHATBOT_CONFIG.emailjsServiceId, CHATBOT_CONFIG.emailjsTemplateConfirm, params),
        ]);
      }
      contactForm.reset();
      contactMsg.textContent = "Thanks! We'll be in touch shortly.";
      contactMsg.style.color = '';
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
