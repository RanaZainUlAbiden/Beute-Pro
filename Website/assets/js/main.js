/* =============================================================
   BÉUTE PRO — CORE
   Language · audio · cart · product rendering
   (scroll animation and header behaviour live in motion.js)
   ============================================================= */

/* ---------- tiny helpers ---------- */
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

const store = {
  get lang(){ try { return localStorage.getItem('bp_lang') || 'en'; } catch { return this._l || 'en'; } },
  set lang(v){ this._l = v; try { localStorage.setItem('bp_lang', v); } catch {} },
  get sound(){ try { return localStorage.getItem('bp_sound') === 'on'; } catch { return !!this._s; } },
  set sound(v){ this._s = v; try { localStorage.setItem('bp_sound', v ? 'on' : 'off'); } catch {} },
  get asked(){ try { return localStorage.getItem('bp_asked') === '1'; } catch { return !!this._a; } },
  set asked(v){ this._a = v; try { localStorage.setItem('bp_asked', v ? '1' : '0'); } catch {} }
};

let LANG = store.lang;
const t = k => (T[LANG] && T[LANG][k]) || (T.en[k]) || k;
const L = p => p[LANG] || p.en;
const isRTL = () => LANG === 'ar';
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- money ---------- */
function money(n){
  const sym = isRTL() ? CURRENCY.symbolAr : CURRENCY.symbol;
  const num = n.toLocaleString(isRTL() ? 'ar-EG' : 'en-US');
  return isRTL() ? `${num} ${sym}` : `${sym} ${num}`;
}

/* ---------- image paths, with a graceful stand-in ---------- */
const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <rect width="300" height="300" fill="#F7E7E3"/>
  <g fill="none" stroke="#D9B3AC" stroke-width="4" stroke-linejoin="round">
    <rect x="118" y="96" width="64" height="130" rx="9"/>
    <rect x="134" y="68" width="32" height="28" rx="5"/>
    <path d="M140 60h20"/>
  </g>
  <circle cx="150" cy="160" r="18" fill="none" stroke="#E2C0BA" stroke-width="3"/>
  <text x="150" y="262" text-anchor="middle" font-family="sans-serif" font-size="13"
        letter-spacing="2" fill="#C08A85">PHOTO PENDING</text>
</svg>`);

/* PNG first (transparent cut-outs), then JPG, then the stand-in */
function imgSrc(id, n = 1){ return `assets/img/products/${id}-${n}.png`; }
function catSrc(id){ return `assets/img/categories/${id}.jpg`; }

function guard(img){
  img.addEventListener('error', function handler(){
    const src = this.getAttribute('src') || '';
    if (src.endsWith('.png')){ this.src = src.slice(0, -4) + '.jpg';  return; }
    if (src.endsWith('.jpg')){ this.src = src.slice(0, -4) + '.jpeg'; return; }
    this.removeEventListener('error', handler);
    this.src = PLACEHOLDER;
    this.classList.add('is-placeholder');
  });
}
function guardAll(scope = document){ $$('img[data-fallback]', scope).forEach(guard); }

/* =============================================================
   LANGUAGE
   ============================================================= */
function applyLang(next){
  if (next) { LANG = next; store.lang = next; }
  const rtl = isRTL();
  document.documentElement.lang = LANG;
  document.documentElement.dir  = rtl ? 'rtl' : 'ltr';

  $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  $$('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  $$('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });

  $$('.lang-btn').forEach(b => { b.textContent = rtl ? 'EN' : 'ع'; });

  document.dispatchEvent(new CustomEvent('lang:change'));
}

function initLang(){
  $$('.lang-btn').forEach(b => b.addEventListener('click', () => applyLang(LANG === 'en' ? 'ar' : 'en')));
  applyLang();
}

/* =============================================================
   AUDIO
   The music is meant to start as soon as the page opens.

   Every current browser blocks sound that starts on its own —
   Chrome, Safari and Firefox all require a gesture first. So we
   do both: try to play immediately (which succeeds once the
   visitor has some history with the site), and if the browser
   refuses, start on the very first thing they do — a move, a
   scroll, a tap, a key. In practice that is under a second.

   If someone presses mute, that choice is remembered and the
   music will not start itself again.
   ============================================================= */
const Audio_ = {
  el:null, wants:true, started:false, armed:false,

  init(){
    this.el = $('#bp-audio');
    if (!this.el) return;

    this.el.volume = 0;
    this.el.loop = true;
    // muted by default is what lets some browsers begin at all;
    // we unmute the moment playback is actually running
    this.el.muted = false;

    // default ON, unless they turned it off on a previous visit
    let saved = null;
    try { saved = localStorage.getItem('bp_sound'); } catch {}
    this.wants = saved !== 'off';

    $$('.sound-btn').forEach(b => b.addEventListener('click', () => this.toggle()));
    this.paint();

    if (this.wants) this.attempt();
  },

  /* try straight away; fall back to the first gesture */
  attempt(){
    const p = this.el.play();
    if (p && typeof p.then === 'function'){
      p.then(() => { this.started = true; this.fade(.28); })
       .catch(() => this.arm());
    } else {
      this.arm();
    }
  },

  /* almost anything counts as the gesture that unlocks audio */
  arm(){
    if (this.armed) return;
    this.armed = true;

    const events = ['pointerdown','touchstart','keydown','wheel','scroll','mousemove'];
    const go = () => {
      events.forEach(ev => removeEventListener(ev, go, true));
      this.armed = false;
      if (!this.wants) return;
      this.el.play().then(() => { this.started = true; this.fade(.28); }).catch(() => {});
    };
    events.forEach(ev => addEventListener(ev, go, { capture:true, once:true, passive:true }));
  },

  toggle(){ this.wants ? this.stop() : this.play(); },

  play(){
    this.wants = true;
    try { localStorage.setItem('bp_sound','on'); } catch {}
    this.paint();
    this.el.play().then(() => { this.started = true; this.fade(.28); }).catch(() => this.arm());
  },

  stop(){
    this.wants = false;
    try { localStorage.setItem('bp_sound','off'); } catch {}
    this.paint();
    this.fade(0, () => this.el && this.el.pause());
  },

  fade(to, done){
    if (!this.el) return;
    const from = this.el.volume, steps = 24;
    let i = 0;
    clearInterval(this._f);
    this._f = setInterval(() => {
      i++;
      this.el.volume = Math.max(0, Math.min(1, from + (to - from) * (i / steps)));
      if (i >= steps){ clearInterval(this._f); done && done(); }
    }, 25);
  },

  paint(){ $$('.sound-btn').forEach(b => b.classList.toggle('is-on', this.wants)); }
};

/* =============================================================
   CART  (demo only — lives in memory for the session)
   ============================================================= */
const Cart = {
  items:[],

  add(id, qty = 1){
    const line = this.items.find(i => i.id === id);
    line ? line.qty += qty : this.items.push({ id, qty });
    this.paint(); this.open(); toast(t('cart.added'));
  },
  setQty(id, qty){
    const line = this.items.find(i => i.id === id);
    if (!line) return;
    line.qty = qty;
    if (line.qty < 1) this.items = this.items.filter(i => i.id !== id);
    this.paint();
  },
  remove(id){ this.items = this.items.filter(i => i.id !== id); this.paint(); },
  count(){ return this.items.reduce((n, i) => n + i.qty, 0); },
  total(){
    return this.items.reduce((n, i) => {
      const p = PRODUCTS.find(x => x.id === i.id);
      return n + (p ? p.price * i.qty : 0);
    }, 0);
  },

  open(){ $('#cart').classList.add('is-open'); $('#scrim').classList.add('is-open'); document.body.classList.add('is-locked'); },
  close(){ $('#cart').classList.remove('is-open'); $('#scrim').classList.remove('is-open'); document.body.classList.remove('is-locked'); },

  paint(){
    const n = this.count();
    $$('.cart-count').forEach(c => { c.textContent = n; c.style.display = n ? 'grid' : 'none'; });

    const box = $('#cart-items');
    if (!box) return;

    if (!this.items.length){
      box.innerHTML = `
        <div class="cart__empty">
          <svg viewBox="0 0 24 24"><path d="M6 6h15l-1.5 9h-12z"/><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M6 6 5 2H2"/></svg>
          <p>${t('cart.empty')}</p>
          <a class="btn btn--outline btn--sm" href="shop.html">${t('cart.emptycta')}</a>
        </div>`;
    } else {
      box.innerHTML = this.items.map(i => {
        const p = PRODUCTS.find(x => x.id === i.id);
        if (!p) return '';
        return `
        <div class="citem">
          <img class="citem__img" src="${imgSrc(p.id)}" alt="${L(p).name}" data-fallback>
          <div>
            <div class="citem__name">${L(p).name}</div>
            <div class="citem__price">${money(p.price)}</div>
            <div class="qty">
              <button data-q="-" data-id="${p.id}" aria-label="−">−</button>
              <span>${i.qty}</span>
              <button data-q="+" data-id="${p.id}" aria-label="+">+</button>
            </div>
          </div>
          <button class="citem__x" data-x="${p.id}" aria-label="${t('cart.remove')}">×</button>
        </div>`;
      }).join('');
      guardAll(box);
    }

    const tot = $('#cart-total');
    if (tot) tot.textContent = money(this.total());
    const foot = $('#cart-foot');
    if (foot) foot.style.display = this.items.length ? 'block' : 'none';
  },

  init(){
    $$('[data-cart-open]').forEach(b => b.addEventListener('click', () => this.open()));
    $$('[data-cart-close]').forEach(b => b.addEventListener('click', () => this.close()));
    $('#scrim')?.addEventListener('click', () => this.close());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.close(); });

    $('#cart-items')?.addEventListener('click', e => {
      const q = e.target.closest('[data-q]');
      const x = e.target.closest('[data-x]');
      if (q){
        const line = this.items.find(i => i.id === q.dataset.id);
        if (!line) return;
        this.setQty(q.dataset.id, line.qty + (q.dataset.q === '+' ? 1 : -1));
      }
      if (x) this.remove(x.dataset.x);
    });

    this.paint();
  }
};

/* toast ------------------------------------------------------- */
let toastTimer;
function toast(msg){
  const el = $('#toast');
  if (!el) return;
  $('#toast-text').textContent = msg;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 2600);
}

/* =============================================================
   PRODUCT CARDS
   ============================================================= */
function badgeHTML(p){
  if (!p.badge) return '';
  return `<span class="pcard__badge pcard__badge--${p.badge}">${t('badge.' + p.badge)}</span>`;
}

function cardHTML(p){
  const c   = CATEGORIES.find(c => c.id === p.category);
  const nm  = L(p).name;
  const cat = c ? (isRTL() ? c.ar : c.en) : '';
  const price = p.oldPrice
    ? `<del>${money(p.oldPrice)}</del><ins>${money(p.price)}</ins>`
    : money(p.price);

  return `
  <article class="pcard" data-id="${p.id}" data-cat="${p.category}">
    <a class="pcard__stage" href="product.html?id=${p.id}" aria-label="${nm}">
      ${badgeHTML(p)}
      <img class="pcard__img" src="${imgSrc(p.id)}" alt="${nm}" data-fallback loading="lazy">
      <span class="pcard__quick">
        <span class="btn btn--green btn--sm btn--full" data-add="${p.id}">${t('pdp.add')}</span>
      </span>
    </a>
    <div class="pcard__body">
      <span class="pcard__cat">${cat}</span>
      <h3 class="pcard__name"><a href="product.html?id=${p.id}">${nm}</a></h3>
      <div class="pcard__price">${price}</div>
    </div>
  </article>`;
}

function renderGrid(sel, list){
  const box = $(sel);
  if (!box) return;
  box.innerHTML = list.map(cardHTML).join('');
  guardAll(box);
  if (window.Motion) Motion.reset(box);
}

/* the add-to-cart chip sits inside the card link, so stop navigation */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-add]');
  if (!b) return;
  e.preventDefault(); e.stopPropagation();
  Cart.add(b.dataset.add, 1);
});

/* Card hover is pure CSS now — a centred scale, identical on every card,
   so a row of products enlarges evenly instead of each drifting its own way.
   The 3D tilt still lives on the product page, in product.js. */

/* =============================================================
   CHROME
   ============================================================= */
function initNav(){
  const m = $('#mnav');
  $('#burger')?.addEventListener('click', () => { m.classList.add('is-open'); document.body.classList.add('is-locked'); });
  const close = () => { m.classList.remove('is-open'); document.body.classList.remove('is-locked'); };
  $('#mnav-close')?.addEventListener('click', close);
  $$('#mnav a').forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

/* =============================================================
   SHOP MEGA MENU
   The desktop dropdown and the mobile accordion both need the
   same category list and the same featured product, sourced live
   from CATEGORIES/PRODUCTS. Rendering that in one shared place
   (rather than a copy of this script pasted into all seven pages)
   is what keeps them from silently drifting apart — the same
   reason the header/mnav/footer markup itself has to stay
   byte-identical across pages.
   ============================================================= */
const MegaMenu = {
  featuredId: 'herbal-hair-oil',

  paint(){
    const catsHTML = CATEGORIES.map(c =>
      `<li role="none"><a role="menuitem" href="shop.html?cat=${c.id}">${isRTL() ? c.ar : c.en}</a></li>`
    ).join('');
    $$('.js-mega-cats').forEach(ul => { ul.innerHTML = catsHTML; });

    const p = PRODUCTS.find(x => x.id === this.featuredId) || PRODUCTS[0];
    if (!p) return;
    $$('.js-mega-feat').forEach(a => {
      a.href = `product.html?id=${p.id}`;
      const img = a.querySelector('img');
      img.src = imgSrc(p.id, 1); img.alt = L(p).name; guard(img);
      a.querySelector('.mega__feat-name').textContent = L(p).name;
      a.querySelector('.mega__feat-price').textContent = money(p.price);
    });
  },

  init(){
    this.paint();
    document.addEventListener('lang:change', () => this.paint());

    const wrap = $('#shop-mega-wrap');
    const trigger = $('#shop-mega-trigger');
    const panel = $('#shop-mega');
    if (!wrap || !trigger || !panel) return;

    const items = () => $$('a[role="menuitem"]', panel);

    const open = () => { wrap.classList.add('is-open'); trigger.setAttribute('aria-expanded', 'true'); };
    const close = (returnFocus) => {
      wrap.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      if (returnFocus) trigger.focus();
    };

    wrap.addEventListener('mouseenter', open);
    wrap.addEventListener('mouseleave', () => close(false));
    trigger.addEventListener('focus', open);
    wrap.addEventListener('focusout', e => { if (!wrap.contains(e.relatedTarget)) close(false); });

    wrap.addEventListener('keydown', e => {
      const list = items();
      if (!list.length) return;
      const i = list.indexOf(document.activeElement);

      if (e.key === 'Escape'){ close(true); return; }
      if (e.key === 'ArrowDown'){
        e.preventDefault();
        if (document.activeElement === trigger){ open(); list[0].focus(); }
        else list[Math.min(i + 1, list.length - 1)].focus();
      }
      if (e.key === 'ArrowUp'){
        e.preventDefault();
        if (i <= 0) trigger.focus();
        else list[i - 1].focus();
      }
    });
  }
};

/* mobile nav collapses the same Shop content into an accordion */
function initMobileShopAccordion(){
  const acc = $('#mnav-shop-acc');
  const btn = $('#mnav-shop-toggle');
  const panel = $('#mnav-shop-panel');
  if (!acc || !btn || !panel) return;

  btn.addEventListener('click', () => {
    const open = acc.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(open));
    panel.style.maxHeight = open ? panel.scrollHeight + 'px' : 0;
  });

  document.addEventListener('lang:change', () => {
    if (acc.classList.contains('is-open')) panel.style.maxHeight = panel.scrollHeight + 'px';
  });
}

/* the shop hero photo may not exist yet — fall back to the gradient */
function initPageHero(){
  const bg = $('.pagehero__bg');
  if (!bg) return;
  const img = bg.querySelector('img');
  if (!img) return bg.classList.add('is-empty');
  img.addEventListener('error', () => bg.classList.add('is-empty'), { once:true });
  if (img.complete && img.naturalWidth === 0) bg.classList.add('is-empty');
}

function initMarquee(){
  const track = $('.marquee__track');
  if (track && track.children.length === 1) track.appendChild(track.firstElementChild.cloneNode(true));
}

function initNewsletter(){
  $('#news-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const i = $('#news-form input');
    if (i.value) { toast(isRTL() ? 'شكرًا لك — تم الاشتراك.' : 'Thanks — you are on the list.'); i.value = ''; }
  });
}

/* =============================================================
   BOOT
   ============================================================= */
document.addEventListener('DOMContentLoaded', () => {
  initLang();
  initNav();
  MegaMenu.init();
  initMobileShopAccordion();
  initMarquee();
  initPageHero();
  initNewsletter();
  Cart.init();
  Audio_.init();
  guardAll();

  if (typeof PAGE_INIT === 'function') PAGE_INIT();
});

document.addEventListener('lang:change', () => {
  Cart.paint();
  if (typeof PAGE_LANG === 'function') PAGE_LANG();
});