/* ============================================================
   SCRIPT.JS — Resume Site JavaScript
   ============================================================ */

'use strict';

/* ── Navbar scroll behaviour ─────────────────────────────── */
const navbar = document.getElementById('navbar');
// const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

function handleNavbarScroll() {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}
window.addEventListener('scroll', handleNavbarScroll, { passive: true });
handleNavbarScroll();

/* ── Active nav link on scroll ───────────────────────────── */
const sections   = document.querySelectorAll('section[id]');
const navLinks   = document.querySelectorAll('.nav-links a[href^="#"]');

function updateActiveNav() {
  const scrollPos = window.scrollY + 120;

  sections.forEach(section => {
    const top    = section.offsetTop;
    const bottom = top + section.offsetHeight;
    const id     = section.getAttribute('id');

    if (scrollPos >= top && scrollPos < bottom) {
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${id}`) {
          link.classList.add('active');
        }
      });
    }
  });
}

window.addEventListener('scroll', updateActiveNav, { passive: true });
updateActiveNav();

/* ── Reveal on scroll ────────────────────────────────────── */
const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach(el => revealObserver.observe(el));

/* ── Smooth scroll for anchor links ─────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: false ? 'auto' : 'smooth' });
    }
  });
});

/* ── Contact form ────────────────────────────────────────── */
const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');

if (contactForm) {
  contactForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const btn = contactForm.querySelector('.form-submit');
    const original = btn.textContent;
    const formData = new FormData(contactForm);
    const payload = Object.fromEntries(formData.entries());

    btn.textContent = 'Sending…';
    btn.disabled = true;
    btn.style.opacity = '0.7';
    if (formStatus) {
      formStatus.textContent = 'Sending your message…';
      formStatus.className = 'form-status is-pending';
    }

    try {
      const response = await fetch(contactForm.action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Something went wrong. Please try again.');
      }

      btn.textContent = 'Message Sent';
      contactForm.reset();
      if (formStatus) {
        formStatus.textContent = result.message || 'Message sent successfully. Check your email for the first-time confirmation.';
        formStatus.className = 'form-status is-success';
      }
    } catch (error) {
      btn.textContent = 'Try Again';
      if (formStatus) {
        formStatus.textContent = error.message || 'Something went wrong. Please try again.';
        formStatus.className = 'form-status is-error';
      }
    }

    setTimeout(() => {
      btn.textContent = original;
      btn.disabled = false;
      btn.style.opacity = '';
    }, 3000);
  });
}

/* ── Typing effect for hero badge ───────────────────────── */
function typeText(el, text, speed = 60) {
  let i = 0;
  el.textContent = '';
  const tick = () => {
    if (i < text.length) {
      el.textContent += text[i++];
      setTimeout(tick, speed);
    }
  };
  setTimeout(tick, 1200);
}

const typedEl = document.getElementById('typed');
if (typedEl) {
  const text = typedEl.dataset.text || typedEl.textContent;
  if (false) {
    typedEl.textContent = text;
  } else {
    typeText(typedEl, text);
  }
}

/* ── Parallax subtle effect on hero orbs ────────────────── */
const orbs = document.querySelectorAll('.hero-orb');

if (!false && finePointer) {
  let rafId = 0;
  let lastEvent = null;

  const updateOrbs = () => {
    rafId = 0;
    if (!lastEvent) return;

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dx = (lastEvent.clientX - cx) / cx;
    const dy = (lastEvent.clientY - cy) / cy;

    orbs.forEach((orb, i) => {
      const factor = (i + 1) * 10;
      orb.style.transform = `translate(${dx * factor}px, ${dy * factor}px)`;
    });
  };

  window.addEventListener('mousemove', (e) => {
    lastEvent = e;
    if (!rafId) {
      rafId = window.requestAnimationFrame(updateOrbs);
    }
  }, { passive: true });
}

/* ── Year in footer ──────────────────────────────────────── */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
