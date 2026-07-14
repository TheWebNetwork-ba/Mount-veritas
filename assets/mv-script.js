/* ===== THE PRODUCT ROW — connected Shopify products =====
   Each card is its own product (rendered by the section).
   Arrows scroll the row; native swipe works on touch.   */
(function(){
  var track   = document.getElementById('track');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  if (!track || !prevBtn || !nextBtn) return;
  function step(){
    var card = track.querySelector('.card');
    if (!card) return track.clientWidth * 0.8;
    var gap = parseInt(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '24', 10) || 24;
    return card.getBoundingClientRect().width + gap;
  }
  prevBtn.addEventListener('click', function(){ track.scrollBy({ left: -step(), behavior: 'smooth' }); });
  nextBtn.addEventListener('click', function(){ track.scrollBy({ left:  step(), behavior: 'smooth' }); });
})();

/* ===== THE SBO WALL — hero background =====
   Fills the hero with staggered rows of the brand mantra,
   matching the TWN | MV Logos pattern page.              */
(function(){
  var wall = document.getElementById('patternWall');
  if (!wall) return;
  var phrase = 'SEE IT.\u2002BELIEVE IT.\u2002OBTAIN IT.\u2002';

  function build(){
    wall.innerHTML = '';
    var rowH = 34; /* matches line-height 2.4 at 14px */
    var rows = Math.ceil(window.innerHeight / rowH) + 2;
    var reps = Math.ceil(window.innerWidth / 160) + 6;
    for (var i = 0; i < rows; i++){
      var span = document.createElement('span');
      span.textContent = phrase.repeat(reps);
      /* stagger each row like the brand PDF */
      span.style.marginLeft = -((i % 4) * 90 + 20) + 'px';
      wall.appendChild(span);
    }
  }
  build();
  var t; window.addEventListener('resize', function(){ clearTimeout(t); t = setTimeout(build, 200); });
})();

/* ===== THE MIRROR — scroll engine =====
   Maps scroll progress through the tall .mirror section to
   lighting each line in sequence.                          */
(function(){
  var section = document.getElementById('mirror');
  if (!section) return;
  var lines = section.querySelectorAll('[data-line]');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  function onScroll(){
    var rect = section.getBoundingClientRect();
    var total = section.offsetHeight - window.innerHeight;
    var progress = Math.min(1, Math.max(0, -rect.top / total));

    /* lines light up across the first ~85% of the scroll */
    var per = 0.8 / lines.length;
    lines.forEach(function(line, i){
      line.classList.toggle('lit', progress > per * (i + 0.12));
    });
  }

  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();
})();


/* ===== THE FAQ — glass accordion =====
   Smoothly expands the answer to its exact height.       */
(function(){
  var items = document.querySelectorAll('.faq-item');
  if (!items.length) return;
  items.forEach(function(item){
    var q = item.querySelector('.faq-q');
    var a = item.querySelector('.faq-a');
    if (!q || !a) return;
    q.addEventListener('click', function(){
      var open = item.classList.toggle('open');
      q.setAttribute('aria-expanded', open ? 'true' : 'false');
      a.style.maxHeight = open ? a.scrollHeight + 'px' : '0px';
    });
  });
})();

/* ===== SIDE CART (drawer) ===== */
(function(){
  var drawer  = document.getElementById('cartDrawer');
  var overlay = document.getElementById('cartOverlay');
  var toggle  = document.getElementById('cartToggle');
  var closeB  = document.getElementById('cartClose');
  var itemsEl = document.getElementById('cartItems');
  var subEl   = document.getElementById('cartSubtotal');
  var badge   = document.getElementById('cartCount');
  if (!drawer || !itemsEl) return;

  function money(c){ return '$' + (c/100).toFixed(2); }
  function sized(u){ if(!u) return ''; return u + (u.indexOf('?')>-1?'&':'?') + 'width=200'; }

  function openCart(){ drawer.classList.add('open'); overlay.classList.add('open'); drawer.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }
  function closeCart(){ drawer.classList.remove('open'); overlay.classList.remove('open'); drawer.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }

  function render(cart){
    if (badge){ badge.textContent = cart.item_count; badge.hidden = cart.item_count === 0; }
    if (subEl) subEl.textContent = money(cart.total_price);
    if (!cart.items || !cart.items.length){
      itemsEl.innerHTML = '';
      drawer.classList.add('is-empty');
      return;
    }
    drawer.classList.remove('is-empty');
    var html = '';
    cart.items.forEach(function(it, i){
      var img = it.image ? '<img src="'+sized(it.image)+'" alt="" loading="lazy">' : '';
      var variant = (it.variant_title && it.variant_title !== 'Default Title')
        ? '<span class="cart-line-variant">'+it.variant_title+'</span>' : '';
      html +=
        '<div class="cart-line" data-line="'+(i+1)+'">'+
          '<div class="cart-line-img">'+img+'</div>'+
          '<div class="cart-line-info">'+
            '<a class="cart-line-title" href="'+it.url+'">'+it.product_title+'</a>'+
            variant+
            '<div class="cart-qty">'+
              '<button type="button" class="cart-q" data-act="dec" aria-label="Decrease">&#8722;</button>'+
              '<span>'+it.quantity+'</span>'+
              '<button type="button" class="cart-q" data-act="inc" aria-label="Increase">+</button>'+
              '<button type="button" class="cart-remove" data-act="remove">Remove</button>'+
            '</div>'+
          '</div>'+
          '<span class="cart-line-price">'+money(it.final_line_price)+'</span>'+
        '</div>';
    });
    itemsEl.innerHTML = html;
  }

  function renderUpsells(cart){
    var ids = (cart.items || []).map(function(i){ return i.product_id; });
    ['cuEa','cuPp'].forEach(function(id){
      var el = document.getElementById(id);
      if (!el) return;
      var pid = parseInt(el.getAttribute('data-pid'), 10);
      el.style.display = (pid && ids.indexOf(pid) === -1) ? '' : 'none';
    });
  }

  function fetchCart(cb){
    fetch('/cart.js', { headers:{ 'Accept':'application/json' } })
      .then(function(r){ return r.json(); })
      .then(function(c){ render(c); renderUpsells(c); if (cb) cb(c); })
      .catch(function(){});
  }

  function change(line, qty){
    fetch('/cart/change.js', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Accept':'application/json' },
      body: JSON.stringify({ line:line, quantity:qty })
    }).then(function(r){ return r.json(); }).then(function(c){ render(c); renderUpsells(c); }).catch(function(){});
  }

  if (toggle) toggle.addEventListener('click', function(e){ e.preventDefault(); openCart(); });
  if (closeB) closeB.addEventListener('click', closeCart);
  if (overlay) overlay.addEventListener('click', closeCart);
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeCart(); });

  itemsEl.addEventListener('click', function(e){
    var btn = e.target.closest('[data-act]'); if (!btn) return;
    var row = e.target.closest('.cart-line'); if (!row) return;
    var line = parseInt(row.getAttribute('data-line'), 10);
    var cur = parseInt(row.querySelector('.cart-qty span').textContent, 10) || 0;
    var act = btn.getAttribute('data-act');
    if (act === 'inc') change(line, cur + 1);
    else if (act === 'dec') change(line, Math.max(0, cur - 1));
    else if (act === 'remove') change(line, 0);
  });

  /* When product pages exist later, add-to-cart opens the drawer automatically */
  document.addEventListener('submit', function(e){
    var form = e.target;
    if (!form.matches || !form.matches('form[action*="/cart/add"]')) return;
    e.preventDefault();
    fetch('/cart/add.js', { method:'POST', headers:{ 'Accept':'application/json' }, body:new FormData(form) })
      .then(function(r){ return r.json(); })
      .then(function(){ fetchCart(openCart); })
      .catch(function(){});
  });

  window._mvRender = render;
  window._mvUpsells = renderUpsells;
  fetchCart();
})();

/* ===== PRODUCT PAGE (shell) ===== */
(function(){
  var qty = document.getElementById('pdpQty');
  if (qty){
    document.querySelectorAll('.pdp-qd').forEach(function(b){
      b.addEventListener('click', function(){
        var v = parseInt(qty.value,10) || 1;
        v = b.getAttribute('data-act') === 'inc' ? v+1 : Math.max(1, v-1);
        qty.value = v;
      });
    });
  }
  var sel = document.getElementById('pdpVariant'), price = document.getElementById('pdpPrice'), add = document.getElementById('pdpAdd');
  if (sel && price){
    sel.addEventListener('change', function(){
      var opt = sel.options[sel.selectedIndex];
      if (opt.getAttribute('data-price')) price.textContent = opt.getAttribute('data-price');
      if (add){ if (opt.disabled){ add.disabled = true; add.textContent = 'Sold Out'; } else { add.disabled = false; add.textContent = 'Add to Cart'; } }
    });
  }
  var mainImg = document.getElementById('pdpImg');
  if (mainImg){
    document.querySelectorAll('.pdp-thumb').forEach(function(t){
      t.addEventListener('click', function(){
        if (t.getAttribute('data-img')) mainImg.src = t.getAttribute('data-img');
        document.querySelectorAll('.pdp-thumb').forEach(function(x){ x.classList.remove('is-active'); });
        t.classList.add('is-active');
      });
    });
  }
})();

/* ===== PDP ACCORDION (Details / Shipping / Size & Fit) — delegated ===== */
(function(){
  var wrap = document.querySelector('.pdp-acc');
  if (!wrap) return;
  function setOpen(item, open){
    var q = item.querySelector('.pdp-acc-q');
    var a = item.querySelector('.pdp-acc-a');
    if (!a) return;
    item.classList.toggle('open', open);
    if (q) q.setAttribute('aria-expanded', open ? 'true' : 'false');
    a.style.maxHeight = open ? a.scrollHeight + 'px' : '0px';
  }
  wrap.addEventListener('click', function(e){
    var q = e.target.closest('.pdp-acc-q');
    if (!q || !wrap.contains(q)) return;
    var item = q.closest('.pdp-acc-item');
    if (!item) return;
    setOpen(item, !item.classList.contains('open'));
  });
  var first = wrap.querySelector('.pdp-acc-item');
  if (first) setOpen(first, true);
})();

/* ===== PDP variant boxes (Color / Size -> real variants) ===== */
(function(){
  var dataEl  = document.getElementById('pdpVariantData');
  var idInput = document.getElementById('pdpVariantId');
  if (!dataEl || !idInput) return;
  var variants = [];
  try { variants = JSON.parse(dataEl.textContent); } catch(e){ return; }

  var priceEl = document.getElementById('pdpPrice');
  var addBtn  = document.getElementById('pdpAdd');
  var mainImg = document.getElementById('pdpImg');
  var boxes   = document.querySelectorAll('.pdp-optbox');
  if (!boxes.length) return;

  function money(c){ return '$' + (c/100).toFixed(2); }

  function chosen(){
    var vals = [];
    boxes.forEach(function(box){
      var sel = box.querySelector('.pdp-chip.is-sel');
      vals.push(sel ? sel.getAttribute('data-val') : null);
    });
    return vals;
  }

  function match(){
    var vals = chosen();
    for (var i=0;i<variants.length;i++){
      var v = variants[i], ok = true;
      for (var j=0;j<vals.length;j++){ if (v.options[j] !== vals[j]){ ok = false; break; } }
      if (ok) return v;
    }
    return null;
  }

  function update(){
    var v = match();
    if (!v) return;
    idInput.value = v.id;
    if (priceEl) priceEl.textContent = money(v.price);
    if (addBtn){
      addBtn.disabled = !v.available;
      addBtn.textContent = v.available ? 'Add to Cart' : 'Sold Out';
    }
    if (mainImg && v.featured_image && v.featured_image.src){ mainImg.src = v.featured_image.src; }
  }

  boxes.forEach(function(box){
    box.addEventListener('click', function(e){
      var chip = e.target.closest('.pdp-chip'); if (!chip) return;
      box.querySelectorAll('.pdp-chip').forEach(function(c){ c.classList.remove('is-sel'); });
      chip.classList.add('is-sel');
      update();
    });
  });

  /* guarantee a valid starting selection */
  if (!match()){
    var first = null;
    for (var i=0;i<variants.length;i++){ if (variants[i].available){ first = variants[i]; break; } }
    if (!first) first = variants[0];
    if (first){
      boxes.forEach(function(box, idx){
        var want = first.options[idx];
        box.querySelectorAll('.pdp-chip').forEach(function(c){
          c.classList.toggle('is-sel', c.getAttribute('data-val') === want);
        });
      });
    }
  }
  update();
})();

/* ===== SIZE CHART slide-out ===== */
(function(){
  var d = document.getElementById('sizeDrawer');
  var ov = document.getElementById('sizeOverlay');
  var openBs = document.querySelectorAll('.js-sizechart-open');
  var closeB = document.getElementById('sizeChartClose');
  if (!d) return;
  function open(){ d.classList.add('open'); if (ov) ov.classList.add('open'); document.body.style.overflow='hidden'; }
  function close(){ d.classList.remove('open'); if (ov) ov.classList.remove('open'); document.body.style.overflow=''; }
  openBs.forEach(function(b){ b.addEventListener('click', open); });
  if (closeB) closeB.addEventListener('click', close);
  if (ov) ov.addEventListener('click', close);
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') close(); });
})();

/* ===== PDP image zoom (zooms the image, not the page) ===== */
(function(){
  var img = document.getElementById('pdpImg');
  var zoom = document.getElementById('pdpZoom');
  var zimg = document.getElementById('pdpZoomImg');
  var zclose = document.getElementById('pdpZoomClose');
  if (!img || !zoom || !zimg) return;
  function open(){ zimg.src = img.currentSrc || img.src; zoom.classList.add('open'); zoom.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }
  function close(){ zoom.classList.remove('open'); zimg.classList.remove('zoomed'); zoom.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
  img.addEventListener('click', open);
  zimg.addEventListener('click', function(e){ e.stopPropagation(); zimg.classList.toggle('zoomed'); });
  if (zclose) zclose.addEventListener('click', close);
  zoom.addEventListener('click', close);
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') close(); });
})();


/* ===== SEARCH OVERLAY (predictive Shopify product search) ===== */
(function(){
  var toggle  = document.getElementById('searchToggle');
  var overlay = document.getElementById('searchOverlay');
  var closeB  = document.getElementById('searchClose');
  var input   = document.getElementById('searchInput');
  var results = document.getElementById('searchResults');
  if (!toggle || !overlay || !input || !results) return;

  function open(){ overlay.classList.add('open'); overlay.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; setTimeout(function(){ input.focus(); }, 80); }
  function close(){ overlay.classList.remove('open'); overlay.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }

  toggle.addEventListener('click', function(e){ e.preventDefault(); open(); });
  if (closeB) closeB.addEventListener('click', close);
  overlay.addEventListener('click', function(e){ if (e.target === overlay) close(); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') close(); });

  var t;
  input.addEventListener('input', function(){
    var q = input.value.trim();
    clearTimeout(t);
    if (q.length < 2){ results.innerHTML = ''; return; }
    t = setTimeout(function(){ run(q); }, 220);
  });

  function esc(x){ return (x||'').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function run(q){
    var url = '/search/suggest.json?q=' + encodeURIComponent(q) +
              '&resources[type]=product&resources[limit]=8&resources[options][unavailable_products]=last';
    fetch(url, { headers:{ 'Accept':'application/json' } })
      .then(function(r){ return r.json(); })
      .then(function(data){
        var products = (data.resources && data.resources.results && data.resources.results.products) || [];
        if (!products.length){ results.innerHTML = '<p class="search-empty">No matches for \u201c' + esc(q) + '\u201d.</p>'; return; }
        var html = '';
        products.forEach(function(p){
          var img = (p.featured_image && p.featured_image.url) ? p.featured_image.url : (p.image || '');
          var imgHtml = img ? '<span class="search-result-img"><img src="'+img+'" alt="" loading="lazy"></span>' : '<span class="search-result-img"></span>';
          html += '<a class="search-result" href="'+p.url+'">'+imgHtml+
                    '<span class="search-result-info"><span class="search-result-title">'+esc(p.title)+'</span></span></a>';
        });
        results.innerHTML = html;
      })
      .catch(function(){ results.innerHTML = '<p class="search-empty">Search is unavailable right now.</p>'; });
  }
})();

/* ===== CART UPSELL — add product from drawer ===== */
function mvCuAdd(btn){
  var id = btn.getAttribute('data-vid');
  btn.disabled = true;
  var orig = btn.textContent;
  btn.textContent = '...';
  fetch('/cart/add.js', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ id: parseInt(id,10), quantity: 1 })
  })
  .then(function(r){ return r.json(); })
  .then(function(){
    fetch('/cart.js',{headers:{'Accept':'application/json'}})
      .then(function(r){ return r.json(); })
      .then(function(c){
        var renderFn = window._mvRender;
        var upsellFn = window._mvUpsells;
        if(renderFn) renderFn(c);
        if(upsellFn) upsellFn(c);
      });
  })
  .catch(function(){ btn.disabled=false; btn.textContent=orig; });
}

/* ===== CART DISCOUNT CODE ===== */
(function(){
  var input    = document.getElementById('cartDiscountInput');
  var btn      = document.getElementById('cartDiscountApply');
  var msg      = document.getElementById('cartDiscountMsg');
  var checkout = document.getElementById('cartCheckoutBtn');

  if (!input || !btn) return;

  function showMsg(text, ok){
    msg.textContent = text;
    msg.className = 'cart-discount-msg ' + (ok ? 'cart-discount-msg--ok' : 'cart-discount-msg--err');
    msg.style.display = 'block';
  }

  function applyCode(){
    var code = input.value.trim().toUpperCase();
    if (!code) return;

    btn.disabled = true;
    btn.textContent = 'Checking';
    if (msg) msg.style.display = 'none';

    // Validate for real: apply to the cart, then read /cart.js back.
    // discount_codes carries an "applicable" flag we can trust.
    fetch('/discount/' + encodeURIComponent(code), { redirect:'follow' })
      .then(function(){ return fetch('/cart.js', { headers:{ 'Accept':'application/json' } }); })
      .then(function(r){ return r.json(); })
      .then(function(cart){
        var codes = cart.discount_codes || [];
        var hit = null;
        for (var i = 0; i < codes.length; i++){
          if ((codes[i].code || '').toUpperCase() === code){ hit = codes[i]; break; }
        }
        if (hit && hit.applicable){
          showMsg('Code applied. It comes off at checkout.', true);
          btn.textContent = 'Applied';
          btn.disabled = true;
          input.readOnly = true;
          input.style.opacity = '.6';
          if (checkout) checkout.setAttribute('href', '/discount/' + encodeURIComponent(code) + '?redirect=%2Fcheckout');
        } else {
          showMsg('That code isn’t valid. Check it and try again.', false);
          btn.textContent = 'Apply';
          btn.disabled = false;
          if (checkout) checkout.setAttribute('href', '/checkout');
        }
      })
      .catch(function(){
        showMsg('Could not verify just now. It will apply at checkout if valid.', false);
        btn.textContent = 'Apply';
        btn.disabled = false;
        if (checkout) checkout.setAttribute('href', '/discount/' + encodeURIComponent(code) + '?redirect=%2Fcheckout');
      });
  }

  btn.addEventListener('click', applyCode);
  input.addEventListener('keydown', function(e){ if (e.key === 'Enter') applyCode(); });

  // Reset if user edits the input after applying
  input.addEventListener('input', function(){
    if (!input.readOnly) return;
    input.readOnly = false;
    input.style.opacity = '1';
    btn.textContent = 'Apply';
    btn.disabled = false;
    msg.style.display = 'none';
    if (checkout) checkout.setAttribute('href', '/checkout');
  });
})();
