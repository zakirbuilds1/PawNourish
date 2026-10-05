/* PawNourish Natural Pet Food — store interactions */
(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // all prices are in US cents, so totals never pick up floating-point errors
  const money = cents => '$' + (cents / 100).toFixed(2);
  const store = {
    get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ } }
  };

  /* =========================================================
     Catalog — the single source of truth for names and prices
     ========================================================= */
  const PRODUCTS = [
    { id: 'chicken',     name: 'Grain-Free Chicken Recipe', sub: 'Dog Food',        pet: 'dog',     price: 2499, rating: 4.8, reviews: 246, badge: ['Best Choice', ''],       tag: 'Grain-Free',  title: 'Chicken Recipe',        forLabel: 'Dog Food',   bag: ['#f7c95c', '#e39a2f', '#6b3707'], photo: 'c-dog' },
    { id: 'indoor-cat',  name: 'Indoor Cat Formula',        sub: 'Cat Food',        pet: 'cat',     price: 2199, rating: 4.7, reviews: 189, badge: ['Most Popular', 'purple'], tag: 'Indoor',      title: 'Cat Formula',           forLabel: 'Cat Food',   bag: ['#f6c2cf', '#e0849f', '#7a2342'], photo: 'c-cat' },
    { id: 'timothy-hay', name: 'Organic Timothy Hay',       sub: 'Small Pet Food',  pet: 'small',   price: 1699, rating: 4.8, reviews: 128, badge: ['Natural', ''],            tag: 'Organic',     title: 'Timothy Hay',           forLabel: 'Small Pet',  bag: ['#c6e19e', '#8fbd5e', '#2c5414'], photo: 'c-rabbit' },
    { id: 'color-boost', name: 'Color Boost Fish Food',     sub: 'Aquarium Formula', pet: 'fish',   price: 1499, rating: 4.6, reviews: 97,  badge: ['Premium', 'blue'],        tag: 'Color Boost', title: 'Fish Food',             forLabel: 'Aquarium',   bag: ['#acd9f3', '#5ba8dd', '#163f66'], photo: 'c-fish' },
    { id: 'salmon',      name: 'Salmon & Sweet Potato',     sub: 'Dog Food',        pet: 'dog',     price: 2799, rating: 4.9, reviews: 164, badge: ['New', 'orange'],          tag: 'Wild-Caught', title: 'Salmon & Sweet Potato', forLabel: 'Dog Food',   bag: ['#a3dacd', '#4faa98', '#0f463c'], photo: 'c-dog' },
    { id: 'seed-mix',    name: 'Wild Seed & Fruit Mix',     sub: 'Bird Food',       pet: 'bird',    price: 1299, rating: 4.7, reviews: 83,  badge: null,                       tag: 'Wild Seed',   title: 'Fruit Mix',             forLabel: 'Bird Food',  bag: ['#e5ed8f', '#bfcf4a', '#434b0d'], photo: 'c-bird' },
    { id: 'tuna',        name: 'Ocean Tuna Pâté',           sub: 'Wet Cat Food, 12 cans', pet: 'cat', price: 1899, rating: 4.6, reviews: 142, badge: ['Grain-Free', ''],       tag: 'Ocean',       title: 'Tuna Pâté',             forLabel: 'Cat Food',   bag: ['#c7d0f4', '#8797dc', '#222c68'], photo: 'c-cat' },
    { id: 'reptile',     name: 'Calcium Plus Pellets',      sub: 'Reptile Food',    pet: 'reptile', price: 1599, rating: 4.5, reviews: 51,  badge: ['Vet Pick', 'blue'],       tag: 'Calcium Plus', title: 'Reptile Pellets',      forLabel: 'Reptile',    bag: ['#eed6a8', '#cfa45f', '#553808'], photo: 'c-reptile' }
  ];
  const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
  const PET_LABEL = { all: 'all foods', dog: 'dog food', cat: 'cat food', small: 'small pet food', bird: 'bird food', fish: 'fish food', reptile: 'reptile food' };
  const SUB_DISCOUNT = 0.15;
  const FREE_SHIP_AT = 5000;     // $50.00
  const SHIPPING = 599;          // $5.99
  const PROMO = { code: 'WELCOME20', rate: 0.2, label: 'WELCOME20, 20% off first order' };

  const PAW = '<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="42" rx="14" ry="12"/><ellipse cx="14" cy="27" rx="6.5" ry="8" transform="rotate(-18 14 27)"/><ellipse cx="25" cy="16" rx="6.5" ry="8.5" transform="rotate(-6 25 16)"/><ellipse cx="39" cy="16" rx="6.5" ry="8.5" transform="rotate(6 39 16)"/><ellipse cx="50" cy="27" rx="6.5" ry="8" transform="rotate(18 50 27)"/></svg>';
  const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';
  const BAG_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.2 11.2a1.5 1.5 0 0 1-1.5 1.3H7.7a1.5 1.5 0 0 1-1.5-1.3z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/></svg>';
  const bagVars = p => `--b1:${p.bag[0]};--b2:${p.bag[1]};--ink:${p.bag[2]}`;
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

  /* ---------- Header ---------- */
  const header = $('#siteHeader');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Menus: mobile, Shop dropdown, account ---------- */
  const toggle = $('.menu-toggle');
  const mobileMenu = $('#mobileMenu');
  const setMobile = open => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobileMenu.hidden = !open;
  };
  toggle.addEventListener('click', () => setMobile(mobileMenu.hidden));
  $$('a', mobileMenu).forEach(a => a.addEventListener('click', () => setMobile(false)));

  const popovers = [
    [$('.drop-btn'), $('#shopDrop')],
    [$('#acctBtn'), $('#acctMenu')]
  ];
  const closePopovers = except => popovers.forEach(([btn, panel]) => {
    if (btn === except) return;
    btn.setAttribute('aria-expanded', 'false');
    panel.hidden = true;
  });
  popovers.forEach(([btn, panel]) => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      closePopovers(btn);
      const open = panel.hidden;
      panel.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
    });
    $$('a', panel).forEach(a => a.addEventListener('click', () => closePopovers()));
  });
  document.addEventListener('click', e => { if (!e.target.closest('.has-drop, .acct')) closePopovers(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closePopovers(); setMobile(false); } });
  window.addEventListener('resize', () => { if (window.innerWidth > 1040) setMobile(false); });

  /* ---------- Image fade-in over the blurred placeholder ---------- */
  const watchFade = root => $$('.fade-img', root).forEach(img => {
    const done = () => img.classList.add('is-loaded');
    if (img.complete && img.naturalWidth) done();
    else { img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true }); }
  });
  watchFade(document);

  /* ---------- Horizontal rails (pets, reviews) ---------- */
  $$('.rail').forEach(rail => {
    const track = rail.querySelector('.pet-track, .review-track');
    const prev = rail.querySelector('.prev');
    const next = rail.querySelector('.next');
    const step = () => {
      const item = track.firstElementChild;
      return item ? (item.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 16)) * (track.classList.contains('pet-track') ? 3 : 1) : 200;
    };
    const update = () => {
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    };
    prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: reduceMotion ? 'auto' : 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: reduceMotion ? 'auto' : 'smooth' }));
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  /* =========================================================
     Products: render, filter, search, wishlist
     ========================================================= */
  const grid = $('#productGrid');
  const note = $('#resultNote');
  const chips = $$('.chip');
  let wishlist = new Set(store.get('pawnourish-wish', []));
  let filter = 'all';
  let query = '';

  const card = (p, i) => `
    <article class="product" style="--i:${i}" data-id="${p.id}">
      <div class="p-media" style="${bagVars(p)}">
        ${p.badge ? `<span class="p-badge ${p.badge[1]}">${p.badge[0]}</span>` : ''}
        <button class="wish" type="button" data-wish="${p.id}" aria-pressed="${wishlist.has(p.id)}" aria-label="Save ${esc(p.name)} to favorites">${HEART}</button>
        <div class="bag" aria-hidden="true">
          <span class="bag-crimp"></span>
          <div class="bag-label">
            ${PAW}
            <span class="bag-brand">PawNourish</span>
            <span class="bag-tag">${p.tag}</span>
            <span class="bag-title">${esc(p.title)}</span>
            <span class="bag-for">${p.forLabel}</span>
          </div>
        </div>
        <img class="p-pet" src="images/${p.photo}-280.webp" alt="" width="280" height="280" loading="lazy" decoding="async">
      </div>
      <div class="p-body">
        <h3>${esc(p.name)}</h3>
        <p class="p-sub">${p.sub}</p>
        <p class="p-rating"><span class="stars" style="--r:${p.rating}" role="img" aria-label="Rated ${p.rating} out of 5"></span><span>${p.rating} (${p.reviews})</span></p>
        <p class="p-price">${money(p.price)}</p>
        <button class="btn btn-green btn-block" type="button" data-add="${p.id}">${BAG_ICON}Add to Cart</button>
      </div>
    </article>`;

  const render = () => {
    const q = query.trim().toLowerCase();
    const list = PRODUCTS.filter(p =>
      (filter === 'all' || p.pet === filter) &&
      (!q || `${p.name} ${p.sub} ${p.tag} ${p.pet}`.toLowerCase().includes(q))
    );
    grid.innerHTML = list.length
      ? list.map(card).join('')
      : `<p class="no-results">No foods match &ldquo;${esc(query)}&rdquo;${filter !== 'all' ? ` in ${PET_LABEL[filter]}` : ''}. Try another word or <button type="button" data-clear>show everything</button>.</p>`;
    if (q || filter !== 'all') {
      note.hidden = false;
      note.innerHTML = `Showing ${list.length} ${list.length === 1 ? 'food' : 'foods'}${q ? ` for &ldquo;${esc(query)}&rdquo;` : ''}${filter !== 'all' ? ` in ${PET_LABEL[filter]}` : ''}<button type="button" data-clear>Clear</button>`;
    } else {
      note.hidden = true;
    }
  };

  const setFilter = f => {
    filter = PET_LABEL[f] ? f : 'all';
    chips.forEach(c => {
      const on = c.dataset.filter === filter;
      c.classList.toggle('is-on', on);
      c.setAttribute('aria-pressed', String(on));
    });
    render();
  };

  // any link or chip with data-filter (hero, dropdown, pet circles, footer) filters the grid
  document.addEventListener('click', e => {
    const f = e.target.closest('[data-filter]');
    if (f) setFilter(f.dataset.filter);
    if (e.target.closest('[data-clear]')) {
      query = '';
      $('#searchInput').value = '';
      setFilter('all');
    }
  });

  const searchInput = $('#searchInput');
  searchInput.addEventListener('input', () => { query = searchInput.value; render(); });
  $('#searchForm').addEventListener('submit', e => {
    e.preventDefault();
    query = searchInput.value;
    render();
    $('#featured').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  grid.addEventListener('click', e => {
    const w = e.target.closest('[data-wish]');
    if (!w) return;
    const id = w.dataset.wish;
    if (wishlist.has(id)) wishlist.delete(id); else wishlist.add(id);
    store.set('pawnourish-wish', [...wishlist]);
    w.setAttribute('aria-pressed', String(wishlist.has(id)));
    w.classList.remove('pop'); void w.offsetWidth; w.classList.add('pop');
    showToast(wishlist.has(id) ? `Saved ${byId[id].name} to favorites` : `Removed ${byId[id].name} from favorites`, false);
  });

  render();

  /* ---------- Promo code chip ---------- */
  const copyBtn = $('#copyCode');
  copyBtn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(PROMO.code); showToast('Code WELCOME20 copied. Paste it in your cart.', false); }
    catch { showToast('Use code WELCOME20 in your cart for 20% off.', false); }
    copyBtn.classList.add('copied');
    setTimeout(() => copyBtn.classList.remove('copied'), 1600);
  });

  /* ---------- FAQ links open the right answer ---------- */
  $$('[data-faq]').forEach(link => link.addEventListener('click', () => {
    const item = document.getElementById(link.dataset.faq);
    if (!item) return;
    item.open = true;
    item.classList.remove('flash'); void item.offsetWidth; item.classList.add('flash');
    setTimeout(() => item.classList.remove('flash'), 1800);
  }));

  /* =========================================================
     Cart
     line key: product id, or "id|sub|weeks" for a subscription
     ========================================================= */
  let cart = store.get('pawnourish-cart-v1', {});
  let promoOn = store.get('pawnourish-promo', false);
  Object.keys(cart).forEach(k => { if (!byId[k.split('|')[0]] || !(cart[k] > 0)) delete cart[k]; });
  const saveCart = () => { store.set('pawnourish-cart-v1', cart); store.set('pawnourish-promo', promoOn); };

  const lineInfo = key => {
    const [id, kind, weeks] = key.split('|');
    const p = byId[id];
    const isSub = kind === 'sub';
    return { p, isSub, weeks, unit: isSub ? Math.round(p.price * (1 - SUB_DISCOUNT)) : p.price };
  };
  const count = () => Object.values(cart).reduce((a, b) => a + b, 0);
  const totals = () => {
    let sub = 0, oneTime = 0;
    for (const [key, q] of Object.entries(cart)) {
      const { isSub, unit } = lineInfo(key);
      sub += unit * q;
      if (!isSub) oneTime += unit * q;
    }
    const discount = promoOn ? Math.round(oneTime * PROMO.rate) : 0;
    const afterDiscount = sub - discount;
    const shipping = sub === 0 || afterDiscount >= FREE_SHIP_AT ? 0 : SHIPPING;
    return { sub, discount, afterDiscount, shipping, total: afterDiscount + shipping };
  };

  const cartBtn = $('#cartBtn');
  const badge = $('#cartCount');
  const drawer = $('#cartDrawer');
  const list = $('#cartList');
  const views = { cart: $('#viewCart'), checkout: $('#viewCheckout'), done: $('#viewDone') };
  const setView = name => Object.entries(views).forEach(([k, el]) => { el.hidden = k !== name; });

  const renderCart = () => {
    const n = count();
    const t = totals();
    badge.textContent = n;
    badge.classList.toggle('has-items', n > 0);
    cartBtn.setAttribute('aria-label', `Open cart, ${n} ${n === 1 ? 'item' : 'items'}`);

    list.innerHTML = Object.entries(cart).map(([key, q]) => {
      const { p, isSub, weeks, unit } = lineInfo(key);
      return `<li data-key="${key}">
        <span class="mini-bag" style="${bagVars(p)}"><i>${PAW}</i></span>
        <div><p class="ci-name">${esc(p.name)}</p>
          <p class="ci-meta${isSub ? ' sub' : ''}">${isSub ? `Every ${weeks} weeks &middot; ${money(unit)} (15% off)` : `${money(unit)} each`}</p>
          <button class="ci-remove" type="button" data-act="remove">Remove</button></div>
        <div class="qty"><button type="button" data-act="dec" aria-label="One less ${esc(p.name)}">&minus;</button><span>${q}</span><button type="button" data-act="inc" aria-label="One more ${esc(p.name)}">+</button></div>
      </li>`;
    }).join('');

    $('#cartEmpty').hidden = n > 0;
    $('#cartFoot').hidden = n === 0;
    $('#shipMeter').hidden = n === 0;
    const left = Math.max(0, FREE_SHIP_AT - t.afterDiscount);
    $('#shipText').innerHTML = left > 0 ? `Add <strong>${money(left)}</strong> more for free shipping` : 'You&rsquo;ve unlocked <strong>free shipping</strong>';
    $('#shipBar').style.width = Math.min(100, (t.afterDiscount / FREE_SHIP_AT) * 100) + '%';

    $('#subTotal').textContent = money(t.sub);
    $('#discountRow').hidden = !t.discount;
    $('#discountLabel').textContent = promoOn ? '(WELCOME20)' : '';
    $('#discount').textContent = '−' + money(t.discount);
    $('#shipping').textContent = t.shipping ? money(t.shipping) : 'Free';
    $('#grandTotal').textContent = money(t.total);
    $('#coItems').textContent = n;
    $('#coTotal').textContent = money(t.total);
    if (promoOn) { $('#promoMsg').textContent = t.discount ? `${PROMO.code} applied: you save ${money(t.discount)}` : `${PROMO.code} applies to one-time items`; $('#promoMsg').classList.remove('error'); }
  };

  const openCart = () => {
    setMobile(false);
    closePopovers();
    toast.hidden = true;
    if (!views.done.hidden) setView('cart');
    if (typeof drawer.showModal === 'function') drawer.showModal(); else drawer.setAttribute('open', '');
    document.body.classList.add('no-scroll');
  };
  cartBtn.addEventListener('click', openCart);
  [drawer, $('#subDialog')].forEach(dlg => {
    dlg.addEventListener('close', () => document.body.classList.remove('no-scroll'));
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    $$('[data-close]', dlg).forEach(b => b.addEventListener('click', () => dlg.close()));
  });

  list.addEventListener('click', e => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const key = btn.closest('li').dataset.key;
    if (btn.dataset.act === 'inc') cart[key] += 1;
    if (btn.dataset.act === 'dec') cart[key] -= 1;
    if (btn.dataset.act === 'remove' || cart[key] <= 0) delete cart[key];
    saveCart(); renderCart();
  });

  $('#promoForm').addEventListener('submit', e => {
    e.preventDefault();
    const code = $('#promoInput').value.trim().toUpperCase();
    const msg = $('#promoMsg');
    if (code === PROMO.code) {
      promoOn = true;
      $('#promoInput').value = '';
    } else {
      msg.textContent = code ? `"${code}" isn't a valid code.` : 'Enter a promo code.';
      msg.classList.add('error');
    }
    saveCart(); renderCart();
  });

  /* toast */
  const toast = $('#toast');
  let toastTimer;
  function showToast(text, withCart = true) {
    $('#toastText').textContent = text;
    $('#toastView').hidden = !withCart;
    toast.hidden = false;
    toast.style.animation = 'none'; void toast.offsetWidth; toast.style.animation = '';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 3000);
  }
  $('#toastView').addEventListener('click', openCart);

  /* the pet photo flies into the cart */
  const flyToCart = source => {
    const bump = () => { cartBtn.classList.remove('bump'); void cartBtn.offsetWidth; cartBtn.classList.add('bump'); };
    if (reduceMotion || !source) { bump(); return; }
    const from = source.getBoundingClientRect();
    const to = cartBtn.getBoundingClientRect();
    const ghost = source.cloneNode(true);
    ghost.className = 'p-pet fly';
    Object.assign(ghost.style, { left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px', right: 'auto', bottom: 'auto', margin: 0 });
    document.body.appendChild(ghost);
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    ghost.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * .5}px, ${dy * .5 - 70}px) scale(.7)`, opacity: 1, offset: .55 },
      { transform: `translate(${dx}px, ${dy}px) scale(.2)`, opacity: .4 }
    ], { duration: 750, easing: 'cubic-bezier(.45,.05,.55,.95)' }).onfinish = () => { ghost.remove(); bump(); };
  };

  const addLine = (key, qty = 1) => {
    cart[key] = (cart[key] || 0) + qty;
    saveCart(); renderCart();
  };

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-add]');
    if (!btn) return;
    const p = byId[btn.dataset.add];
    if (!p) return;
    addLine(p.id);
    flyToCart(btn.closest('.product')?.querySelector('.p-pet'));
    btn.classList.add('added');
    btn.innerHTML = `${BAG_ICON}Added!`;
    setTimeout(() => { btn.classList.remove('added'); btn.innerHTML = `${BAG_ICON}Add to Cart`; }, 1100);
    const left = Math.max(0, FREE_SHIP_AT - totals().afterDiscount);
    showToast(`${p.name} added${left ? ` · ${money(left)} to free shipping` : ' · free shipping unlocked'}`);
  });

  /* checkout */
  const coForm = views.checkout;
  coForm.addEventListener('input', e => { const f = e.target.closest('.field.has-error'); if (f) f.classList.remove('has-error'); });
  $('#toCheckout').addEventListener('click', () => { setView('checkout'); $('#c-name').focus(); });
  $('#backToCart').addEventListener('click', () => setView('cart'));
  coForm.addEventListener('submit', e => {
    e.preventDefault();
    const { name, email, address, zip } = coForm.elements;
    const checks = [
      [name, name.value.trim() === ''],
      [email, !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())],
      [address, address.value.trim().length < 6],
      [zip, !/^\d{5}(-\d{4})?$/.test(zip.value.trim())]
    ];
    checks.forEach(([el, bad]) => el.closest('.field').classList.toggle('has-error', bad));
    const firstBad = checks.find(([, bad]) => bad);
    if (firstBad) { firstBad[0].focus(); return; }
    const orderNo = 'PN-' + Math.floor(100000 + Math.random() * 900000);
    $('#doneTitle').textContent = `Thank you, ${name.value.trim().split(/\s+/)[0]}!`;
    $('#doneText').textContent = `Order ${orderNo} is confirmed. We've sent the receipt to ${email.value.trim()}, and your food ships within one business day.`;
    cart = {}; promoOn = false;
    saveCart(); renderCart();
    coForm.reset();
    $('#promoMsg').textContent = '';
    setView('done');
  });

  /* =========================================================
     Subscription builder
     ========================================================= */
  const subDialog = $('#subDialog');
  const subForm = $('#subForm');
  const subSelect = $('#s-product');
  let subQty = 1;
  subSelect.innerHTML = PRODUCTS.map(p => `<option value="${p.id}">${esc(p.name)} (${p.sub}) – ${money(p.price)}</option>`).join('');
  const updateSub = () => {
    const p = byId[subSelect.value];
    const was = p.price * subQty;
    const now = Math.round(p.price * (1 - SUB_DISCOUNT)) * subQty;
    $('#subQty').textContent = subQty;
    $('#subWas').textContent = money(was);
    $('#subNow').textContent = money(now);
    $('#subSave').textContent = money(was - now);
  };
  subSelect.addEventListener('change', updateSub);
  $('#subMinus').addEventListener('click', () => { subQty = Math.max(1, subQty - 1); updateSub(); });
  $('#subPlus').addEventListener('click', () => { subQty = Math.min(6, subQty + 1); updateSub(); });
  $('#openSub').addEventListener('click', () => {
    updateSub();
    if (typeof subDialog.showModal === 'function') subDialog.showModal(); else subDialog.setAttribute('open', '');
    document.body.classList.add('no-scroll');
  });
  subForm.addEventListener('submit', e => {
    e.preventDefault();
    const p = byId[subSelect.value];
    const weeks = subForm.elements.freq.value;
    addLine(`${p.id}|sub|${weeks}`, subQty);
    subDialog.close();
    subQty = 1;
    showToast(`Subscription added: ${p.name}, every ${weeks} weeks (15% off)`);
    cartBtn.classList.remove('bump'); void cartBtn.offsetWidth; cartBtn.classList.add('bump');
  });

  /* ---------- Newsletter ---------- */
  const newsForm = $('#newsForm');
  const newsMsg = $('#newsMsg');
  newsForm.addEventListener('submit', e => {
    e.preventDefault();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test($('#newsEmail').value.trim());
    newsForm.classList.toggle('invalid', !ok);
    newsMsg.classList.toggle('error', !ok);
    newsMsg.textContent = ok ? 'Welcome to the family! Your first nutrition guide is on its way.' : 'Please enter a valid email address.';
    if (ok) newsForm.reset();
  });

  /* ---------- Footer year ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  renderCart();
})();
