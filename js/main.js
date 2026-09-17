/* Dental Studio Sydney — shared front-end behaviour (no build step, no framework). */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Mega-menu / practice dropdown ---------------- */
  function initNav() {
    var items = document.querySelectorAll('.nav-item[data-menu]');
    var closeTimer = null;

    function closeAll() {
      items.forEach(function (el) { el.classList.remove('is-open'); });
    }
    function openItem(el) {
      clearTimeout(closeTimer);
      closeAll();
      el.classList.add('is-open');
    }
    function scheduleClose() {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(closeAll, 320);
    }
    function holdOpen() {
      clearTimeout(closeTimer);
    }

    items.forEach(function (el) {
      el.addEventListener('mouseenter', function () { openItem(el); });
      el.addEventListener('mouseleave', scheduleClose);
      var panel = el.querySelector('.mega-menu, .drop-menu');
      if (panel) {
        panel.addEventListener('mouseenter', holdOpen);
        panel.addEventListener('mouseleave', scheduleClose);
      }
      var trigger = el.querySelector('.nav-trigger');
      if (trigger) {
        trigger.addEventListener('click', function (e) {
          e.preventDefault();
          if (el.classList.contains('is-open')) { closeAll(); } else { openItem(el); }
        });
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAll();
    });
    document.addEventListener('click', function (e) {
      items.forEach(function (el) {
        if (!el.contains(e.target)) el.classList.remove('is-open');
      });
    });

    var mq = window.matchMedia('(min-width: 1201px)');
    mq.addEventListener('change', function (e) {
      if (e.matches) closeAll();
    });
  }

  /* ---------------- Fullscreen overlay nav (mobile) ---------------- */
  function initOverlayNav() {
    var toggle = document.querySelector('.nav-mobile-toggle');
    var overlay = document.querySelector('[data-nav-overlay]');
    if (!toggle || !overlay) return;
    var closeBtn = overlay.querySelector('.nav-overlay__close');
    var lastFocus = null;

    function open() {
      lastFocus = document.activeElement;
      overlay.hidden = false;
      /* Force a reflow so the transition runs from the hidden state. */
      void overlay.offsetWidth;
      overlay.classList.add('is-open');
      toggle.classList.add('is-active');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('nav-open');
      if (closeBtn) closeBtn.focus();
    }
    function close() {
      overlay.classList.remove('is-open');
      toggle.classList.remove('is-active');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
      var done = function () {
        if (!overlay.classList.contains('is-open')) overlay.hidden = true;
        overlay.removeEventListener('transitionend', done);
      };
      overlay.addEventListener('transitionend', done);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    toggle.addEventListener('click', function () {
      if (overlay.classList.contains('is-open')) close(); else open();
    });
    if (closeBtn) closeBtn.addEventListener('click', close);
    overlay.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', close);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
    });
    window.matchMedia('(min-width: 1201px)').addEventListener('change', function (e) {
      if (e.matches && overlay.classList.contains('is-open')) close();
    });

    /* Accordion sections inside the overlay */
    overlay.querySelectorAll('.nav-acc').forEach(function (acc) {
      var head = acc.querySelector('.nav-acc__head');
      if (!head) return;
      head.addEventListener('click', function () {
        var isOpen = acc.classList.contains('is-open');
        overlay.querySelectorAll('.nav-acc').forEach(function (other) {
          other.classList.remove('is-open');
          var h = other.querySelector('.nav-acc__head');
          if (h) h.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          acc.classList.add('is-open');
          head.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ---------------- Scroll reveal ---------------- */
  function initReveal() {
    var targets = document.querySelectorAll('.reveal');
    if (!targets.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (t) { t.classList.add('in-view'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var delay = Math.min(parseInt(el.dataset.revealIndex || '0', 10), 5) * 70;
          setTimeout(function () { el.classList.add('in-view'); }, delay);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ---------------- Photo settle ---------------- */
  function initPhotoSettle() {
    var imgs = document.querySelectorAll('.photo-well img:not(.above-fold)');
    if (!imgs.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      imgs.forEach(function (img) { img.classList.add('is-settled'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-settled');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    imgs.forEach(function (img) {
      if (img.complete) io.observe(img);
      else img.addEventListener('load', function () { io.observe(img); }, { once: true });
    });
  }

  /* ---------------- Hero crossfade ---------------- */
  function initHero() {
    var slides = document.querySelectorAll('[data-hero-slide]');
    if (!slides.length) return;
    var cycle = 32; /* seconds, matches heroFade keyframes */
    var step = cycle / slides.length;
    slides.forEach(function (slide, i) {
      slide.style.animationDuration = cycle + 's';
      slide.style.animationDelay = (i * step) + 's';
      slide.classList.add('is-active');
    });
  }

  /* ---------------- Team: daily-seeded shuffle + hover/tap bio ---------------- */
  function dailyOrder(list) {
    var day = Math.floor(Date.now() / 86400000);
    var s = (day * 2654435761) % 4294967296;
    function rnd() { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function initPrincipalShuffle() {
    var wrap = document.querySelector('[data-principals]');
    if (!wrap) return;
    var cards = Array.prototype.slice.call(wrap.children);
    var ordered = dailyOrder(cards);
    ordered.forEach(function (card) { wrap.appendChild(card); });
  }

  function initTeamCards() {
    var cards = document.querySelectorAll('.team-card');
    cards.forEach(function (card) {
      function open() { cards.forEach(function (c) { c.classList.remove('is-open'); }); card.classList.add('is-open'); }
      function close() { card.classList.remove('is-open'); }
      card.addEventListener('mouseenter', open);
      card.addEventListener('mouseleave', close);
      card.addEventListener('click', function (e) {
        e.preventDefault();
        if (card.classList.contains('is-open')) close(); else open();
      });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.classList.contains('is-open') ? close() : open(); }
      });
    });
  }

  /* ---------------- Offers accordion (mobile) ---------------- */
  function initOffers() {
    var wrap = document.querySelector('[data-offers]');
    if (!wrap) return;
    var items = Array.prototype.slice.call(wrap.querySelectorAll('.offer-item'));
    var accordionMq = window.matchMedia('(max-width: 860px)');

    items.forEach(function (item) {
      var head = item.querySelector('.offer-item__head');
      if (!head) return;
      head.addEventListener('click', function () {
        /* Above the accordion breakpoint the panels are always open, so the
           header behaves as a plain link through to the offers page. */
        if (!accordionMq.matches) {
          window.location.href = 'offers.html';
          return;
        }
        var isOpen = item.classList.contains('is-open');
        items.forEach(function (other) {
          other.classList.remove('is-open');
          var h = other.querySelector('.offer-item__head');
          if (h) h.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          item.classList.add('is-open');
          head.setAttribute('aria-expanded', 'true');
        }
      });
    });

    accordionMq.addEventListener('change', function () {
      items.forEach(function (item) {
        item.classList.remove('is-open');
        var h = item.querySelector('.offer-item__head');
        if (h) h.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------------- Floating contact popup ---------------- */
  function initAskBar() {
    var bar = document.querySelector('[data-ask-bar]');
    if (!bar) return;

    var DISMISS_KEY = 'ds-ask-dismissed';
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === '1') return;
    } catch (e) { /* private mode — just show it */ }

    bar.hidden = false;
    bar.classList.add('is-hidden');

    /* Hold it back until the visitor has actually engaged with the page. */
    function reveal() {
      bar.classList.remove('is-hidden');
      window.removeEventListener('scroll', onScroll);
    }
    function onScroll() {
      if (window.scrollY > 400) reveal();
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    setTimeout(function () { if (window.scrollY > 400) reveal(); }, 100);

    var close = bar.querySelector('.ask-bar__close');
    if (close) {
      close.addEventListener('click', function () {
        bar.classList.add('is-hidden');
        window.removeEventListener('scroll', onScroll);
        try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
      });
    }
  }

  /* ---------------- Contact form ---------------- */
  function initContactForm() {
    var form = document.querySelector('[data-contact-form]');
    if (!form) return;
    var success = form.querySelector('.form-success');
    var error = form.querySelector('.form-error');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (error) error.classList.remove('is-visible');
      /*
       * No backend is wired up yet — see README "Contact form" section.
       * Wire this fetch() to the practice's real enquiry endpoint before
       * launch, and remove the client-only success message below.
       */
      if (success) success.classList.add('is-visible');
      form.reset();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initOverlayNav();
    initReveal();
    initPhotoSettle();
    initHero();
    initPrincipalShuffle();
    initTeamCards();
    initOffers();
    initAskBar();
    initContactForm();
  });
})();
