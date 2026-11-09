/* =====================================================================
   VILLA Y LA GRAN GUERRA — main.js
   Interacciones compartidas por todas las secciones.
   ===================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 1. Menú móvil ---------- */
  const toggle = document.querySelector('.menu-toggle');
  const nav    = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });
    nav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
      });
    });
  }

  /* ---------- 2. Animación de entrada (reveal) (Es más que nada para los elementos del turismo) ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- 3. Año del footer ---------- */
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 4. Barra de progreso de lectura (artículos) ---------- */
  const progress = document.querySelector('.reading-progress');
  const article  = document.querySelector('.article-body');
  if (progress && article) {
    window.addEventListener('scroll', () => {
      const rect = article.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 0));
      const pct = total > 0 ? (scrolled / total) * 100 : 0;
      progress.style.width = pct + '%';
    }, { passive: true });
  }

  /* ---------- 5. Clics de publicidad (eventos de medición) ---------- */
  document.querySelectorAll('[data-ad]').forEach(card => {
    card.addEventListener('click', () => {
      const sponsor = card.getAttribute('data-ad');
      // Aquí se conectaría con analítica real (GA4, Plausible, etc.)
      console.log('[ad-click]', sponsor);
    });
  });

  /* ---------- 6. Compartir artículo (Web Share API) ---------- */
  document.querySelectorAll('[data-share]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const data = {
        title: document.title,
        text: document.querySelector('meta[name="description"]')?.content || '',
        url: window.location.href,
      };
      if (navigator.share) {
        try { await navigator.share(data); } catch (_) {}
      } else {
        await navigator.clipboard.writeText(window.location.href);
        btn.textContent = 'Enlace copiado';
        setTimeout(() => (btn.textContent = 'Compartir'), 1800);
      }
    });
  });
});