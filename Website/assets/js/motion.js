/* =============================================================
   BÉUTE PRO — MOTION LAYER
   Scroll reveals · word-by-word headlines · counters · parallax
   · magnetic buttons · header behaviour · progress bar

   Everything here degrades to nothing if the visitor has
   "reduce motion" switched on. Load this LAST.
   ============================================================= */

const Motion = {

  reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  io:null,

  /* ---------------------------------------------------------
     BOOT
     --------------------------------------------------------- */
  init(){
    this.buildObserver();
    this.splitHeadings();
    this.observe(document);
    this.header();
    this.progress();
    this.parallax();
    this.magnetic();
    this.toTop();
    this.tickerSpeed();
  },

  /* ---------------------------------------------------------
     REVEAL ENGINE
     One observer drives .reveal, .stagger, .split and
     .reveal-mask. Elements animate once, then stop being watched.
     --------------------------------------------------------- */
  buildObserver(){
    if (this.reduced){
      document.querySelectorAll('.reveal,.stagger,.split,.reveal-mask,.why')
              .forEach(el => el.classList.add('is-in'));
      return;
    }
    this.io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        this.io.unobserve(en.target);
      });
    }, { threshold:.1, rootMargin:'0px 0px -6% 0px' });
  },

  observe(scope = document){
    if (!this.io) return;
    scope.querySelectorAll('.reveal:not(.is-in), .reveal-mask:not(.is-in), .split:not(.is-in), .why:not(.is-in)')
         .forEach(el => this.io.observe(el));

    // staggered containers: space the children out
    scope.querySelectorAll('.stagger:not(.is-in)').forEach(box => {
      [...box.children].forEach((child, i) => {
        child.style.transitionDelay = `${Math.min(i, 8) * 85}ms`;
      });
      this.io.observe(box);
    });

    scope.querySelectorAll('[data-count]:not(.counted)').forEach(el => this.countUp(el));
  },

  /* re-arm a container whose contents were just re-rendered */
  reset(box){
    if (!box || this.reduced) return;
    box.classList.remove('is-in');
    this.observe(box.parentElement || box);
    if (box.classList.contains('stagger')) this.observe(box.ownerDocument);
  },

  /* ---------------------------------------------------------
     WORD-BY-WORD HEADLINES
     Each word gets an overflow box so it can slide up from
     behind the line above it. Works in Arabic too.
     --------------------------------------------------------- */
  splitHeadings(){
    if (this.reduced) return;
    document.querySelectorAll('[data-split]').forEach(el => {
      if (el.dataset.splitDone) return;
      el.dataset.splitDone = '1';
      el.classList.add('split');

      const walk = node => {
        [...node.childNodes].forEach(child => {
          if (child.nodeType === 3){                    // text
            const frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach(part => {
              if (!part.trim()){ frag.appendChild(document.createTextNode(part)); return; }
              const word = document.createElement('span');
              word.className = 'word';
              const inner = document.createElement('span');
              inner.textContent = part;
              word.appendChild(inner);
              frag.appendChild(word);
            });
            child.replaceWith(frag);
          } else if (child.nodeType === 1 && !child.classList.contains('word')){
            walk(child);
          }
        });
      };
      walk(el);

      // cascade the words
      [...el.querySelectorAll('.word > span')].forEach((s, i) => {
        s.style.transitionDelay = `${Math.min(i, 14) * 55}ms`;
      });
    });
  },

  /* re-split after a language change wipes the markup */
  resplit(){
    document.querySelectorAll('[data-split]').forEach(el => {
      delete el.dataset.splitDone;
      el.classList.remove('is-in');
    });
    this.splitHeadings();
    this.observe(document);
  },

  /* ---------------------------------------------------------
     NUMBER COUNTERS
     --------------------------------------------------------- */
  countUp(el){
    const target = parseFloat(el.dataset.count);
    if (isNaN(target)) return;
    el.classList.add('counted');

    if (this.reduced){ el.textContent = el.dataset.countPad ? String(target).padStart(2,'0') : target; return; }

    const run = () => {
      const dur = 1500, t0 = performance.now();
      const pad = el.dataset.countPad;
      const step = now => {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);            // ease-out cubic
        const v = Math.round(target * eased);
        el.textContent = pad ? String(v).padStart(2,'0') : v;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const once = new IntersectionObserver(en => {
      if (en[0].isIntersecting){ run(); once.disconnect(); }
    }, { threshold:.4 });
    once.observe(el);
  },

  /* ---------------------------------------------------------
     HEADER
     Transparent over the hero. Solid once scrolled.
     Hides on the way down, returns on the way up.
     --------------------------------------------------------- */
  header(){
    const head = document.querySelector('.site-head');
    if (!head) return;
    const solid = document.body.classList.contains('no-hero');
    let last = 0, ticking = false;

    const update = () => {
      const y = window.scrollY;
      if (!solid) head.classList.toggle('is-stuck', y > 60);
      else document.body.classList.toggle('scrolled', y > 60);

      const menuOpen = document.querySelector('.mnav.is-open');
      head.classList.toggle('is-hidden', y > 320 && y > last && !menuOpen);

      last = y;
      ticking = false;
    };

    addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive:true });

    update();
  },

  /* ---------------------------------------------------------
     SCROLL PROGRESS BAR
     --------------------------------------------------------- */
  progress(){
    const bar = document.querySelector('.progress');
    if (!bar) return;
    let ticking = false;
    const update = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      bar.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + '%';
      ticking = false;
    };
    addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive:true });
    update();
  },

  /* ---------------------------------------------------------
     PARALLAX — hero media drifts slower than the page
     --------------------------------------------------------- */
  parallax(){
    if (this.reduced) return;
    const items = [...document.querySelectorAll('[data-parallax]')];
    if (!items.length) return;

    let ticking = false;
    const update = () => {
      items.forEach(el => {
        const rect = el.parentElement.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > innerHeight) return;
        const speed = parseFloat(el.dataset.parallax) || .2;
        el.style.transform = `translate3d(0, ${-rect.top * speed}px, 0)`;
      });
      ticking = false;
    };
    addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive:true });
    update();
  },

  /* ---------------------------------------------------------
     MAGNETIC BUTTONS — the button leans toward the cursor
     --------------------------------------------------------- */
  magnetic(){
    if (this.reduced || matchMedia('(hover: none)').matches) return;
    document.querySelectorAll('[data-magnetic]').forEach(btn => {
      let raf;
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * .22;
        const y = (e.clientY - r.top - r.height / 2) * .3;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          btn.style.transform = `translate(${x}px, ${y}px)`;
        });
      });
      btn.addEventListener('mouseleave', () => {
        cancelAnimationFrame(raf);
        btn.style.transform = '';
      });
    });
  },

  /* ---------------------------------------------------------
     BACK TO TOP
     --------------------------------------------------------- */
  toTop(){
    const btn = document.querySelector('.totop');
    if (!btn) return;
    addEventListener('scroll', () => {
      btn.classList.toggle('is-on', scrollY > innerHeight * .8);
    }, { passive:true });
    btn.addEventListener('click', () => scrollTo({ top:0, behavior:'smooth' }));
  },

  /* ---------------------------------------------------------
     TICKER — nudges speed with scroll direction
     --------------------------------------------------------- */
  tickerSpeed(){
    if (this.reduced) return;
    const track = document.querySelector('.marquee__track');
    if (!track) return;
    let last = 0, timer;
    addEventListener('scroll', () => {
      const fast = Math.abs(scrollY - last) > 24;
      last = scrollY;
      track.style.animationDuration = fast ? '18s' : '38s';
      clearTimeout(timer);
      timer = setTimeout(() => { track.style.animationDuration = '38s'; }, 400);
    }, { passive:true });
  }
};

document.addEventListener('DOMContentLoaded', () => Motion.init());
document.addEventListener('lang:change', () => setTimeout(() => Motion.resplit(), 30));