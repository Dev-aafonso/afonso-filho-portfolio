(function () {
  'use strict';

  const root = document.documentElement;
  const toggle = document.querySelector('[data-theme-toggle]');
  const isEnglish = root.lang.toLowerCase().startsWith('en');
  const media = window.matchMedia('(prefers-color-scheme: light)');
  const storageKey = 'afonso-theme';

  function savedTheme() {
    try {
      const value = localStorage.getItem(storageKey);
      return value === 'light' || value === 'dark' ? value : null;
    } catch (_) {
      return null;
    }
  }

  function renderTheme(theme) {
    root.dataset.theme = theme;
    const nextIsLight = theme === 'dark';
    const label = isEnglish
      ? (nextIsLight ? 'Enable light mode' : 'Enable dark mode')
      : (nextIsLight ? 'Ativar tema claro' : 'Ativar tema escuro');

    if (toggle) {
      toggle.setAttribute('aria-label', label);
      toggle.setAttribute('title', label);
      toggle.querySelector('.theme-icon').textContent = nextIsLight ? '☀' : '☾';
      toggle.querySelector('.theme-label').textContent = isEnglish
        ? (nextIsLight ? 'Light mode' : 'Dark mode')
        : (nextIsLight ? 'Tema claro' : 'Tema escuro');
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'light' ? '#f6f8fd' : '#10131c';
  }

  renderTheme(savedTheme() || (media.matches ? 'light' : 'dark'));
  toggle?.addEventListener('click', () => {
    const choice = root.dataset.theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem(storageKey, choice); } catch (_) { /* Sem armazenamento: funciona nesta aba. */ }
    renderTheme(choice);
  });
  media.addEventListener?.('change', event => {
    if (!savedTheme()) renderTheme(event.matches ? 'light' : 'dark');
  });

  const menu = document.querySelector('.mobile-menu');
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu?.open) {
      menu.open = false;
      menu.querySelector('summary')?.focus();
    }
  });
  document.addEventListener('click', event => {
    if (menu?.open && !menu.contains(event.target)) menu.open = false;
  });

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const id = link.getAttribute('href');
      const target = id && document.getElementById(id.slice(1));
      if (!target) return;
      event.preventDefault();
      link.closest('details')?.removeAttribute('open');
      target.scrollIntoView({ behavior: mediaQueryReducedMotion() ? 'instant' : 'smooth' });
      history.replaceState(null, '', id);
    });
  });

  function mediaQueryReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
  // Portfolio motion: reveal sections on scroll; no animation for reduced motion.
  if (!mediaQueryReducedMotion() && 'IntersectionObserver' in window) {
    const revealSelectors = [
      '.section-head', '.feature-project', '.research-project',
      '.verates-project', '.pibic-project', '.about-heading',
      '.about-copy', '.skill-row', '.course-highlight', '.contact-inner'
    ];
    const observer = new IntersectionObserver((entries, instance) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('motion-visible');
        instance.unobserve(entry.target);
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });

    // Never hide content that is already on screen (or when JS is unavailable).
    requestAnimationFrame(() => {
      document.querySelectorAll(revealSelectors.join(',')).forEach((element, index) => {
        const position = element.getBoundingClientRect();
        if (position.top <= window.innerHeight * 0.92) return;
        element.style.setProperty('--motion-delay', (index % 3) * 70 + 'ms');
        element.classList.add('motion-reveal');
        observer.observe(element);
      });
    });
  }
})();
