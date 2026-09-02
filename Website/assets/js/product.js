/* =============================================================
   BÉUTE PRO — PRODUCT PAGE
   Hover magnifier · 360 viewer · buy box
   ============================================================= */

let P;                      // the product being shown
let activeImg = 1;          // which photo is in the frame
let qty = 1;

/* =============================================================
   1. HOVER MAGNIFIER
   Above 1024px a magnified pane opens beside the frame.
   Below that, CSS scales the image inside the frame instead.
   ============================================================= */
function initZoom(){
  const box  = $('#zoom');
  const img  = $('#zoom-img');
  const lens = $('#zoom-lens');
  const pane = $('#zoom-pane');
  if (!box || !img) return;

  const wide = () => window.innerWidth > 1024;

  /* object-fit:contain letterboxes the photo inside its box, so work out
     where the picture actually sits before mapping the cursor onto it. */
  function contentRect(){
    const r = img.getBoundingClientRect();
    const nw = img.naturalWidth, nh = img.naturalHeight;
    if (!nw || !nh) return r;
    const s = Math.min(r.width / nw, r.height / nh);
    const w = nw * s, h = nh * s;
    return { left: r.left + (r.width - w) / 2, top: r.top + (r.height - h) / 2, width: w, height: h };
  }

  function move(e){
    const ir = contentRect();

    if (e.clientX < ir.left || e.clientX > ir.left + ir.width ||
        e.clientY < ir.top  || e.clientY > ir.top  + ir.height){
      return leave();
    }
    box.classList.add('is-zooming');

    if (!wide()) return;                       // small screens use the CSS scale

    const lw = lens.offsetWidth, lh = lens.offsetHeight;
    const factor = pane.offsetWidth / lw;

    let x = e.clientX - ir.left - lw / 2;
    let y = e.clientY - ir.top  - lh / 2;
    x = Math.max(0, Math.min(x, ir.width  - lw));
    y = Math.max(0, Math.min(y, ir.height - lh));

    const br = box.getBoundingClientRect();
    lens.style.left = (ir.left - br.left + x) + 'px';
    lens.style.top  = (ir.top  - br.top  + y) + 'px';

    pane.style.backgroundImage    = `url("${img.currentSrc || img.src}")`;
    pane.style.backgroundSize     = `${ir.width * factor}px ${ir.height * factor}px`;
    pane.style.backgroundPosition = `-${x * factor}px -${y * factor}px`;
  }

  function leave(){ box.classList.remove('is-zooming'); }

  box.addEventListener('mousemove', move);
  box.addEventListener('mouseleave', leave);

  initTouchZoom(box, img, contentRect);
}

/* =============================================================
   TOUCH ZOOM
   There is no hover on a phone, so the desktop lens does nothing
   there. Instead: tap the photo and it magnifies around the exact
   point you touched, drag to move around, tap again to exit.
   ============================================================= */
function initTouchZoom(box, img, contentRect){
  const touch = matchMedia('(hover: none)').matches || 'ontouchstart' in window;
  if (!touch) return;

  const hint = document.querySelector('.zoom__hint [data-i18n]');
  if (hint){ hint.dataset.i18n = 'pdp.taphint'; hint.textContent = t('pdp.taphint'); }

  let zoomed = false, sx = 0, sy = 0, moved = 0, t0 = 0;

  /* put the transform origin exactly under the finger, as a
     percentage of the visible picture rather than of its box */
  const originAt = (cx, cy) => {
    const r = contentRect();
    const x = Math.max(0, Math.min(100, ((cx - r.left) / r.width)  * 100));
    const y = Math.max(0, Math.min(100, ((cy - r.top)  / r.height) * 100));
    img.style.transformOrigin = `${x}% ${y}%`;
  };

  const zoomIn = (cx, cy) => {
    originAt(cx, cy);
    zoomed = true;
    box.classList.add('is-zooming', 'is-pinned');
    if (hint){ hint.dataset.i18n = 'pdp.panhint'; hint.textContent = t('pdp.panhint'); }
  };

  const zoomOut = () => {
    zoomed = false;
    box.classList.remove('is-zooming', 'is-pinned');
    img.style.transformOrigin = '';
    if (hint){ hint.dataset.i18n = 'pdp.taphint'; hint.textContent = t('pdp.taphint'); }
  };

  box.addEventListener('touchstart', e => {
    const p = e.touches[0];
    sx = p.clientX; sy = p.clientY; moved = 0; t0 = Date.now();
  }, { passive:true });

  box.addEventListener('touchmove', e => {
    const p = e.touches[0];
    moved = Math.max(moved, Math.hypot(p.clientX - sx, p.clientY - sy));
    if (!zoomed) return;
    e.preventDefault();          // pan the photo instead of scrolling the page
    originAt(p.clientX, p.clientY);
  }, { passive:false });

  box.addEventListener('touchend', e => {
    const quick = Date.now() - t0 < 350;
    if (moved > 12 || !quick) return;           // that was a drag or a long press
    const p = e.changedTouches[0];
    zoomed ? zoomOut() : zoomIn(p.clientX, p.clientY);
  });

  // changing photo or language resets the state
  document.addEventListener('lang:change', () => {
    if (hint) hint.textContent = t(hint.dataset.i18n);
  });
  document.querySelector('#thumbs')?.addEventListener('click', zoomOut);
  document.querySelectorAll('.vtab').forEach(b => b.addEventListener('click', zoomOut));
}

/* =============================================================
   2. THE 360 VIEWER
   Two modes, chosen automatically:

   SPIN  — real frames found in  assets/img/spin/<id>/frame-01.jpg ...
           drag left/right steps through them, which is what every
           "360° view" on a retail site actually is.

   TILT  — no frames yet. One photo, tilted in 3D against its shadow
           so the visitor still gets a sense of the object. This is a
           stand-in, and the label says so.

   Drop the frames in and it switches over on its own.
   ============================================================= */
const Spin = {
  frames:[], mode:'tilt', i:0, dragging:false, lastX:0, rot:0,

  async init(id){
    this.box   = $('#spin');
    this.img   = $('#spin-img');
    this.label = $('#spin-mode');
    this.hint  = $('#spin-hint');
    if (!this.box) return;

    this.frames = await this.probe(id);
    this.mode   = this.frames.length >= 8 ? 'spin' : 'tilt';

    if (this.mode === 'spin'){
      this.img.src = this.frames[0];
      this.preload();
    } else {
      this.img.src = imgSrc(id, 1);
      guard(this.img);
    }
    this.paintLabel();
    this.bind();
    if (this.mode === 'spin') this.hintSpin();
  },

  /* one gentle rotation the first time the tab is opened */
  hintSpin(){
    if (reduced) return;
    const io = new IntersectionObserver(en => {
      if (!en[0].isIntersecting || this.hinted) return;
      this.hinted = true; io.disconnect();
      let k = 0;
      const tick = setInterval(() => {
        if (this.dragging || k >= this.frames.length){ clearInterval(tick); return; }
        this.i = (this.i + 1) % this.frames.length;
        this.img.src = this.frames[this.i];
        k++;
      }, 85);
    }, { threshold:.5 });
    io.observe(this.box);
  },

  /* look for frame-01 … frame-36 and keep the run that exists */
  probe(id){
    const test = n => new Promise(res => {
      const stem = `assets/img/spin/${id}/frame-${String(n).padStart(2,'0')}`;
      const tryExt = list => {
        if (!list.length) return res(null);
        const src = `${stem}.${list[0]}`;
        const im = new Image();
        im.onload  = () => res(src);
        im.onerror = () => tryExt(list.slice(1));
        im.src = src;
      };
      tryExt(['png','jpg','jpeg']);
    });
    return Promise.all(Array.from({ length:36 }, (_, k) => test(k + 1)))
                  .then(r => { const out = []; for (const s of r){ if (!s) break; out.push(s); } return out; });
  },

  preload(){ this.frames.forEach(s => { const i = new Image(); i.src = s; }); },

  paintLabel(){
    if (this.label) this.label.textContent = this.mode === 'spin' ? t('pdp.spinmode') : t('pdp.tiltmode');
    if (this.hint)  this.hint.textContent  = this.mode === 'spin' ? t('pdp.draghint') : t('pdp.zoomhint');
  },

  bind(){
    const b = this.box;
    const down = e => {
      this.dragging = true; this.lastX = (e.touches ? e.touches[0] : e).clientX;
      b.classList.add('is-dragging');
    };
    const up = () => {
      this.dragging = false; b.classList.remove('is-dragging');
      if (this.mode === 'tilt') this.setTilt(0, 0);   // ease back to square
    };
    const move = e => {
      const pt = e.touches ? e.touches[0] : e;

      if (this.mode === 'tilt' && !this.dragging){
        const r = b.getBoundingClientRect();
        return this.setTilt(((pt.clientX - r.left) / r.width - .5), ((pt.clientY - r.top) / r.height - .5));
      }
      if (!this.dragging) return;
      e.preventDefault?.();

      if (this.mode === 'spin'){
        const dx = pt.clientX - this.lastX;
        // fewer frames -> longer drag per step, so 10 frames still feel smooth
        const step = Math.max(6, Math.round(340 / this.frames.length));
        if (Math.abs(dx) < step) return;
        this.lastX = pt.clientX;
        const dir = isRTL() ? -1 : 1;
        this.i = (this.i + (dx > 0 ? -dir : dir) + this.frames.length) % this.frames.length;
        this.img.src = this.frames[this.i];
      } else {
        const r = b.getBoundingClientRect();
        this.setTilt(((pt.clientX - r.left) / r.width - .5) * 2, ((pt.clientY - r.top) / r.height - .5));
      }
    };

    b.addEventListener('mousedown', down);
    b.addEventListener('touchstart', down, { passive:true });
    addEventListener('mouseup', up);
    addEventListener('touchend', up);
    b.addEventListener('mouseleave', up);
    b.addEventListener('mousemove', move);
    b.addEventListener('touchmove', move, { passive:false });
  },

  setTilt(x, y){
    if (reduced) return;
    const max = 26;
    this.img.style.transform =
      `perspective(1000px) rotateY(${x * max}deg) rotateX(${-y * 10}deg) translateZ(30px) scale(${1 + Math.abs(x) * .04})`;
    this.img.style.transition = this.dragging ? 'none' : 'transform .5s cubic-bezier(.22,.61,.36,1)';
  }
};

/* =============================================================
   3. PAGE RENDER
   ============================================================= */
function paintProduct(){
  const c = CATEGORIES.find(c => c.id === P.category);
  const d = L(P);

  document.title = `${d.name} — Béute Pro`;

  $('#p-cat').textContent   = c ? (isRTL() ? c.ar : c.en) : '';
  $('#p-name').textContent  = d.name;
  $('#p-tag').textContent   = d.tagline;
  $('#p-size').textContent  = P.size;
  $('#p-desc').textContent  = d.description;
  $('#crumb-name').textContent = d.name;

  $('#p-price').innerHTML = P.oldPrice
    ? `<strong>${money(P.price)}</strong><del>${money(P.oldPrice)}</del>`
    : `<strong>${money(P.price)}</strong>`;

  $('#acc-ing').innerHTML  = d.ingredients.map(i => `<li>${i}</li>`).join('');
  $('#acc-ben').innerHTML  = d.benefits.map(i => `<li>${i}</li>`).join('');
  $('#acc-use').textContent = d.usage;

  // thumbnails
  const th = $('#thumbs');
  th.innerHTML = Array.from({ length: P.images || 1 }, (_, k) => `
    <button class="thumb ${k === 0 ? 'is-active' : ''}" data-n="${k + 1}">
      <img src="${imgSrc(P.id, k + 1)}" alt="${d.name} ${k + 1}" data-fallback>
    </button>`).join('');
  guardAll(th);

  $('#zoom-img').src = imgSrc(P.id, 1);
  guard($('#zoom-img'));

  // the 360 tab only appears when the product is marked for it
  $('#tab-spin').style.display = P.spin ? '' : 'none';

  // related
  const rel = PRODUCTS.filter(x => x.id !== P.id)
                      .sort((a, b) => (b.category === P.category) - (a.category === P.category))
                      .slice(0, 4);
  renderGrid('#related', rel);
}

function initPDPControls(){
  // thumbnails
  $('#thumbs').addEventListener('click', e => {
    const b = e.target.closest('.thumb');
    if (!b) return;
    activeImg = +b.dataset.n;
    $$('.thumb').forEach(x => x.classList.toggle('is-active', x === b));
    const img = $('#zoom-img');
    img.src = imgSrc(P.id, activeImg);
    guard(img);
  });

  // viewer tabs
  $$('.vtab').forEach(tab => tab.addEventListener('click', () => {
    $$('.vtab').forEach(x => x.classList.toggle('is-active', x === tab));
    $$('.viewer__panel').forEach(p => p.classList.toggle('is-active', p.id === tab.dataset.panel));
  }));

  // quantity
  $('#qty-minus').onclick = () => { qty = Math.max(1, qty - 1); $('#qty-val').textContent = qty; };
  $('#qty-plus').onclick  = () => { qty = Math.min(99, qty + 1); $('#qty-val').textContent = qty; };

  $('#p-add').onclick = () => Cart.add(P.id, qty);
  $('#p-buy').onclick = () => { Cart.add(P.id, qty); };

  // accordion
  $$('.acc__btn').forEach(btn => btn.addEventListener('click', () => {
    const item = btn.closest('.acc__item');
    const panel = $('.acc__panel', item);
    const open = item.classList.toggle('is-open');
    panel.style.maxHeight = open ? panel.scrollHeight + 'px' : 0;
  }));
  // first one starts open
  const first = $('.acc__item');
  if (first){ first.classList.add('is-open'); $('.acc__panel', first).style.maxHeight = $('.acc__panel', first).scrollHeight + 'px'; }
}

/* =============================================================
   HOOKS called by main.js
   ============================================================= */
function PAGE_INIT(){
  const id = new URLSearchParams(location.search).get('id');
  P = PRODUCTS.find(p => p.id === id) || PRODUCTS[0];

  paintProduct();
  initPDPControls();
  initZoom();
  if (P.spin) Spin.init(P.id);
}

function PAGE_LANG(){
  if (!P) return;                       // language applied before the product loaded
  paintProduct();
  Spin.paintLabel();
  // re-open the first accordion panel at its new height
  const first = $('.acc__item.is-open .acc__panel');
  if (first) first.style.maxHeight = first.scrollHeight + 'px';
}