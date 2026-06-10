/* ═══════════════════════════════════════════════════
   VIDRIERÍA A&E — main.js
   Renderiza el contenido dinámico desde SITE_CONFIG,
   con accesibilidad (teclado, ARIA) y lazy loading.
   ═══════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Config: base + overrides guardados desde la extranet ── */
  var CFG = (typeof SITE_CONFIG !== 'undefined') ? SITE_CONFIG : {};
  try {
    var saved = localStorage.getItem('ae_siteconfig');
    if (saved) {
      var overrides = JSON.parse(saved);
      CFG = deepMerge(CFG, overrides);
    }
  } catch (e) { /* overrides corruptos: se ignoran y se usa la base */ }

  function deepMerge(base, extra) {
    var out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    Object.keys(extra || {}).forEach(function (k) {
      if (extra[k] && typeof extra[k] === 'object' && !Array.isArray(extra[k]) &&
          base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) {
        out[k] = deepMerge(base[k], extra[k]);
      } else {
        out[k] = extra[k];
      }
    });
    return out;
  }

  /* Construcción segura de nodos: nunca interpolar HTML con datos */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function setText(id, value) {
    var node = document.getElementById(id);
    if (node && value != null && value !== '') node.textContent = value;
  }

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HEX = /^#[0-9a-fA-F]{6}$/;

  /* ── 1. Colores de marca desde la config ── */
  function applyColors() {
    var c = CFG.colores || {};
    var root = document.documentElement.style;
    var map = {
      primario: '--blue', acento: '--blue-mid', secundario: '--yellow',
      fondo: '--bg', fondo2: '--bg2', texto: '--text',
      textoMuted: '--text-muted', tarjeta: '--card'
    };
    Object.keys(map).forEach(function (k) {
      if (HEX.test(c[k] || '')) root.setProperty(map[k], c[k]);
    });
  }

  /* ── 2. Textos editables (hero, topbar, footer) ── */
  function applyTexts() {
    var h = CFG.hero || {}, e = CFG.empresa || {};
    setText('hero-title1', h.titulo1);
    setText('hero-title2', h.titulo2);
    setText('hero-badge-text', h.badge);
    setText('hero-sub2', h.subtitulo2);
    setText('hero-cta-text', h.cta);
    setText('hero-cta2-text', h.ctaSecund);
    if (h.subtitulo) {
      var sub = document.getElementById('hero-sub');
      if (sub) {
        sub.textContent = '';
        sub.appendChild(document.createTextNode(h.subtitulo));
        sub.appendChild(document.createElement('br'));
        sub.appendChild(el('strong', { id: 'hero-sub2', text: h.subtitulo2 || '' }));
      }
    }
    setText('tb-tel1', e.tel1);
    setText('tb-tel2', e.tel2);
    setText('tb-email', e.email);
    setText('tb-ubicacion', (e.ubicacion || '').split(',').pop().trim() || e.ubicacion);

    var tel1 = document.getElementById('tb-tel1-link');
    var tel2 = document.getElementById('tb-tel2-link');
    var mail = document.getElementById('tb-email-link');
    if (tel1 && e.tel1) tel1.href = 'tel:+51' + e.tel1.replace(/\D/g, '');
    if (tel2 && e.tel2) tel2.href = 'tel:+51' + e.tel2.replace(/\D/g, '');
    if (mail && e.email) mail.href = 'mailto:' + e.email;

    ['tb-facebook', 'footer-fb'].forEach(function (id) {
      var a = document.getElementById(id);
      if (!a) return;
      if (e.facebook) { a.href = e.facebook; a.hidden = false; }
    });

    var wa = document.getElementById('wa-float');
    if (wa && e.whatsapp) {
      wa.href = 'https://wa.me/' + e.whatsapp.replace(/\D/g, '') +
        '?text=' + encodeURIComponent('Hola, quiero una cotización.');
    }
    var year = document.getElementById('footer-year');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  /* ── 3. Stats con contador animado ── */
  function renderStats() {
    var grid = document.getElementById('statsGrid');
    if (!grid || !CFG.stats) return;
    CFG.stats.forEach(function (s) {
      grid.appendChild(el('div', { 'class': 'stat-item' }, [
        el('div', { 'class': 'stat-icon', 'aria-hidden': 'true', text: s.icono }),
        el('div', { 'class': 'stat-number', 'data-valor': s.valor, 'data-prefijo': s.prefijo || '', 'data-sufijo': s.sufijo || '', text: (s.prefijo || '') + s.valor + (s.sufijo || '') }),
        el('div', { 'class': 'stat-label', text: s.label })
      ]));
    });
    if (reducedMotion || !('IntersectionObserver' in window)) return;
    var done = false;
    var io = new IntersectionObserver(function (entries) {
      if (done || !entries.some(function (x) { return x.isIntersecting; })) return;
      done = true; io.disconnect();
      grid.querySelectorAll('.stat-number').forEach(function (n) {
        var target = parseInt(n.getAttribute('data-valor'), 10) || 0;
        var pre = n.getAttribute('data-prefijo'), suf = n.getAttribute('data-sufijo');
        var t0 = performance.now(), dur = 1400;
        (function tick(t) {
          var p = Math.min((t - t0) / dur, 1);
          n.textContent = pre + Math.round(target * (1 - Math.pow(1 - p, 3))) + suf;
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: 0.4 });
    io.observe(grid);
  }

  /* ── 4. Servicios ── */
  function renderServices() {
    var grid = document.getElementById('servicesGrid');
    if (!grid || !CFG.servicios) return;
    CFG.servicios.forEach(function (s) {
      var img = el('img', {
        'class': 'service-card-img', src: s.imagen,
        alt: '', loading: 'lazy', decoding: 'async', width: '400', height: '200'
      });
      var features = el('div', { 'class': 'service-features' },
        (s.detalle || []).map(function (d) { return el('span', { 'class': 'service-feature', text: d }); }));
      var card = el('article', { 'class': 'service-card', 'data-aos': 'fade-up' }, [
        el('div', { 'class': 'service-card-top' }, [
          img,
          el('div', { 'class': 'service-card-top-overlay' }, [
            el('span', { 'class': 'service-emoji', 'aria-hidden': 'true', text: s.icono }),
            el('h3', { 'class': 'service-name', text: s.nombre })
          ])
        ]),
        el('div', { 'class': 'service-card-body' }, [
          el('p', { 'class': 'service-desc', text: s.desc }),
          features
        ]),
        el('div', { 'class': 'service-card-footer' }, [
          (function () {
            var a = el('a', { 'class': 'btn-service', href: '#contacto' });
            a.appendChild(document.createTextNode('Cotizar ' + s.nombre));
            var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '2.5');
            svg.setAttribute('aria-hidden', 'true');
            var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M5 12h14M12 5l7 7-7 7');
            svg.appendChild(path); a.appendChild(svg);
            return a;
          })()
        ])
      ]);
      grid.appendChild(card);
    });
  }

  /* ── 5. Por qué elegirnos ── */
  function renderFeatures() {
    var grid = document.getElementById('porqueElGrid');
    if (!grid || !CFG.porqueElegirnos) return;
    CFG.porqueElegirnos.forEach(function (f) {
      grid.appendChild(el('article', { 'class': 'feature-card', 'data-aos': 'fade-up' }, [
        el('div', { 'class': 'feature-icon-wrap', 'aria-hidden': 'true', text: f.icono }),
        el('h3', { text: f.titulo }),
        el('p', { text: f.desc })
      ]));
    });
  }

  /* ── 6. Proceso de trabajo ── */
  function renderProceso() {
    var wrap = document.getElementById('procesoTimeline');
    if (!wrap || !CFG.proceso) return;
    CFG.proceso.forEach(function (p, i) {
      wrap.appendChild(el('li', { 'class': 'timeline-step' }, [
        el('div', { 'class': 'step-number', 'aria-hidden': 'true', text: p.num }),
        el('span', { 'class': 'step-icon', 'aria-hidden': 'true', text: p.icono }),
        el('h4', { text: p.titulo }),
        el('p', { text: p.desc })
      ]));
      if (i < CFG.proceso.length - 1) {
        wrap.appendChild(el('li', { 'class': 'timeline-connector', 'aria-hidden': 'true' }));
      }
    });
  }

  /* ── 7. Galería con filtros + lightbox accesible ── */
  var galleryItems = [];
  var visibleItems = [];
  var lightboxIndex = 0;
  var lastFocused = null;

  function renderGallery() {
    var grid = document.getElementById('galleryGrid');
    if (!grid || !CFG.galeria) return;
    CFG.galeria.forEach(function (g, i) {
      var btn = el('button', {
        'class': 'gallery-item', type: 'button',
        'data-categoria': g.categoria, 'data-index': String(i),
        'aria-label': 'Ampliar imagen: ' + g.titulo + ' (' + g.categoria + ')'
      }, [
        el('img', { src: g.src, alt: g.titulo + ' — proyecto de ' + g.categoria, loading: 'lazy', decoding: 'async', width: '400', height: '300' }),
        el('span', { 'class': 'gallery-overlay' }, [
          el('span', { 'class': 'overlay-content' }, [
            el('span', { 'class': 'overlay-tag', text: g.categoria }),
            el('h4', { text: g.titulo })
          ])
        ])
      ]);
      btn.addEventListener('click', function () { openLightbox(parseInt(btn.getAttribute('data-index'), 10)); });
      grid.appendChild(btn);
      galleryItems.push(btn);
    });
    visibleItems = galleryItems.slice();

    document.querySelectorAll('.filter-btn').forEach(function (fb) {
      fb.addEventListener('click', function () {
        document.querySelectorAll('.filter-btn').forEach(function (b) {
          b.classList.remove('active'); b.setAttribute('aria-pressed', 'false');
        });
        fb.classList.add('active'); fb.setAttribute('aria-pressed', 'true');
        var filter = fb.getAttribute('data-filter');
        visibleItems = [];
        galleryItems.forEach(function (item) {
          var show = filter === 'all' || item.getAttribute('data-categoria') === filter;
          item.classList.toggle('hidden', !show);
          if (show) visibleItems.push(item);
        });
      });
    });
  }

  function openLightbox(index) {
    var lb = document.getElementById('lightbox');
    if (!lb) return;
    var pos = visibleItems.indexOf(galleryItems[index]);
    lightboxIndex = pos >= 0 ? pos : 0;
    lastFocused = document.activeElement;
    lb.hidden = false;
    lb.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateLightbox();
    document.getElementById('lightboxClose').focus();
  }

  function updateLightbox() {
    var item = visibleItems[lightboxIndex];
    if (!item) return;
    var data = CFG.galeria[parseInt(item.getAttribute('data-index'), 10)];
    var img = document.getElementById('lightboxImg');
    img.src = data.src;
    img.alt = data.titulo + ' — proyecto de ' + data.categoria;
    document.getElementById('lightboxCaption').textContent =
      data.titulo + ' · ' + (lightboxIndex + 1) + ' de ' + visibleItems.length;
  }

  function closeLightbox() {
    var lb = document.getElementById('lightbox');
    lb.classList.remove('active');
    lb.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  function moveLightbox(dir) {
    lightboxIndex = (lightboxIndex + dir + visibleItems.length) % visibleItems.length;
    updateLightbox();
  }

  function initLightbox() {
    var lb = document.getElementById('lightbox');
    if (!lb) return;
    document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
    document.getElementById('lightboxPrev').addEventListener('click', function () { moveLightbox(-1); });
    document.getElementById('lightboxNext').addEventListener('click', function () { moveLightbox(1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') moveLightbox(-1);
      else if (e.key === 'ArrowRight') moveLightbox(1);
      else if (e.key === 'Tab') {
        // Trampa de foco dentro del diálogo
        var focusables = lb.querySelectorAll('button');
        var first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ── 8. Tarjetas de contacto + footer ── */
  var ICONS = {
    whatsapp: 'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z',
    phone: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81a19.79 19.79 0 01-2.97-8.59A2 2 0 012.1 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z',
    email: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6',
    location: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z'
  };

  function svgIcon(d) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '2');
    svg.setAttribute('aria-hidden', 'true');
    d.split('|').forEach(function (seg) {
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', seg);
      svg.appendChild(path);
    });
    return svg;
  }

  function contactCard(cls, label, value, href) {
    var card = el(href ? 'a' : 'div', { 'class': 'contact-card ' + cls }, [
      el('span', { 'class': 'contact-card-icon' }, [svgIcon(ICONS[cls.replace('-card', '')])]),
      el('span', { 'class': 'contact-card-text' }, [
        el('span', { 'class': 'contact-label', text: label }),
        el('span', { 'class': 'contact-value', text: value })
      ])
    ]);
    if (href) { card.href = href; if (href.indexOf('http') === 0) { card.target = '_blank'; card.rel = 'noopener'; } }
    return card;
  }

  function renderContactCards() {
    var wrap = document.getElementById('contactCards');
    var e = CFG.empresa || {};
    if (!wrap) return;
    var waNum = (e.whatsapp || '').replace(/\D/g, '');
    if (waNum) wrap.appendChild(contactCard('whatsapp-card', 'WhatsApp', e.tel1 || waNum, 'https://wa.me/' + waNum));
    if (e.tel2) wrap.appendChild(contactCard('phone-card', 'Teléfono', e.tel2, 'tel:+51' + e.tel2.replace(/\D/g, '')));
    if (e.fijo) wrap.appendChild(contactCard('phone-card', 'Teléfono fijo', e.fijo, 'tel:+51' + e.fijo.replace(/\D/g, '')));
    if (e.email) wrap.appendChild(contactCard('email-card', 'Email', e.email, 'mailto:' + e.email));
    if (e.ubicacion) wrap.appendChild(contactCard('location-card', 'Dirección', e.ubicacion,
      'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(e.ubicacion)));
  }

  function renderFooter() {
    var list = document.getElementById('footer-services');
    if (list && CFG.servicios) {
      CFG.servicios.forEach(function (s) {
        list.appendChild(el('li', {}, [el('a', { href: '#servicios', text: s.nombre })]));
      });
    }
    var col = document.getElementById('footer-contact');
    var e = CFG.empresa || {};
    if (col) {
      if (e.tel1) col.appendChild(el('a', { href: 'tel:+51' + e.tel1.replace(/\D/g, ''), text: '📞 ' + e.tel1 }));
      if (e.tel2) col.appendChild(el('a', { href: 'tel:+51' + e.tel2.replace(/\D/g, ''), text: '📞 ' + e.tel2 }));
      if (e.email) col.appendChild(el('a', { href: 'mailto:' + e.email, text: '✉️ ' + e.email }));
      if (e.ubicacion) col.appendChild(el('p', { text: '📍 ' + e.ubicacion }));
    }
    setText('footer-slogan', (CFG.empresa || {}).slogan);
  }

  /* ── 9. Formulario: validación + envío por WhatsApp ── */
  function initForm() {
    var form = document.getElementById('contactForm');
    var msg = document.getElementById('formMessage');
    if (!form) return;
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var fields = ['nombre', 'telefono', 'servicio', 'mensaje'].map(function (id) {
        return document.getElementById(id);
      });
      var firstInvalid = null;
      fields.forEach(function (f) {
        var ok = f.checkValidity();
        f.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok && !firstInvalid) firstInvalid = f;
      });
      if (firstInvalid) {
        msg.className = 'form-message error';
        msg.textContent = 'Por favor revisa los campos marcados: ' + firstInvalid.labels[0].textContent + '.';
        firstInvalid.focus();
        return;
      }
      var e = CFG.empresa || {};
      var waNum = (e.whatsapp || '51945496351').replace(/\D/g, '');
      var text = 'Hola, soy ' + fields[0].value +
        '. Me interesa: ' + fields[2].value +
        '. Mi teléfono: ' + fields[1].value +
        '. Proyecto: ' + fields[3].value;
      window.open('https://wa.me/' + waNum + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
      msg.className = 'form-message success';
      msg.textContent = '¡Listo! Se abrió WhatsApp con tu solicitud. Si no se abrió, escríbenos al ' + (e.tel1 || '945 496 351') + '.';
      form.reset();
    });
  }

  /* ── 10. Navbar: scroll, menú móvil, sección activa ── */
  function initNav() {
    var navbar = document.getElementById('navbar');
    var burger = document.getElementById('hamburger');
    var links = document.getElementById('navLinks');

    window.addEventListener('scroll', function () {
      navbar.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });

    function setMenu(open) {
      links.classList.toggle('open', open);
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
      document.body.style.overflow = open ? 'hidden' : '';
    }
    burger.addEventListener('click', function () {
      setMenu(!links.classList.contains('open'));
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && links.classList.contains('open')) { setMenu(false); burger.focus(); }
    });

    if ('IntersectionObserver' in window) {
      var sections = document.querySelectorAll('main section[id]');
      var navAnchors = links.querySelectorAll('a[href^="#"]');
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          navAnchors.forEach(function (a) {
            a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id);
          });
        });
      }, { rootMargin: '-40% 0px -55% 0px' });
      sections.forEach(function (s) { io.observe(s); });
    }
  }

  /* ── 11. Reveal on scroll (AOS ligero) ── */
  function initAOS() {
    var nodes = document.querySelectorAll('[data-aos]');
    if (reducedMotion || !('IntersectionObserver' in window)) {
      nodes.forEach(function (n) { n.classList.add('aos-animate'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('aos-animate'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ── Init ── */
  function init() {
    applyColors();
    applyTexts();
    renderStats();
    renderServices();
    renderFeatures();
    renderProceso();
    renderGallery();
    initLightbox();
    renderContactCards();
    renderFooter();
    initForm();
    initNav();
    initAOS();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
