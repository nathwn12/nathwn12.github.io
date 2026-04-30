'use strict';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
const navbar = document.getElementById('navbar');
const sections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
const revealEls = document.querySelectorAll('.reveal');
const themeToggle = document.getElementById('themeToggle');
const themeColorMeta = document.getElementById('theme-color-meta');

function getThemeMetaColor(theme) {
  return theme === 'light' ? '#f7f3ed' : '#141111';
}

function applyTheme(theme) {
  root.dataset.theme = theme;

  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', getThemeMetaColor(theme));
  }

  if (themeToggle) {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    themeToggle.textContent = nextTheme === 'light' ? 'Light mode' : 'Dark mode';
    themeToggle.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
    themeToggle.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
  }
}

const initialTheme = root.dataset.theme === 'light' ? 'light' : 'dark';
applyTheme(initialTheme);

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const nextTheme = root.dataset.theme === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);

    try {
      localStorage.setItem('portfolio-theme', nextTheme);
    } catch (error) {
      // Ignore storage failures and keep the in-memory theme.
    }
  });
}

function updateNavbar() {
  if (!navbar) return;
  navbar.classList.toggle('is-scrolled', window.scrollY > 8);
}

function updateActiveNav() {
  const position = window.scrollY + 220;
  let activeId = '';

  sections.forEach((section) => {
    const top = section.offsetTop;

    if (position >= top) {
      activeId = section.id;
    }
  });

  navLinks.forEach((link) => {
    const isActive = link.getAttribute('href') === `#${activeId}`;
    link.classList.toggle('active', isActive);

    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

function showReveals() {
  revealEls.forEach((el) => el.classList.add('visible'));
}

if (reduceMotion || !('IntersectionObserver' in window)) {
  showReveals();
} else {
  const observer = new IntersectionObserver((entries, io) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach((el) => observer.observe(el));
}

window.addEventListener('scroll', updateNavbar, { passive: true });
window.addEventListener('scroll', updateActiveNav, { passive: true });
window.addEventListener('resize', updateActiveNav, { passive: true });
updateNavbar();
updateActiveNav();

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (event) => {
    const href = anchor.getAttribute('href');
    if (!href || href === '#') return;

    const target = document.querySelector(href);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  });
});

const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');

if (contactForm) {
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitButton = contactForm.querySelector('.form-submit');
    const originalLabel = submitButton.textContent;
    const payload = Object.fromEntries(new FormData(contactForm).entries());

    submitButton.textContent = 'Sending...';
    submitButton.disabled = true;

    if (formStatus) {
      formStatus.textContent = 'Sending your message...';
      formStatus.className = 'form-status';
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

      let result = {};
      try {
        result = await response.json();
      } catch (_) {
        result = {};
      }

      if (!response.ok) {
        throw new Error(result.message || 'Something went wrong. Please try again.');
      }

      contactForm.reset();
      submitButton.textContent = 'Message sent';

      if (formStatus) {
        formStatus.textContent = result.message || 'Message sent successfully.';
        formStatus.className = 'form-status is-success';
      }
    } catch (error) {
      submitButton.textContent = 'Try again';

      if (formStatus) {
        formStatus.textContent = error.message || 'Something went wrong. Please try again.';
        formStatus.className = 'form-status is-error';
      }
    } finally {
      window.setTimeout(() => {
        submitButton.textContent = originalLabel;
        submitButton.disabled = false;
      }, 3000);
    }
  });
}

const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}
