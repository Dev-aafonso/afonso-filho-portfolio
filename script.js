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

  // Brilho acompanha o mouse apenas em dispositivos com cursor preciso.
  const heroPanel = document.querySelector('.hero-visual');
  if (heroPanel && !mediaQueryReducedMotion() &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    heroPanel.addEventListener('pointermove', (event) => {
      const rect = heroPanel.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
      heroPanel.style.setProperty('--spot-x', x.toFixed(1) + '%');
      heroPanel.style.setProperty('--spot-y', y.toFixed(1) + '%');
    }, { passive: true });
    heroPanel.addEventListener('pointerleave', () => {
      heroPanel.style.removeProperty('--spot-x');
      heroPanel.style.removeProperty('--spot-y');
    });
  }


  // Portfolio v2 controls and accessible interactions
  const progress = document.querySelector('[data-scroll-progress]');
  const backToTop = document.querySelector('[data-back-to-top]');
  let scrollPending = false;

  function updateScrollControls() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const position = Math.max(0, window.scrollY || document.documentElement.scrollTop || 0);
    progress?.style.setProperty('--scroll-progress', String(Math.min(1,position/max)));
    backToTop?.classList.toggle('is-visible',position > 500);
    scrollPending=false;
  }
  window.addEventListener('scroll', () => {
    if(scrollPending) return;
    scrollPending=true;
    window.requestAnimationFrame(updateScrollControls);
  }, {passive:true});
  window.addEventListener('resize',updateScrollControls);
  updateScrollControls();
  backToTop?.addEventListener('click', () => {
    window.scrollTo({top:0,behavior:mediaQueryReducedMotion()?'instant':'smooth'});
  });

  const filterButtons=[...document.querySelectorAll('[data-project-filter]')];
  const projectCards=[...document.querySelectorAll('[data-project-category]')];
  const filterFeedback=document.querySelector('[data-filter-feedback]');
  filterButtons.forEach(button => button.addEventListener('click',() => {
    const category=button.dataset.projectFilter;
    let visible=0;
    projectCards.forEach(card => {
      const show=category==='all'||card.dataset.projectCategory===category;
      if(show) visible++;
      card.toggleAttribute('data-filter-hidden',!show);
      if(!show) card.querySelectorAll('details[open]').forEach(details=>details.open=false);
    });
    filterButtons.forEach(item=>{
      const active=item===button;
      item.classList.toggle('is-active',active);
      item.setAttribute('aria-pressed',String(active));
    });
    if(filterFeedback) {
      filterFeedback.textContent=isEnglish
        ? visible+' '+(visible===1?'project':'projects')+' displayed'
        : visible+' '+(visible===1?'projeto exibido':'projetos exibidos');
    }
  }));

  const copyButton=document.querySelector('[data-copy-email]');
  const copyFeedback=document.querySelector('[data-copy-feedback]');
  copyButton?.addEventListener('click',async()=>{
    const email='afonsofilho692@gmail.com';
    let success=false;
    try {
      if(navigator.clipboard?.writeText){
        await navigator.clipboard.writeText(email);
        success=true;
      }
    }catch(_){}
    if(!success){
      const fallback=document.createElement('textarea');
      fallback.value=email;
      fallback.style.position='fixed';
      fallback.style.opacity='0';
      document.body.appendChild(fallback);
      fallback.select();
      try{success=document.execCommand('copy');}catch(_){}
      fallback.remove();
    }
    if(copyFeedback)copyFeedback.textContent=success
      ? (isEnglish?'Email address copied.':'E-mail copiado.')
      : (isEnglish?'Could not copy. Email: '+email:'Não foi possível copiar. E-mail: '+email);
  });


  // Timeline scroll-fill and visible milestones.
  const timeline=document.querySelector('[data-journey-timeline]');
  const milestones=timeline ? [...timeline.querySelectorAll('.journey-item')] : [];
  if(timeline && milestones.length){
    const reduceMotion=mediaQueryReducedMotion();
    let timelinePending=false;
    const updateJourney=()=>{
      const rect=timeline.getBoundingClientRect();
      const lineHeight=Math.max(1,rect.height);
      // Progress reaches the bottom as the last milestone enters the reading area.
      const readingY=window.innerHeight * .62;
      const fill=Math.max(0,Math.min(1,(readingY-rect.top)/lineHeight));
      timeline.style.setProperty('--journey-fill',reduceMotion?'100%':(fill*100).toFixed(1)+'%');
      for(const item of milestones){
        const reached=reduceMotion||item.getBoundingClientRect().top<=readingY;
        item.classList.toggle('is-past',reached);
      }
      timelinePending=false;
    };
    const onJourneyScroll=()=>{
      if(timelinePending)return;
      timelinePending=true;
      window.requestAnimationFrame(updateJourney);
    };
    window.addEventListener('scroll',onJourneyScroll,{passive:true});
    window.addEventListener('resize',onJourneyScroll,{passive:true});
    window.addEventListener('load',onJourneyScroll,{once:true});
    updateJourney();
    if(!reduceMotion && 'IntersectionObserver' in window){
      const journeyRevealItems=[...milestones, ...document.querySelectorAll('.timeline-section .timeline-cert')];
      const milestoneObserver=new IntersectionObserver((entries,observer)=>{
        for(const entry of entries){
          if(!entry.isIntersecting)continue;
          entry.target.classList.add('journey-entered');
          observer.unobserve(entry.target);
        }
      },{threshold:.08,rootMargin:'0px 0px -12% 0px'});
      journeyRevealItems.forEach((item)=>{
        // Keep content already in view readable; prepare only items below the viewport.
        if(item.getBoundingClientRect().top < window.innerHeight * .92)return;
        item.classList.add('journey-pending');
        milestoneObserver.observe(item);
      });
    }
  }

  // Subtle sequential entrance for AI cards without changing layout.
  const aiCards=[...document.querySelectorAll('.ai-topic')];
  if(!mediaQueryReducedMotion() && 'IntersectionObserver' in window){
    const aiObserver=new IntersectionObserver((entries,observer)=>{
      for(const entry of entries){
        if(!entry.isIntersecting)continue;
        const i=aiCards.indexOf(entry.target);
        entry.target.style.setProperty('--entry-delay',Math.min(i,2)*90+'ms');
        entry.target.classList.add('ai-entered');
        observer.unobserve(entry.target);
      }
    },{threshold:.1});
    aiCards.forEach(card=>aiObserver.observe(card));
  }

})();
