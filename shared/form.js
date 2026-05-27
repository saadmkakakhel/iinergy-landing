// iinergy v3 — form handler + lite video facade
// Submissions go to Jotform (form ID 261465450509054) via its public submit endpoint.
const JOTFORM_ID = '261465450509054';
const JOTFORM_SUBMIT_URL = `https://submit.jotform.com/submit/${JOTFORM_ID}/`;

// LP field name → Jotform input name
const JF_FIELDS = {
  firstName:   'q2_q2_textbox0',
  lastName:    'q3_q3_textbox1',
  phone:       'q4_q4_phone2[full]',
  email:       'q5_q5_email3',
  postcode:    'q6_q6_textbox4',
  serviceArea: 'q7_q7_dropdown5',
  bill:        'q8_q8_dropdown6',
  currentSetup:'q9_q9_dropdown7',
  region:      'q10_q10_textbox8',
  source:      'q11_q11_textbox9',
  submittedAt: 'q12_q12_textbox10',
};

// LP dropdown slug → Jotform option label (must match verbatim)
const JF_VALUE_MAP = {
  serviceArea: {
    'brisbane': 'Brisbane', 'gold-coast': 'Gold Coast', 'bundaberg': 'Bundaberg',
    'cairns': 'Cairns', 'gympie': 'Gympie', 'hervey-bay': 'Hervey Bay',
    'rockhampton': 'Rockhampton', 'toowoomba': 'Toowoomba', 'townsville': 'Townsville',
    'other': 'Other QLD',
  },
  bill: {
    'under-200': 'Under $200', '200-400': '$200–$400',
    '400-600': '$400–$600', '600-plus': '$600+',
  },
  currentSetup: {
    'none': 'Nothing yet', 'solar-only': 'Solar panels only',
    'solar-battery': 'Solar + battery already',
  },
};

document.addEventListener('DOMContentLoaded', () => {
  initForms();
  initVideos();
});

/* ---------- Lead forms (multi-instance: hero + bottom) ---------- */
function initForms() {
  const forms = document.querySelectorAll('form[data-region]');
  forms.forEach(form => wireForm(form));
}

function wireForm(form) {
  const region = form.dataset.region || 'unknown';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors(form);

    const data = Object.fromEntries(new FormData(form).entries());
    const errors = validate(data);

    if (Object.keys(errors).length) {
      for (const [field, msg] of Object.entries(errors)) {
        const el = form.querySelector(`[data-error-for="${field}"]`);
        if (el) { el.textContent = msg; el.classList.add('show'); }
      }
      form.querySelector(`[name="${Object.keys(errors)[0]}"]`)?.focus();
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const origLabel = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    const payload = { ...data, region, source: location.href, submittedAt: new Date().toISOString() };

    const body = new URLSearchParams();
    for (const [lpName, jfName] of Object.entries(JF_FIELDS)) {
      const raw = payload[lpName];
      if (raw == null || raw === '') continue;
      const mapped = JF_VALUE_MAP[lpName]?.[raw] ?? raw;
      body.append(jfName, mapped);
    }

    try {
      // no-cors: response is opaque but submission still reaches Jotform.
      // application/x-www-form-urlencoded keeps it preflight-free.
      await fetch(JOTFORM_SUBMIT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body,
      });
      window.location.href = 'thank-you.html?region=' + encodeURIComponent(region);
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = origLabel;
      alert('Something went wrong — please email us at info@iinergy.com.au.');
    }
  });
}

function validate(data) {
  const errors = {};
  if (!data.firstName || data.firstName.trim().length < 2) errors.firstName = 'Enter your first name.';
  if (!data.lastName || data.lastName.trim().length < 2) errors.lastName = 'Enter your last name.';
  if (!data.phone || !/^[\d\s+()-]{8,}$/.test(data.phone.trim())) errors.phone = 'Enter a valid phone number.';
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.email = 'Enter a valid email address.';
  if (!data.postcode || !/^\d{4}$/.test(data.postcode.trim())) errors.postcode = '4-digit Australian postcode.';
  if (!data.serviceArea) errors.serviceArea = 'Pick your area.';
  if (!data.bill) errors.bill = 'Pick a bill range.';
  if (!data.currentSetup) errors.currentSetup = 'Pick one.';
  return errors;
}

function clearErrors(form) {
  form.querySelectorAll('.field-error').forEach(el => { el.classList.remove('show'); el.textContent = ''; });
}

/* ---------- Lite video facade ----------
   YouTube thumbnail fallback chain. Not every video has hq720.jpg or
   maxresdefault.jpg, but hqdefault.jpg always exists. Walk the chain on load
   failure. */
const YT_THUMB_FALLBACK = {
  'maxresdefault.jpg': 'hq720.jpg',
  'hq720.jpg': 'hqdefault.jpg',
  'sddefault.jpg': 'hqdefault.jpg',
};
function initVideos() {
  document.querySelectorAll('.video-wrap').forEach(wrap => {
    const poster = wrap.querySelector('img.poster');
    if (poster && !poster.dataset.fallbackWired) {
      poster.dataset.fallbackWired = '1';
      // 404/error path (rare for YouTube — it usually 200s with a placeholder)
      poster.addEventListener('error', () => {
        const src = poster.getAttribute('src') || '';
        for (const [from, to] of Object.entries(YT_THUMB_FALLBACK)) {
          if (src.endsWith('/' + from)) {
            poster.setAttribute('src', src.replace('/' + from, '/' + to));
            return;
          }
        }
      });
      // Placeholder detection — YouTube serves a 120×90 gray "no thumb" image
      // when hq720/maxresdefault aren't generated. Detect by naturalWidth and
      // walk down to a guaranteed thumb (hqdefault always exists).
      const handleLoad = () => {
        const src = poster.getAttribute('src') || '';
        if (!src.includes('img.youtube.com')) return;
        if (poster.naturalWidth > 0 && poster.naturalWidth < 200) {
          for (const [from, to] of Object.entries(YT_THUMB_FALLBACK)) {
            if (src.endsWith('/' + from)) {
              poster.setAttribute('src', src.replace('/' + from, '/' + to));
              return;
            }
          }
        }
      };
      if (poster.complete) handleLoad();
      else poster.addEventListener('load', handleLoad);
    }
    wrap.addEventListener('click', () => playVideo(wrap), { once: true });
    wrap.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playVideo(wrap); }
    }, { once: true });
    wrap.setAttribute('role', 'button');
    wrap.setAttribute('tabindex', '0');
    wrap.setAttribute('aria-label', wrap.dataset.label || 'Play video');
  });
}

function playVideo(wrap) {
  wrap.classList.add('is-playing');
  if (wrap.dataset.mp4) {
    const v = document.createElement('video');
    v.src = wrap.dataset.mp4;
    v.controls = true;
    v.autoplay = true;
    v.playsInline = true;
    if (wrap.dataset.poster) v.poster = wrap.dataset.poster;
    wrap.appendChild(v);
  } else if (wrap.dataset.youtube) {
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${wrap.dataset.youtube}?autoplay=1&rel=0`;
    iframe.title = wrap.dataset.label || 'YouTube video';
    iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    wrap.appendChild(iframe);
  }
}
