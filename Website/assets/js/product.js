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
   2. THE 360° VIEWER
   A short looping video per product at assets/video/spin/<id>.mp4.
   preload="metadata" doubles as the existence probe — loadedmetadata
   vs error tells PAGE_INIT whether to show the tab at all, and only
   the header is fetched until the visitor actually opens it and the
   video starts playing.
   ============================================================= */
const Spin = {
  box:null, video:null, ready:false, dragging:false, io:null, resumeTimer:null,

  init(id){
    this.box   = $('#spin');
    this.video = $('#spin-video');
    if (!this.box || !this.video) return Promise.resolve(false);

    const video = this.video;
    video.poster = imgSrc(id, 1);
    if (reduced) video.removeAttribute('autoplay');   // poster frame only, ever

    return new Promise(resolve => {
      const done = ok => {
        video.removeEventListener('loadedmetadata', onOk);
        video.removeEventListener('error', onErr);
        resolve(ok);
      };
      const onOk  = () => done(true);
      const onErr = () => done(false);
      video.addEventListener('loadedmetadata', onOk, { once:true });
      video.addEventListener('error', onErr, { once:true });
      video.src = `assets/video/spin/${id}.mp4`;
      video.load();
    }).then(ok => {
      this.ready = ok;
      if (ok){ this.bind(); this.watch(); }
      return ok;
    });
  },

  tabOpen(){ return $('#panel-spin')?.classList.contains('is-active'); },

  /* pause off screen, resume once the tab is open and in view */
  watch(){
    if (reduced) return;                  // reduced motion: poster only, never autoplays
    this.io = new IntersectionObserver(en => {
      if (en[0].isIntersecting && this.tabOpen()) this.play();
      else this.video.pause();
    }, { threshold:.3 });
    this.io.observe(this.box);
  },

  play(){ if (!this.dragging) this.video.play().catch(() => {}); },

  /* called on tab switch, and after a drag/keystep ends */
  onTabChange(){
    if (!this.ready) return;
    if (this.tabOpen() && !reduced) this.play();
    else this.video.pause();
  },

  bind(){
    const box = this.box, video = this.video;
    let sx = 0, sy = 0, axis = null, startTime = 0;

    const scrub = clientX => {
      const rect = box.getBoundingClientRect();
      const dir = isRTL() ? -1 : 1;
      const t = startTime + ((clientX - sx) / rect.width) * video.duration * dir;
      video.currentTime = ((t % video.duration) + video.duration) % video.duration;
    };

    const start = e => {
      const p = e.touches ? e.touches[0] : e;
      sx = p.clientX; sy = p.clientY; axis = null;
      startTime = video.currentTime || 0;
      this.dragging = true;
      video.pause();
      box.classList.add('is-dragging');
    };

    const end = () => {
      if (!this.dragging) return;
      this.dragging = false;
      box.classList.remove('is-dragging');
      this.onTabChange();                 // resumes the loop, if the tab is open and visible
    };

    const move = e => {
      if (!this.dragging) return;
      const p = e.touches ? e.touches[0] : e;
      const dx = p.clientX - sx, dy = p.clientY - sy;

      if (axis === null){
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (axis === 'y') return end();   // vertical intent: let the page scroll instead
      }
      if (axis !== 'x' || !video.duration) return;
      e.preventDefault();                 // scrubbing now, not scrolling
      scrub(p.clientX);
    };

    box.addEventListener('mousedown', start);
    box.addEventListener('touchstart', start, { passive:true });
    addEventListener('mousemove', move);
    box.addEventListener('touchmove', move, { passive:false });
    addEventListener('mouseup', end);
    addEventListener('touchend', end);

    const nudge = delta => {
      video.pause();
      const t = video.currentTime + delta;
      video.currentTime = ((t % video.duration) + video.duration) % video.duration;
      clearTimeout(this.resumeTimer);
      this.resumeTimer = setTimeout(() => this.onTabChange(), 650);
    };
    box.addEventListener('keydown', e => {
      if (!video.duration) return;
      const dir = isRTL() ? -1 : 1, step = video.duration / 24;
      if (e.key === 'ArrowRight') nudge(step * dir);
      else if (e.key === 'ArrowLeft') nudge(-step * dir);
    });
  }
};

/* =============================================================
   3. PAGE RENDER
   Photos: up to five, <id>-1.jpg … <id>-5.jpg. Probed once per
   product and cached — a missing file anywhere in the run stops
   the count there, so a single -1 photo renders as a deliberate
   single frame rather than a rail with broken thumbnails.
   ============================================================= */
const _photoCache = {};
function probePhotos(id){
  if (_photoCache[id]) return _photoCache[id];
  const test = n => new Promise(res => {
    const im = new Image();
    im.onload  = () => res(true);
    im.onerror = () => res(false);
    im.src = imgSrc(id, n);
  });
  return _photoCache[id] = Promise.all([1, 2, 3, 4, 5].map(test)).then(flags => {
    const out = [];
    for (const ok of flags){ if (!ok) break; out.push(out.length + 1); }
    return out.length ? out : [1];
  });
}

function paintThumbs(id, name){
  const th = $('#thumbs');
  probePhotos(id).then(list => {
    if (id !== P.id) return;              // a fast language/product change moved on
    th.style.display = list.length > 1 ? '' : 'none';
    th.innerHTML = list.map(n => `
      <button class="thumb ${n === 1 ? 'is-active' : ''}" data-n="${n}">
        <img src="${imgSrc(id, n)}" alt="${name} ${n}" data-fallback>
      </button>`).join('');
    guardAll(th);
  });
}

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

  $('#zoom-img').src = imgSrc(P.id, 1);
  guard($('#zoom-img'));
  activeImg = 1;
  paintThumbs(P.id, d.name);

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
    Spin.onTabChange();
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

  Spin.init(P.id).then(ok => { $('#tab-spin').style.display = ok ? '' : 'none'; });
}

function PAGE_LANG(){
  if (!P) return;                       // language applied before the product loaded
  paintProduct();
  // re-open the first accordion panel at its new height
  const first = $('.acc__item.is-open .acc__panel');
  if (first) first.style.maxHeight = first.scrollHeight + 'px';
}