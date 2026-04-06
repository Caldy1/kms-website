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
   CHATBOT MODAL
   ────────────────────────────────────────── */
const chatbotBtn     = document.getElementById('chatbotBtn');
const chatbotModal   = document.getElementById('chatbotModal');
const chatbotClose   = document.getElementById('chatbotClose');
const chatbotOverlay = document.getElementById('chatbotOverlay');
const chatbotCTA     = document.getElementById('chatbotCTA');

function openChatbot() {
  chatbotModal.classList.add('open');
  chatbotModal.setAttribute('aria-hidden', 'false');
  chatbotOverlay.classList.add('active');
  chatbotBtn.setAttribute('aria-expanded', 'true');
  // Focus the close button for accessibility
  setTimeout(() => chatbotClose.focus(), 350);
}

function closeChatbot() {
  chatbotModal.classList.remove('open');
  chatbotModal.setAttribute('aria-hidden', 'true');
  chatbotOverlay.classList.remove('active');
  chatbotBtn.setAttribute('aria-expanded', 'false');
  chatbotBtn.focus();
}

chatbotBtn.addEventListener('click', openChatbot);
chatbotClose.addEventListener('click', closeChatbot);
chatbotOverlay.addEventListener('click', closeChatbot);

// Close chatbot when CTA is clicked (takes user to contact section)
if (chatbotCTA) {
  chatbotCTA.addEventListener('click', closeChatbot);
}

// Close chatbot on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && chatbotModal.classList.contains('open')) {
    closeChatbot();
  }
});

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
