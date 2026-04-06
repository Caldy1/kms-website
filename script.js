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
let bookingStep    = null; // null | 'name' | 'email'

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
    appendMessage('agent', "Your business probably runs on repetition. Mine runs on eliminating it. I'm the KMS Assistant — ask me what we do, or say 'book a call' and I'll get you sorted.");
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

// ── Rule-based text responses ────────────────
function getBotResponse(text) {
  const t = text.toLowerCase();

  if (/automat|workflow|data flow|integrat|manual|repetit|zapier|make\.com|n8n/i.test(t)) {
    return "AI Automation & Data Flows is one of our core services — we connect your apps and eliminate manual data entry entirely. We map, build, and maintain your full automation stack so nothing slips through the cracks. Want to book a quick call to talk through what we could automate for you?";
  }
  if (/chatbot|chat bot|chat agent|website bot|customer agent|live chat/i.test(t)) {
    return "We build 24/7 AI chatbots that sit on your website, qualify leads, answer questions, and book calls while you sleep — fully custom, not a generic widget. Sound useful? I can get a discovery call booked for you.";
  }
  if (/phone|voice agent|call agent|inbound call|missed call/i.test(t)) {
    return "Our AI Phone Agents handle inbound calls around the clock — they take messages, answer common questions, and route calls intelligently. No more missed calls, no more voicemail black holes. Want to find out how this would work for your business?";
  }
  if (/web|website|landing page|web app|platform|build.*site|site.*build/i.test(t)) {
    return "We build custom web apps and websites — conversion-focused and built to work as hard as you do. From landing pages to full-stack platforms, all done-for-you. Want to talk through what you need?";
  }
  if (/geo|generative engine|chatgpt.*find|perplexity|gemini|ai search|found.*ai|ai.*found/i.test(t)) {
    return "GEO — Generative Engine Optimisation — is about being recommended when someone asks ChatGPT, Perplexity or Gemini about your industry. Traditional SEO won't get you there. We structure your content and authority signals so AI recommends your business first. Want to know more?";
  }
  if (/custom|bespoke|specific|unique|tailored|internal tool/i.test(t)) {
    return "Our Custom AI Solutions are fully bespoke — built around how your business actually operates. Internal productivity tools, customer-facing products, things your competitors don't have yet. Want to run your idea past us on a quick call?";
  }
  if (/how.*work|process|what.*happen|step|discover.*build|build.*grow/i.test(t)) {
    return "We work in three steps: Discover — we audit your business and find every bottleneck AI can fix. Build — we design and deploy your custom AI stack, fully done-for-you. Grow — we stay on as your ongoing AI partner. No hand-off, no disappearing act.";
  }
  if (/why.*kms|why.*you|different|stand out|better than|compare/i.test(t)) {
    return "A few things set us apart: everything is fully done-for-you with no learning curve on your end, every solution is custom-built for your specific business, we're AI-native from day one, and we stay involved long after launch. We're a partner, not a project.";
  }
  if (/price|pricing|cost|how much|fee|charge|rate|budget/i.test(t)) {
    return "Pricing depends on the scope — every project is custom so we don't have off-the-shelf rates. The best way to get a clear picture is a free 30-minute discovery call. No obligation, no jargon. Want me to get one booked for you?";
  }
  if (/where|location|based|glasgow|scotland|uk|who are you/i.test(t)) {
    return "KMS is based in Glasgow, Scotland. We work with businesses across the UK and beyond — everything we do is remote-first so location is never a barrier.";
  }
  if (/^(hi|hello|hey|hiya|howdy|morning|afternoon|evening|sup)[\s!?.]*$/i.test(t)) {
    return "Hey! Good to have you here. Ask me anything about what KMS does, or say 'book a call' and I'll get you sorted in a couple of minutes.";
  }
  if (/thank|thanks|cheers|appreciate/i.test(t)) {
    return "No problem at all! If there's anything else you want to know, just ask — or I can get a discovery call booked whenever you're ready.";
  }

  return "That's a bit outside what I can help with here — but if you've got questions about what KMS does or want to book a free call, I'm all over it.";
}

// ── Booking flow ─────────────────────────────
function triggerBooking() {
  bookingStep = 'name';
  appendMessage('agent', "I'd love to get you booked in — it'll only take a moment. Can I grab your name first?");
}

async function handleBookingStep(text) {
  if (bookingStep === 'name') {
    customerData.name = text;
    bookingStep = 'email';
    setTimeout(() => appendMessage('agent', `Great, ${customerData.name}! And your email address?`), 400);
    return;
  }
  if (bookingStep === 'email') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
      appendMessage('agent', "That doesn't look quite right — can you double-check your email?");
      return;
    }
    customerData.email = text;
    bookingStep = null;
    setTimeout(() => appendMessage('agent', `Perfect — opening the booking calendar for you now, ${customerData.name}. Pick whatever time suits.`), 400);
    setTimeout(() => {
      if (typeof Calendly !== 'undefined') {
        Calendly.initPopupWidget({
          url: CHATBOT_CONFIG.calendlyLink,
          prefill: { name: customerData.name, email: customerData.email },
        });
      }
      if (typeof emailjs !== 'undefined') {
        const params = {
          customer_name:    customerData.name,
          customer_email:   customerData.email,
          customer_phone:   'Not provided',
          customer_interest:'Not specified',
          customer_source:  'KMS chatbot',
          message:          'Booking initiated via chatbot.',
        };
        Promise.allSettled([
          emailjs.send(CHATBOT_CONFIG.emailjsServiceId, CHATBOT_CONFIG.emailjsTemplateNotify,  params),
          emailjs.send(CHATBOT_CONFIG.emailjsServiceId, CHATBOT_CONFIG.emailjsTemplateConfirm, params),
        ]);
      }
    }, 900);
  }
}

// ── Text input ───────────────────────────────
chatbotTextInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendTextMessage();
  }
});
chatbotSendBtn.addEventListener('click', sendTextMessage);

function sendTextMessage() {
  const text = chatbotTextInput.value.trim();
  if (!text) return;
  chatbotTextInput.value = '';
  appendMessage('user', text);

  // Booking flow takes priority
  if (bookingStep) {
    handleBookingStep(text);
    return;
  }

  // Check for booking intent
  if (/book|call|speak|schedule|appointment|meeting|discovery|calendar|next step|get in touch|interested/i.test(text)) {
    triggerBooking();
    return;
  }

  // Rule-based FAQ response
  showTyping();
  setTimeout(() => {
    removeTyping();
    appendMessage('agent', getBotResponse(text));
  }, 600);
}

// ── Voice (ElevenLabs SDK) ───────────────────
chatbotMicBtn.addEventListener('click', async () => {
  if (voiceActive) { stopVoice(); return; }
  await startVoice();
});

async function startVoice() {
  const EL = window.ElevenLabsClient || window.ElevenLabs;
  if (!EL) {
    appendMessage('agent', 'Voice is not available right now — please type your message instead.');
    return;
  }
  try {
    const conv = await EL.Conversation.startSession({
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
        if (source === 'ai')   appendMessage('agent', message);
        if (source === 'user') appendMessage('user',  message);
      },
      onError: (err) => {
        console.error('ElevenLabs error:', err);
        appendMessage('agent', 'There was an issue with the voice connection. Please try typing instead.');
        stopVoice();
      },
    });
    elevenLabsConv = conv;
  } catch (err) {
    appendMessage('agent', 'Microphone access is needed for voice. Please allow it in your browser, or type your message.');
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
