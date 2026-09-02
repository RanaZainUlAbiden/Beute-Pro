/* =============================================================
   BÉUTE PRO — HERO SLIDER
   Replaces the video. Autoplay + drag + arrows + dots +
   keyboard, pauses on hover and when the tab is hidden.
   ============================================================= */

const Slider = {

  i:0, n:0, timer:null,

  /* ---- SLIDE TIMING ----------------------------------------
     2000 = two seconds, as requested. The cross-fade is 0.5s,
     so a slide is fully readable for about 1.5s. If that reads
     too fast, 4500 is the comfortable number. ------------- */
  ms:2000,

  dragging:false, startX:0, dx:0,

  init(){
    this.root   = document.querySelector('#hero');
    if (!this.root) return;
    this.slides = [...this.root.querySelectorAll('.slide')];
    this.dots   = [...this.root.querySelectorAll('.sdot')];
    this.n      = this.slides.length;
    if (this.n < 2){ this.slides[0]?.classList.add('is-on'); return; }

    this.root.style.setProperty('--slide-ms', this.ms + 'ms');
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.go(0, true);
    this.bind();
    if (!this.reduced) this.play();
  },

  /* ---------- moving between slides ---------- */
  go(next, instant){
    this.i = (next + this.n) % this.n;

    this.slides.forEach((s, k) => s.classList.toggle('is-on', k === this.i));

    // restarting the dot animation needs a reflow, or it never replays
    this.dots.forEach((d, k) => {
      d.classList.toggle('is-on', k === this.i);
      const bar = d.querySelector('i');
      if (bar){ bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
    });

    const num = this.root.querySelector('#slide-num');
    if (num) num.textContent = String(this.i + 1).padStart(2, '0');

    this.paintCard();
    if (!instant && !this.reduced) this.play();   // restart the clock
  },

  next(){ this.go(this.i + 1); },
  prev(){ this.go(this.i - 1); },

  /* ---------- autoplay ---------- */
  play(){
    clearInterval(this.timer);
    if (this.reduced) return;
    this.timer = setInterval(() => this.next(), this.ms);
    this.root.classList.remove('is-paused');
  },
  pause(){ clearInterval(this.timer); this.root.classList.add('is-paused'); },

  /* ---------- the floating product card follows the slide ---------- */
  paintCard(){
    const card = this.root.querySelector('#hero-card');
    if (!card || typeof PRODUCTS === 'undefined') return;

    const id = this.slides[this.i].dataset.product;
    const p  = PRODUCTS.find(x => x.id === id);
    if (!p){ card.style.display = 'none'; return; }

    const c = CATEGORIES.find(c => c.id === p.category);
    card.style.display = '';
    card.href = `product.html?id=${p.id}`;
    card.querySelector('.hero__card-tag').textContent   = c ? (isRTL() ? c.ar : c.en) : '';
    card.querySelector('.hero__card-name').textContent  = L(p).name;
    card.querySelector('.hero__card-price').textContent = money(p.price);

    const img = card.querySelector('img');
    img.src = imgSrc(p.id, 1);
    img.alt = L(p).name;
    guard(img);
  },

  /* ---------- input ---------- */
  bind(){
    this.root.querySelector('#s-next')?.addEventListener('click', () => this.next());
    this.root.querySelector('#s-prev')?.addEventListener('click', () => this.prev());
    this.dots.forEach((d, k) => d.addEventListener('click', () => this.go(k)));

    // hover pauses, but only where hovering is a real thing
    if (!matchMedia('(hover: none)').matches){
      this.root.addEventListener('mouseenter', () => this.pause());
      this.root.addEventListener('mouseleave', () => this.play());
    }

    // don't run the clock in a background tab
    document.addEventListener('visibilitychange', () => {
      document.hidden ? this.pause() : this.play();
    });

    // arrow keys, but only while the slider is on screen
    document.addEventListener('keydown', e => {
      if (!this.inView()) return;
      if (e.key === 'ArrowRight') isRTL() ? this.prev() : this.next();
      if (e.key === 'ArrowLeft')  isRTL() ? this.next() : this.prev();
    });

    // drag / swipe
    const down = e => {
      this.dragging = true; this.dx = 0;
      this.startX = (e.touches ? e.touches[0] : e).clientX;
      this.pause();
    };
    const move = e => {
      if (!this.dragging) return;
      this.dx = (e.touches ? e.touches[0] : e).clientX - this.startX;
    };
    const up = () => {
      if (!this.dragging) return;
      this.dragging = false;
      const threshold = 60;
      if (Math.abs(this.dx) > threshold){
        const fwd = this.dx < 0;
        (isRTL() ? !fwd : fwd) ? this.next() : this.prev();
      } else {
        this.play();
      }
      this.dx = 0;
    };

    this.root.addEventListener('mousedown', down);
    this.root.addEventListener('touchstart', down, { passive:true });
    addEventListener('mousemove', move);
    addEventListener('touchmove', move, { passive:true });
    addEventListener('mouseup', up);
    addEventListener('touchend', up);
  },

  inView(){
    const r = this.root.getBoundingClientRect();
    return r.bottom > 80 && r.top < innerHeight;
  },

  /* the slide images may not exist yet — fall back to the gradient */
  guardImages(){
    this.root?.querySelectorAll('.slide__bg img').forEach(img => {
      img.addEventListener('error', () => img.closest('.slide__bg')?.classList.add('is-empty'), { once:true });
      if (img.complete && img.naturalWidth === 0) img.closest('.slide__bg')?.classList.add('is-empty');
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Slider.guardImages();
  Slider.init();
});

/* the card text is language-dependent */
document.addEventListener('lang:change', () => Slider.paintCard && Slider.root && Slider.paintCard());