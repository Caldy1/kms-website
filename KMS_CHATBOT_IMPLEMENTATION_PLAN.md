# KMS AI Chatbot — Full Implementation Plan

> **Purpose:** Step-by-step agent briefing document. Each phase is self-contained and can be handed to a separate Claude agent. All file paths, class names, IDs, and code context are included so no agent needs to re-explore the codebase.

---

## Project Overview

**Site:** Static HTML/CSS/JS website at `C:\Users\kylec\Claude_Webpages\KMS`
**Repo:** `https://github.com/Caldy1/kms-website` (main branch, auto-deploys to Netlify)
**Goal:** Replace the placeholder chatbot widget with a live ElevenLabs conversational AI agent that:
- Speaks with the Scottish Mark voice
- Answers questions strictly about KMS services
- Captures customer info (name, email, phone, company, interest, best time)
- Books calls via Calendly
- Sends email confirmations via EmailJS
- Supports both voice AND text input in the same UI

---

## Technology Stack

| Tool | Purpose | Notes |
|------|---------|-------|
| ElevenLabs Conversational AI | Voice agent engine | SDK: `@11labs/client` via CDN |
| Calendly | Call booking | Popup widget via CDN script |
| EmailJS | Email notifications | SDK via CDN |
| Vanilla JS | All site code | No frameworks — keep everything in `script.js` |

---

## Customer Data to Capture

The agent should collect this information naturally during conversation before offering to book a call:

| Field | How to Collect |
|-------|---------------|
| Full name | "May I ask your name?" |
| Email address | "What's the best email to reach you?" |
| Phone number | "And a phone number in case we need to reach you?" |
| Business/company name | "What's the name of your business?" |
| Service(s) interested in | Inferred from conversation + confirmed |
| Budget range (optional) | "Do you have a rough budget in mind?" |
| Best time to call | Pre-fills Calendly; also asked if they prefer a specific time |
| How they heard about KMS | "How did you come across KMS?" |

This data flows into:
1. Calendly pre-fill (name + email)
2. EmailJS notification email to KMS team
3. EmailJS confirmation email to customer

---

## Phase 1 — ElevenLabs Agent Setup (Manual — Dashboard)

> **Agent instruction:** This phase must be completed by a human in the ElevenLabs dashboard. No code changes. Document the resulting Agent ID so it can be used in Phase 3.

### Steps

1. Log in to **elevenlabs.io** → go to **Conversational AI** → **Agents**
2. Click **Create Agent**
3. **Name:** `KMS Assistant`
4. **Voice:** Search for `"Scottish Mark"` and select it
5. **Language:** English (UK)
6. **Paste the system prompt below** into the agent's system prompt field
7. **First message:** `"Hi there, I'm the KMS AI assistant. I can tell you about our services, answer questions about AI automation, and help you book a discovery call. What can I help you with today?"`
8. Enable **conversation turn detection** (so it knows when the user has finished speaking)
9. Under **Security/Topic restriction:** Enable "stay on topic" if available, else rely on the system prompt
10. Save the agent → copy the **Agent ID** (format: `agent_xxxxxxxxxxxxxxxx`)
11. Go to **API Keys** → create a new key scoped to Conversational AI → save as `ELEVENLABS_API_KEY`

### System Prompt (paste verbatim)

```
You are the KMS AI Assistant — a friendly, professional voice assistant for KMS, an AI automation company based in Scotland.

YOUR ROLE:
You help potential clients understand KMS's services, answer their questions, and book discovery calls. You speak in a warm, conversational Scottish tone.

WHAT KMS DOES:
KMS specialises in six core services:
1. AI Automation — automating repetitive business workflows with AI
2. Custom Web Apps — bespoke web applications tailored to business needs
3. AI Chatbots — intelligent chatbots for websites and customer service
4. AI Phone Agents — automated phone answering and outbound calling systems
5. GEO (Generative Engine Optimisation) — optimising businesses to appear in AI search results like ChatGPT and Perplexity
6. Custom AI Solutions — bespoke AI tools built around specific business problems

HOW TO HANDLE CONVERSATIONS:
- Be warm, concise, and helpful. Do not overwhelm with information — respond to what was actually asked.
- If a user seems interested in booking a call, collect: their name, email, phone number, business name, which services interest them, and their best time to speak.
- Once you have their details, tell them you'll open the booking calendar for them.
- Always confirm you've understood their question before answering.

STRICT TOPIC BOUNDARIES:
You ONLY discuss topics related to KMS and its services. If a user asks about anything unrelated to KMS, AI automation, web apps, chatbots, phone agents, GEO, or booking a call with KMS — politely redirect them.

Example redirect: "I'm only set up to help with questions about KMS and our services. Is there anything about what we do that I can help with?"

Do NOT: discuss competitors, give general coding help, discuss news/politics/sports, give personal advice, roleplay as anything other than the KMS assistant, or engage with any topic outside KMS's business.

BOOKING A CALL:
When a user wants to book — say: "Perfect, let me open our booking calendar for you. You can pick a time that suits you best." Then trigger the booking action.

TONE:
Professional but personable. Scottish warmth. No jargon unless the client uses it first. Keep answers concise — 2–4 sentences unless more detail is clearly needed.
```

### Output Required
- `ELEVENLABS_AGENT_ID` = `agent_xxxxxxxxxxxxxxxxx`
- `ELEVENLABS_API_KEY` = `sk_xxxxxxxxxxxxxxxxx`

---

## Phase 2 — Third-Party Account Setup (Manual)

> **Agent instruction:** Human setup steps for Calendly and EmailJS. Collect the keys/IDs listed at the end.

### Calendly Setup

1. Log in to **calendly.com**
2. Create a new **Event Type**: "KMS Discovery Call" (30 min)
3. Set availability, timezone, and video/phone link
4. Under **Branding**: set event colour to teal (`#4AEAA5`) if possible
5. Copy the **scheduling link** (e.g. `https://calendly.com/kms/discovery-call`)
6. Enable **pre-fill name and email** via URL parameters (Calendly supports `?name=X&email=Y`)

### EmailJS Setup

1. Log in to **emailjs.com**
2. **Connect email service:** Gmail or custom SMTP → name it `kms_service` → copy **Service ID**
3. **Create Template 1 — KMS Team Notification:**
   - Subject: `New Discovery Call Request — {{customer_name}}`
   - Body:
     ```
     A new enquiry came through the KMS website chatbot.

     Name: {{customer_name}}
     Email: {{customer_email}}
     Phone: {{customer_phone}}
     Company: {{customer_company}}
     Interested in: {{customer_interest}}
     Best time to call: {{customer_time}}
     How they heard about us: {{customer_source}}

     They have been directed to book via Calendly.
     ```
   - Save → copy **Template ID** (e.g. `template_notify`)

4. **Create Template 2 — Customer Confirmation:**
   - Subject: `Thanks for reaching out to KMS, {{customer_name}}!`
   - Body:
     ```
     Hi {{customer_name}},

     Thanks for getting in touch with KMS. We've received your enquiry and look forward to speaking with you.

     If you haven't already booked your discovery call, you can do so here:
     {{calendly_link}}

     Our team will also be in touch shortly to confirm your details.

     Warm regards,
     The KMS Team
     kms-ai.co.uk
     ```
   - Save → copy **Template ID** (e.g. `template_confirm`)

5. Go to **Account → API Keys** → copy **Public Key**

### Output Required
- `CALENDLY_LINK` = `https://calendly.com/kms/discovery-call`
- `EMAILJS_SERVICE_ID` = `kms_service`
- `EMAILJS_TEMPLATE_NOTIFY` = `template_notify`
- `EMAILJS_TEMPLATE_CONFIRM` = `template_confirm`
- `EMAILJS_PUBLIC_KEY` = `xxxxxxxxxxxxxxxx`

---

## Phase 3 — Website Code Changes

> **Agent instruction:** This is the main coding phase. Make changes to `index.html`, `styles.css`, and `script.js`. All existing code context is provided below. Do NOT change any sections of the site outside the chatbot. Commit and push when done.

### Credentials to inject (replace placeholders)
```
ELEVENLABS_AGENT_ID  = "agent_xxxxxxxxxxxxxxxxx"
ELEVENLABS_API_KEY   = "sk_xxxxxxxxxxxxxxxxx"      ← use with caution, consider env var
CALENDLY_LINK        = "https://calendly.com/kms/discovery-call"
EMAILJS_SERVICE_ID   = "kms_service"
EMAILJS_TEMPLATE_NOTIFY  = "template_notify"
EMAILJS_TEMPLATE_CONFIRM = "template_confirm"
EMAILJS_PUBLIC_KEY   = "xxxxxxxxxxxxxxxx"
```

---

### 3A — index.html Changes

**Location of changes:** Replace the chatbot section (lines ~358–402). The current placeholder markup is:

```html
<!-- CHATBOT_PLACEHOLDER: Replace this section with your chatbot embed -->
<div class="chatbot-placeholder">
  ...placeholder content...
</div>
<!-- END CHATBOT_PLACEHOLDER -->
```

**Replace `.chatbot-modal__body` content entirely with:**

```html
<div class="chatbot-modal__body" id="chatbotBody">

  <!-- CONVERSATION TRANSCRIPT -->
  <div class="chatbot-transcript" id="chatbotTranscript" role="log" aria-live="polite" aria-label="Conversation">
    <!-- Messages injected by JS -->
  </div>

  <!-- DATA COLLECTION FORM (hidden until agent triggers it) -->
  <div class="chatbot-form" id="chatbotForm" hidden>
    <p class="chatbot-form__label">To book your discovery call, please confirm your details:</p>
    <input type="text"   id="formName"     class="chatbot-input-field" placeholder="Full name"     autocomplete="name" />
    <input type="email"  id="formEmail"    class="chatbot-input-field" placeholder="Email address" autocomplete="email" />
    <input type="tel"    id="formPhone"    class="chatbot-input-field" placeholder="Phone number"   autocomplete="tel" />
    <input type="text"   id="formCompany"  class="chatbot-input-field" placeholder="Company name" />
    <button class="btn btn--primary chatbot-form__submit" id="formSubmit">Book My Discovery Call</button>
  </div>

  <!-- INPUT BAR -->
  <div class="chatbot-input-bar" id="chatbotInputBar">
    <textarea
      id="chatbotTextInput"
      class="chatbot-textarea"
      placeholder="Type a message…"
      rows="1"
      aria-label="Type your message"
    ></textarea>
    <button class="chatbot-send-btn" id="chatbotSendBtn" aria-label="Send message">
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <path d="M2 10L18 2L12 18L10 11L2 10Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>
    </button>
    <button class="chatbot-mic-btn" id="chatbotMicBtn" aria-label="Start voice conversation" aria-pressed="false">
      <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
        <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" stroke-width="1.5"/>
        <path d="M5 10a7 7 0 0014 0M12 19v3M9 22h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>
  </div>

</div>
```

**Also update the header status** from "Coming Soon" to "Online":
```html
<div class="chatbot-modal__status">
  <span class="chatbot-modal__dot" aria-hidden="true"></span> Online
</div>
```

**Add SDK scripts** just before `</body>`:
```html
<!-- ElevenLabs Conversational AI -->
<script src="https://cdn.jsdelivr.net/npm/@11labs/client@latest/dist/elevenlabs-client.min.js"></script>
<!-- Calendly Widget -->
<link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet">
<script src="https://assets.calendly.com/assets/external/widget.js"></script>
<!-- EmailJS -->
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
```

---

### 3B — styles.css Changes

**Resize the modal** — change `.chatbot-modal` width and add height:
```css
.chatbot-modal {
  width: 400px;          /* was 360px */
  max-height: 620px;
}
```

**Add new CSS rules** at the bottom of the chatbot section:

```css
/* Transcript */
.chatbot-transcript {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 280px;
  max-height: 340px;
}

.chatbot-msg {
  max-width: 82%;
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 0.84rem;
  line-height: 1.55;
}

.chatbot-msg--agent {
  background: rgba(74, 234, 165, 0.08);
  border: 1px solid rgba(74, 234, 165, 0.14);
  color: var(--text-primary);
  align-self: flex-start;
  border-bottom-left-radius: 4px;
}

.chatbot-msg--user {
  background: rgba(74, 234, 165, 0.18);
  color: var(--bg-dark);
  align-self: flex-end;
  border-bottom-right-radius: 4px;
}

.chatbot-msg--typing {
  background: rgba(74, 234, 165, 0.06);
  border: 1px solid rgba(74, 234, 165, 0.1);
  align-self: flex-start;
  padding: 12px 16px;
}

/* Input bar */
.chatbot-input-bar {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--border);
  background: rgba(0,0,0,0.15);
}

.chatbot-textarea {
  flex: 1;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 0.84rem;
  padding: 9px 13px;
  resize: none;
  max-height: 100px;
  overflow-y: auto;
  outline: none;
  transition: border-color var(--transition);
}

.chatbot-textarea:focus {
  border-color: rgba(74, 234, 165, 0.4);
}

.chatbot-send-btn,
.chatbot-mic-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background var(--transition), transform var(--transition);
}

.chatbot-send-btn {
  background: linear-gradient(135deg, var(--teal-mid), var(--teal-light));
  color: var(--bg-dark);
}

.chatbot-send-btn:hover { transform: scale(1.08); }

.chatbot-mic-btn {
  background: rgba(74, 234, 165, 0.08);
  border: 1px solid rgba(74, 234, 165, 0.25);
  color: var(--teal-light);
}

.chatbot-mic-btn:hover { background: rgba(74, 234, 165, 0.16); }
.chatbot-mic-btn[aria-pressed="true"] {
  background: rgba(74, 234, 165, 0.2);
  border-color: var(--teal-light);
  animation: micPulse 1.2s ease-in-out infinite;
}

@keyframes micPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(74,234,165,0.4); }
  50%       { box-shadow: 0 0 0 6px rgba(74,234,165,0); }
}

/* Data collection form */
.chatbot-form {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chatbot-form__label {
  font-size: 0.82rem;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.chatbot-input-field {
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 0.84rem;
  padding: 10px 13px;
  width: 100%;
  outline: none;
  transition: border-color var(--transition);
}

.chatbot-input-field:focus { border-color: rgba(74, 234, 165, 0.4); }

.chatbot-form__submit {
  width: 100%;
  justify-content: center;
  margin-top: 6px;
}

/* Mobile override */
@media (max-width: 768px) {
  .chatbot-modal {
    width: calc(100vw - 36px);
    right: 18px;
    bottom: 96px;
    max-height: 75vh;
  }
}
```

---

### 3C — script.js Changes

**Replace the entire chatbot section** (lines 78–118) with the new implementation below. Leave all other sections (fade-in, nav toggle, hero canvas, smooth scroll) unchanged.

```javascript
/* ──────────────────────────────────────────
   CHATBOT — ELEVENLABS + CALENDLY + EMAILJS
   ────────────────────────────────────────── */

// ── Config ──────────────────────────────────
const CHATBOT_CONFIG = {
  agentId:              'ELEVENLABS_AGENT_ID',
  calendlyLink:         'CALENDLY_LINK',
  emailjsPublicKey:     'EMAILJS_PUBLIC_KEY',
  emailjsServiceId:     'EMAILJS_SERVICE_ID',
  emailjsTemplateNotify:'EMAILJS_TEMPLATE_NOTIFY',
  emailjsTemplateConfirm:'EMAILJS_TEMPLATE_CONFIRM',
};

// ── State ────────────────────────────────────
let elevenLabsConv  = null;
let voiceActive     = false;
let customerData    = {};

// ── DOM refs ────────────────────────────────
const chatbotBtn      = document.getElementById('chatbotBtn');
const chatbotModal    = document.getElementById('chatbotModal');
const chatbotClose    = document.getElementById('chatbotClose');
const chatbotOverlay  = document.getElementById('chatbotOverlay');
const chatbotTranscript = document.getElementById('chatbotTranscript');
const chatbotForm     = document.getElementById('chatbotForm');
const chatbotTextInput = document.getElementById('chatbotTextInput');
const chatbotSendBtn  = document.getElementById('chatbotSendBtn');
const chatbotMicBtn   = document.getElementById('chatbotMicBtn');
const formSubmit      = document.getElementById('formSubmit');

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
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendTextMessage();
  }
});
chatbotSendBtn.addEventListener('click', sendTextMessage);

// Auto-resize textarea
chatbotTextInput.addEventListener('input', () => {
  chatbotTextInput.style.height = 'auto';
  chatbotTextInput.style.height = chatbotTextInput.scrollHeight + 'px';
});

async function sendTextMessage() {
  const text = chatbotTextInput.value.trim();
  if (!text) return;
  chatbotTextInput.value = '';
  chatbotTextInput.style.height = 'auto';
  appendMessage('user', text);
  showTyping();

  // Check for booking intent keywords
  if (/book|call|calendly|schedule|appointment/i.test(text)) {
    removeTyping();
    triggerBooking();
    return;
  }

  // Send to ElevenLabs text endpoint if conversation active, else use agent REST API
  try {
    if (elevenLabsConv) {
      // Voice session active — inject as text turn (SDK-dependent)
      await elevenLabsConv.sendUserInput(text);
    } else {
      // Stateless text query via ElevenLabs agent endpoint
      const res = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${CHATBOT_CONFIG.agentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, conversation_id: customerData.convId || null })
      });
      const data = await res.json();
      if (data.conversation_id) customerData.convId = data.conversation_id;
      removeTyping();
      appendMessage('agent', data.response || data.text || '');
      // Check if agent is asking for booking
      if (/book|calendar|discovery call/i.test(data.response || '')) triggerBooking();
    }
  } catch (err) {
    removeTyping();
    appendMessage('agent', "I'm having a little trouble connecting right now. Please try again or book a call directly — the button is below.");
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
          // Detect booking trigger in agent response
          if (/book|calendar|discovery call/i.test(message)) triggerBooking();
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

// ── Booking trigger ──────────────────────────
function triggerBooking() {
  // Show data collection form
  chatbotForm.hidden = false;
  chatbotForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

formSubmit.addEventListener('click', async () => {
  const name    = document.getElementById('formName').value.trim();
  const email   = document.getElementById('formEmail').value.trim();
  const phone   = document.getElementById('formPhone').value.trim();
  const company = document.getElementById('formCompany').value.trim();

  if (!name || !email) {
    document.getElementById('formName').focus();
    return;
  }

  customerData = { name, email, phone, company };

  // Send emails
  await sendEmails(customerData);

  // Open Calendly pre-filled
  const calendlyUrl = `${CHATBOT_CONFIG.calendlyLink}?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`;
  if (typeof Calendly !== 'undefined') {
    Calendly.initPopupWidget({ url: calendlyUrl });
  } else {
    window.open(calendlyUrl, '_blank');
  }

  // Confirm in transcript
  chatbotForm.hidden = true;
  appendMessage('agent', `Perfect, ${name}! I've opened the booking calendar for you. We've also sent a confirmation to ${email}. We look forward to speaking with you!`);
});

// ── EmailJS send ─────────────────────────────
async function sendEmails(data) {
  if (typeof emailjs === 'undefined') return;
  const params = {
    customer_name:     data.name,
    customer_email:    data.email,
    customer_phone:    data.phone    || 'Not provided',
    customer_company:  data.company  || 'Not provided',
    customer_interest: data.interest || 'General enquiry',
    customer_time:     data.time     || 'Not specified',
    customer_source:   data.source   || 'KMS website chatbot',
    calendly_link:     CHATBOT_CONFIG.calendlyLink,
  };
  await Promise.allSettled([
    emailjs.send(CHATBOT_CONFIG.emailjsServiceId, CHATBOT_CONFIG.emailjsTemplateNotify,  params),
    emailjs.send(CHATBOT_CONFIG.emailjsServiceId, CHATBOT_CONFIG.emailjsTemplateConfirm, params),
  ]);
}
```

---

## Phase 4 — Verification Checklist

> **Agent instruction:** Run through these checks after Phase 3 is complete.

- [ ] Chatbot modal opens and displays the transcript area + input bar
- [ ] Typing a message and pressing Enter or Send shows user bubble + agent response
- [ ] Mic button turns active (pulsing) and requests microphone permission
- [ ] Voice conversation transcribes both user and agent speech into transcript
- [ ] Saying or typing "book a call" shows the data collection form
- [ ] Submitting form opens Calendly popup pre-filled with name + email
- [ ] Two emails arrive: one to KMS team, one to the customer email entered
- [ ] Chatbot stays on topic — test: ask about weather → agent redirects
- [ ] Mobile layout: modal fills width, stays within viewport
- [ ] Escape key and overlay click close the modal; mic session ends

---

## Phase 5 — Hardening & Future Improvements (Backlog)

These are not in scope for the initial implementation but should be considered:

| Item | Notes |
|------|-------|
| Move API keys to environment variables | Currently injected inline — move to Netlify environment variables and a serverless function proxy |
| Persist conversation across page navigation | Store `convId` in `sessionStorage` |
| Add `interest` field to form | Dropdown: AI Automation / Web App / Chatbot / Phone Agent / GEO / Custom AI |
| Show agent "thinking" animation during voice | Animate the header dot while agent is generating |
| Rate limiting | Prevent rapid-fire text sends |
| GDPR/Cookie consent banner | Required before ElevenLabs microphone access in UK |
| Analytics events | Fire GA4 / GTM events on chatbot open, message sent, booking triggered |
