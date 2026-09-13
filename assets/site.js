'use strict';
const menuButton = document.querySelector('[data-menu-button]');
const menu = document.querySelector('[data-menu]');
if (menuButton && menu) {
  const closeMenu = () => {
    menu.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.textContent = 'Menu +';
  };
  menuButton.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.textContent = open ? 'Close −' : 'Menu +';
  });
  menu.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.classList.contains('open')) { closeMenu(); menuButton.focus(); }
  });
  window.matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const runningAnimations = new Set();
if ('IntersectionObserver' in window) {
  // The document is always visible. Each reveal starts only when its content enters view.
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      reveal.unobserve(entry.target);
      if (reducedMotion.matches || !entry.target.animate) return;
      const animation = entry.target.animate([
        {opacity: .15, transform: 'translateY(30px)'},
        {opacity: 1, transform: 'translateY(0)'}
      ], {duration: 900, easing: 'cubic-bezier(.22,1,.36,1)'});
      runningAnimations.add(animation);
      animation.finished.then(() => runningAnimations.delete(animation)).catch(() => runningAnimations.delete(animation));
    });
  }, {threshold: 0, rootMargin: '0px 0px -45px 0px'});
  document.querySelectorAll('[data-reveal], .experience-entry, .education-item').forEach(el => reveal.observe(el));

  // Keep the case-study navigation in step with the section being read.
  const sections = [...document.querySelectorAll('.case-section[id]')];
  if (sections.length) {
    const visibleSections = new Set();
    const currentSection = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting ? visibleSections.add(entry.target) : visibleSections.delete(entry.target));
      const current = sections.find(section => visibleSections.has(section));
      if (!current) return;
      document.querySelectorAll('.case-aside a').forEach(link => {
        if (link.hash === '#' + current.id) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }, {rootMargin: '-15% 0px -55% 0px'});
    sections.forEach(section => currentSection.observe(section));
  }
}
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) runningAnimations.forEach(animation => animation.cancel());
});

// A small scroll-linked camera movement on the three photographic hero surfaces.
// Only visible images are measured, and scrolling stays entirely native.
if ('IntersectionObserver' in window) {
  const surfaces = [...document.querySelectorAll('.project-feature .project-photo, .kart-hero-photo, .international-photo-frame')];
  const visible = new Set();
  let frame = 0;
  const paint = () => {
    frame = 0;
    visible.forEach(surface => {
      const photo = surface.querySelector('img');
      if (!photo) return;
      if (reducedMotion.matches) { photo.style.removeProperty('scale'); return; }
      const box = surface.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (window.innerHeight - box.top) / (window.innerHeight + box.height)));
      photo.style.scale = String(1.055 - .055 * progress);
    });
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
    schedule();
  });
  surfaces.forEach(surface => observer.observe(surface));
  if (surfaces.length) {
    window.addEventListener('scroll', schedule, {passive: true});
    window.addEventListener('resize', schedule, {passive: true});
    reducedMotion.addEventListener('change', () => {
      surfaces.forEach(surface => surface.querySelector('img')?.style.removeProperty('scale'));
      schedule();
    });
  }
}
