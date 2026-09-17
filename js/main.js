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
      var panel = el.querySelector('.mega-menu, .practice-menu');
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

    /* Mobile nav panel */
    var toggle = document.querySelector('.nav-mobile-toggle');
    var panel = document.querySelector('.nav-mobile-panel');
    if (toggle && panel) {
      toggle.addEventListener('click', function () {
        panel.classList.toggle('is-open');
      });
      panel.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { panel.classList.remove('is-open'); });
      });
    }
    var mq = window.matchMedia('(min-width: 1041px)');
    mq.addEventListener('change', function (e) {
      if (e.matches && panel) panel.classList.remove('is-open');
      if (e.matches) closeAll();
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
    initReveal();
    initPhotoSettle();
    initHero();
    initPrincipalShuffle();
    initTeamCards();
    initContactForm();
  });
})();
