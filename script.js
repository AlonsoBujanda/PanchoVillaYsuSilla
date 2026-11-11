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

    /* ---------- 7. Filtros de hub (Sonora, Noticias, Colecciones) ---------- */
  document.querySelectorAll('[data-filter-group]').forEach(group => {
    const chips = group.querySelectorAll('.chip');
    const targetSel = group.getAttribute('data-filter-group');
    // Si el target se llena por JS, saltar: lo maneja el bloque 9
    if (targetSel === '#colecciones-grid' || targetSel === '#noticias-grid') return;
    const items = document.querySelectorAll(targetSel + ' [data-cat]');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        const filter = chip.getAttribute('data-filter');
        items.forEach(item => {
          const match = filter === 'all' || item.getAttribute('data-cat') === filter;
          item.style.display = match ? '' : 'none';
        });
      });
    });
  });

  /* ---------- 8. Validación de formularios ---------- */
  document.querySelectorAll('form[data-validate]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('[required]').forEach(field => {
        if (!field.value.trim()) {
          valid = false;
          field.style.borderColor = '#b83a2b';
        } else {
          field.style.borderColor = '';
        }
      });
      if (!valid) return;
      const success = form.parentElement.querySelector('.form-success');
      if (success) {
        success.classList.add('is-visible');
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      form.reset();
    });
  });
  



  /* =====================================================================
     9. CARGA DINÁMICA DESDE VARIABLES JS (sin fetch)
     ===================================================================== */

  /* ---------- 9A. COLECCIONES ---------- */
  const gridColecciones = document.getElementById('colecciones-grid');
  if (gridColecciones && window.DATA_COLECCIONES) {
    renderColecciones(window.DATA_COLECCIONES.piezas, gridColecciones);
    inicializarFiltrosColecciones();
  } else if (gridColecciones) {
    console.warn('DATA_COLECCIONES no está definido. ¿Falta <script src="data/colecciones.js">?');
  }

  function renderColecciones(piezas, contenedor) {
    contenedor.innerHTML = piezas.map(p => {
      const mediaHTML = p.imagen
        ? `<img src="${p.imagen}" alt="${p.alt}" loading="lazy">`
        : `<div class="collection-item__media--empty"><span>Imagen por incorporar</span></div>`;

      const badges = {
        original: 'badge--original',
        repro: 'badge--repro',
        interp: 'badge--interp',
        pending: 'badge--pending'
      };

      return `
        <article class="collection-item" data-cat="${p.tipo}">
          <div class="collection-item__media">
            <span class="collection-item__tag">${p.tipoLabel}</span>
            ${mediaHTML}
          </div>
          <div class="collection-item__body">
            <h3>${p.titulo}</h3>
            <p>${p.descripcion}</p>
            <dl class="collection-meta">
              <dt>Fecha</dt><dd>${p.fecha}</dd>
              <dt>Autoría</dt><dd>${p.autoria}</dd>
              <dt>Archivo</dt><dd>${p.archivo}</dd>
              <dt>Derechos</dt><dd>${p.derechos}</dd>
            </dl>
            <span class="badge ${badges[p.condicion] || 'badge--pending'}">${p.condicionLabel}</span>
          </div>
        </article>
      `;
    }).join('');
  }

  function inicializarFiltrosColecciones() {
    const grupo = document.querySelector('[data-filter-group="#colecciones-grid"]');
    if (!grupo) return;
    const chips = grupo.querySelectorAll('.chip');
    const items = document.querySelectorAll('#colecciones-grid [data-cat]');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        const filter = chip.getAttribute('data-filter');
        items.forEach(item => {
          item.style.opacity = '';
          item.style.display = (filter === 'all' || item.getAttribute('data-cat') === filter) ? '' : 'none';
        });
      });
    });

    // Botón "Ver piezas destacadas"
    const btnDestacadas = document.getElementById('btn-destacadas');
    if (btnDestacadas) {
      btnDestacadas.addEventListener('click', () => {
        items.forEach(item => {
          const tieneImagen = !!item.querySelector('img');
          item.style.display = tieneImagen ? '' : 'none';
        });
      });
    }
  }

  /* ---------- 9B. NOTICIAS con paginación ---------- */
  const gridNoticias = document.getElementById('noticias-grid');
  if (gridNoticias && window.DATA_NOTICIAS) {
    let todosArticulos = window.DATA_NOTICIAS.articulos;
    let filtroActual = 'all';
    let paginaActual = 1;
    const POR_PAGINA = 12;

    renderPagina();
    inicializarFiltrosNoticias();

    function renderPagina() {
      const filtrados = filtroActual === 'all'
        ? todosArticulos
        : todosArticulos.filter(a => a.cat === filtroActual);

      const totalPaginas = Math.ceil(filtrados.length / POR_PAGINA) || 1;
      if (paginaActual > totalPaginas) paginaActual = totalPaginas;

      const inicio = (paginaActual - 1) * POR_PAGINA;
      const pagina = filtrados.slice(inicio, inicio + POR_PAGINA);

      gridNoticias.innerHTML = pagina.map(a => {
        const badgePatrocinado = a.patrocinado
          ? '<span class="badge-patrocinado">Patrocinado</span>'
          : '';
        const metaHTML = a.meta.map(m => `<span>${m}</span>`).join('');

        return `
          <a href="${a.url}" class="card card--cat-${a.cat}" data-cat="${a.cat}">
            ${badgePatrocinado}
            <div class="card__media"><img src="${a.imagen}" alt="${a.titulo}" loading="lazy"></div>
            <div class="card__body">
              <p class="card__kicker">${a.catLabel}</p>
              <h3 class="card__title">${a.titulo}</h3>
              <p class="card__text">${a.descripcion}</p>
              <div class="biz-card__meta" style="margin-top:.8rem;">${metaHTML}</div>
            </div>
          </a>
        `;
      }).join('');

      renderPaginacion(totalPaginas);
    }

    function renderPaginacion(totalPaginas) {
      let contenedor = document.getElementById('paginacion-noticias');
      if (!contenedor) {
        contenedor = document.createElement('nav');
        contenedor.id = 'paginacion-noticias';
        contenedor.className = 'pagination';
        contenedor.setAttribute('aria-label', 'Paginación de noticias');
        gridNoticias.parentElement.appendChild(contenedor);
      }

      if (totalPaginas <= 1) { contenedor.innerHTML = ''; return; }

      let html = '';
      html += `<button class="pagination__btn" ${paginaActual === 1 ? 'disabled' : ''} data-page="${paginaActual - 1}">← Anterior</button>`;
      for (let i = 1; i <= totalPaginas; i++) {
        html += `<button class="pagination__btn ${i === paginaActual ? 'is-active' : ''}" data-page="${i}">${i}</button>`;
      }
      html += `<button class="pagination__btn" ${paginaActual === totalPaginas ? 'disabled' : ''} data-page="${paginaActual + 1}">Siguiente →</button>`;
      contenedor.innerHTML = html;

      contenedor.querySelectorAll('[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
          const p = parseInt(btn.getAttribute('data-page'));
          if (p >= 1 && p <= totalPaginas && p !== paginaActual) {
            paginaActual = p;
            renderPagina();
            contenedor.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      });
    }

    function inicializarFiltrosNoticias() {
      const grupo = document.querySelector('[data-filter-group="#noticias-grid"]');
      if (!grupo) return;
      const chips = grupo.querySelectorAll('.chip');
      chips.forEach(chip => {
        chip.addEventListener('click', () => {
          chips.forEach(c => c.classList.remove('is-active'));
          chip.classList.add('is-active');
          filtroActual = chip.getAttribute('data-filter');
          paginaActual = 1;
          renderPagina();
        });
      });
    }
  } else if (gridNoticias) {
    console.warn('DATA_NOTICIAS no está definido. ¿Falta <script src="data/noticias.js">?');
  }
});