// ===== Data Menu (frontend-only) =====
const menuItems = [
  {
    id: 1,
    name: 'Ayam Goreng Abah',
    price: 10000,
    description: 'Ayam goreng kampung bumbu rahasia, krispi di luar, juicy di dalam.',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSNiee3IaZMutuXLYcasKZIip33s9D4yFVAL61OeQUpcg&s',
    barcode: 'AYAM01',
    ingredients: { ayam: 0.15, tepung: 0.03, minyak: 0.02, sambal: 0.01 },
  },
  {
    id: 2,
    name: 'Usus Tusuk',
    price: 4000,
    description: 'Pecinta usus harus membeli! Gurih dan renyah.',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS1nOANcAc9mLopLHcZn7TTYCv3Fj5Hs0LriU0wm_jp_KfDC3n-tLowwfM&s=10',
    barcode: 'USUS02',
    ingredients: { usus: 0.18, bumbu: 0.02, minyak: 0.015, sambal: 0.008 },
  },
  {
    id: 3,
    name: 'Cumi Bakar',
    price: 18000,
    description: 'Seafood fresh yang langsung dibeli dari nelayan.',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQN17NptG0WqQN48paSsk0oDVLef4_S-oSQsQWcNxJ8J6BiPDZHCTOMQF4&s=10',
    barcode: 'CUMI03',
    ingredients: { cumi: 0.2, bumbu: 0.03, minyak: 0.02, sambal: 0.012 },
  },
  {
    id: 4,
    name: 'Babat',
    price: 20000,
    description: 'Babat gurih dengan bumbu khas.',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTY9zQKihhvbr5FNDcGlsvJftCyocLrFzuXMpebLxvNhmACr47K_VPoueJFG89d425EbFexZ6JwrFyYmCo87CNz2FUqPxEyph2mxkvWg&s=10',
    barcode: 'BABAT04',
    ingredients: { babat: 0.2, bumbu: 0.03, minyak: 0.02, sambal: 0.012 },
  },
  {
    id: 5,
    name: 'Makanan Penutup',
    price: 10000,
    description: 'Bisa berupa desert dan buah buahan',
    image: 'https://encrypted-tb0.gstatic.com/images?q=tbn:ANd9GcKwvjb9epK4RjMILFPLD5otGfquw2DUG3scZlu9rRf5Q&s=10',
    barcode: 'PENUTUP05',
    ingredients: { buah: 0.25, saus: 0.03, minyak: 0.0, sambal: 0.0 },
  }
];

// ===== Varian: size + topping =====
const sizes = [
  { key: 'Reguler', label: 'Reguler', deltaPrice: 0, sizeMultiplier: 1 },
  { key: 'Besar', label: 'Besar', deltaPrice: 2500, sizeMultiplier: 1.3 }
];

// Saat ini topping dipilih 1 
const toppings = [
  { key: 'Normal', label: 'Normal', deltaPrice: 0, toppingMultiplier: 1, extraSambal: 0 },
  { key: 'SambalExtra', label: 'Sambal Extra', deltaPrice: 2000, toppingMultiplier: 1.4, extraSambal: 0.01 },
  { key: 'LalapanExtra', label: 'Lalapan Extra', deltaPrice: 1500, toppingMultiplier: 1.2, extraSambal: 0.005 }
];

function computeVariantKey(baseId, sizeKey, toppingKey) {
  return `${baseId}|${sizeKey}|${toppingKey}`;
}

function parseVariantKey(variantKey) {
  const [baseIdStr, sizeKey, toppingKey] = variantKey.split('|');
  return {
    baseId: Number(baseIdStr),
    sizeKey,
    toppingKey: toppingKey || 'Normal'
  };
}

function getSizeDef(sizeKey) {
  return sizes.find((s) => s.key === sizeKey) || sizes[0];
}

function getToppingDef(toppingKey) {
  return toppings.find((t) => t.key === toppingKey) || toppings[0];
}

function computeUnitPrice(basePrice, sizeKey, toppingKey) {
  const sizeDef = getSizeDef(sizeKey);
  const toppingDef = getToppingDef(toppingKey);
  return basePrice + sizeDef.deltaPrice + toppingDef.deltaPrice;
}

// ===== Rating (per menu) =====
const ratingStorageKey = 'menu_ratings_v1'; // { [menuId]: {sum, count} }

function loadRatings() {
  try {
    return JSON.parse(localStorage.getItem(ratingStorageKey)) || {};
  } catch {
    return {};
  }
}

function saveRatings(r) {
  localStorage.setItem(ratingStorageKey, JSON.stringify(r));
}

function getRatingSummary(menuId) {
  const r = loadRatings();
  const item = r[menuId] || { sum: 0, count: 0 };
  const avg = item.count ? item.sum / item.count : 0;
  return { avg, count: item.count };
}

function submitMenuRating(menuId, stars) {
  const ratingMap = loadRatings();
  const safeStars = Math.max(1, Math.min(5, Number(stars) || 0));
  if (!safeStars) return false;

  if (!ratingMap[menuId]) ratingMap[menuId] = { sum: 0, count: 0 };
  ratingMap[menuId].sum += safeStars;
  ratingMap[menuId].count += 1;
  saveRatings(ratingMap);
  return true;
}

// ===== Stok bahan + auto restock =====
const stockStorageKey = 'menu_stock_v1';
const stockConfig = {
  ayam: { initial: 25, minStock: 4, restockAmount: 10 },
  tepung: { initial: 25, minStock: 8, restockAmount: 25 },
  minyak: { initial: 20, minStock: 7, restockAmount: 15 },
  sambal: { initial: 18, minStock: 6, restockAmount: 18 },

  usus: { initial: 10, minStock: 4, restockAmount: 10 },
  bumbu: { initial: 20, minStock: 8, restockAmount: 20 },
  cumi: { initial: 10, restockAmount: 10 },
  babat: { initial: 10, minStock: 4, restockAmount: 10 },

  buah: { initial: 12, minStock: 4, restockAmount: 12 },
  saus: { initial: 20, minStock: 8, restockAmount: 20 }
};

function loadStock() {
  try {
    const s = JSON.parse(localStorage.getItem(stockStorageKey));
    if (s) return s;
  } catch {}

  const fresh = {};
  for (const k of Object.keys(stockConfig)) fresh[k] = stockConfig[k].initial;
  localStorage.setItem(stockStorageKey, JSON.stringify(fresh));
  return fresh;
}

function saveStock(stock) {
  localStorage.setItem(stockStorageKey, JSON.stringify(stock));
}

function maybeAutoRestock(stock) {
  let changed = false;
  for (const [ingredient, cfg] of Object.entries(stockConfig)) {
    if ((stock[ingredient] ?? 0) < cfg.minStock) {
      stock[ingredient] = (stock[ingredient] ?? 0) + cfg.restockAmount;
      changed = true;
    }
  }
  if (changed) saveStock(stock);
}

function canFulfillCart(cartItems, stock) {
  const needed = {};
  for (const ci of cartItems) {
    const menu = menuItems.find((m) => m.id === ci.baseId);
    if (!menu) continue;

    const { sizeKey, toppingKey } = parseVariantKey(ci.variantKey);
    const sizeDef = getSizeDef(sizeKey);
    const toppingDef = getToppingDef(toppingKey);

    for (const [ing, amountPerUnit] of Object.entries(menu.ingredients || {})) {
      const qty = amountPerUnit * sizeDef.sizeMultiplier * toppingDef.toppingMultiplier * ci.quantity;
      needed[ing] = (needed[ing] || 0) + qty;
    }

    if (toppingDef.extraSambal) {
      needed.sambal = (needed.sambal || 0) + toppingDef.extraSambal * ci.quantity;
    }
  }

  for (const [ing, qty] of Object.entries(needed)) {
    if ((stock[ing] ?? 0) < qty) return { ok: false, ing };
  }
  return { ok: true, needed };
}

function applyStockDecrementForCart(cartItems) {
  const stock = loadStock();

  // Pastikan stok tidak jadi desimal karena perhitungan ingredient
  // (akan dibulatkan ke 2 angka desimal saat decrement)


  const first = canFulfillCart(cartItems, stock);
  if (!first.ok) {
    maybeAutoRestock(stock);
    const second = canFulfillCart(cartItems, stock);
    if (!second.ok) return { ok: false, reason: `Stok ${first.ing} tidak cukup.` };
  }

  for (const ci of cartItems) {
    const menu = menuItems.find((m) => m.id === ci.baseId);
    if (!menu) continue;

    const { sizeKey, toppingKey } = parseVariantKey(ci.variantKey);
    const sizeDef = getSizeDef(sizeKey);
    const toppingDef = getToppingDef(toppingKey);

    for (const [ing, amountPerUnit] of Object.entries(menu.ingredients || {})) {
    const dec = amountPerUnit * sizeDef.sizeMultiplier * toppingDef.toppingMultiplier * ci.quantity;
      const current = stock[ing] ?? 0;
      // round agar tidak muncul angka desimal aneh di stok
      stock[ing] = Math.round((current - dec) * 100) / 100;
    }

    if (toppingDef.extraSambal) {
      stock.sambal = (stock.sambal ?? 0) - toppingDef.extraSambal * ci.quantity;
    }
  }

  saveStock(stock);
  maybeAutoRestock(stock);
  return { ok: true };
}

// ===== Royalty  =====
const royaltyRate = 0.03;

// ===== Membership ====
const membershipRules = {
  none: { label: 'Non Member', discountRate: 0, pointsPerRp: 1 },
  silver: { label: 'Silver', discountRate: 0.05, pointsPerRp: 1.2 },
  gold: { label: 'Gold', discountRate: 0.08, pointsPerRp: 1.5 }
};

function calcCartTotals(cartItems) {
  const subtotal = cartItems.reduce((sum, ci) => sum + ci.unitPrice * ci.quantity, 0);
  const royalty = subtotal * royaltyRate;

  const membershipLevel = document.getElementById('membership-level')?.value || 'none';
  const membership = membershipRules[membershipLevel] || membershipRules.none;

  const discount = subtotal * membership.discountRate;
  const total = Math.max(0, subtotal + royalty - discount);
  const points = Math.floor(subtotal * (membership.pointsPerRp / 1000));

  return { subtotal, royalty, discount, total, membership, points };
}

// ===== varian =====
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function normalizeCart() {
  if (!Array.isArray(cart) || cart.length === 0) {
    cart = Array.isArray(cart) ? cart : [];
    saveCart();
    return;
  }

  const isOld = cart.some((x) => x && typeof x.id === 'number' && x.variantKey === undefined);
  if (!isOld) return;

  cart = cart.map((x) => {
    const baseId = x.id;
    const sizeKey = 'Reguler';
    const toppingKey = 'Normal';
    const unitPrice = x.price + computeUnitPrice(0, sizeKey, toppingKey); // x.price already base
    const variantKey = computeVariantKey(baseId, sizeKey, toppingKey);
    return { baseId, variantKey, unitPrice, quantity: x.quantity };
  });
  saveCart();
}

// =====  Modal Varian =====
function ensureVariantModal() {
  if (document.getElementById('variant-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'variant-modal';
  modal.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.55);
    display:none; align-items:center; justify-content:center; z-index: 5000;
    padding: 16px;
  `;

  modal.innerHTML = `
    <div style="background:#fff; border-radius:16px; max-width:520px; width:100%; padding:18px; box-shadow:0 18px 60px rgba(0,0,0,0.25);">
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px;">
        <div>
          <h3 id="variant-title" style="margin-bottom:6px;">Pilih varian</h3>
          <div id="variant-baseprice" style="color:#ff6b35; font-weight:700; margin-bottom:10px;">Rp</div>
        </div>
        <button type="button" id="variant-close" style="border:none; background:#eee; border-radius:10px; padding:8px 12px; cursor:pointer;">✕</button>
      </div>

      <div style="display:grid; grid-template-columns:1fr; gap:12px; margin-top:10px;">
        <div>
          <div style="font-weight:600; margin-bottom:6px;">Ukuran</div>
          <div id="variant-size" style="display:flex; gap:10px; flex-wrap:wrap;"></div>
        </div>

        <div>
          <div style="font-weight:600; margin-bottom:6px;">Topping</div>
          <div id="variant-topping" style="display:flex; gap:10px; flex-wrap:wrap;"></div>
        </div>

        <div style="padding:12px; border:1px solid #eee; border-radius:12px; background:#fafafa;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="color:#666;">Harga unit</div>
            <div id="variant-finalprice" style="color:#ff6b35; font-weight:800; font-size:1.2rem;">Rp 0</div>
          </div>
        </div>

        <button type="button" id="variant-add" class="checkout-btn" style="width:100%;">Tambah ke keranjang</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) hideVariantModal();
  });

  document.getElementById('variant-close').addEventListener('click', hideVariantModal);
}

let variantState = {
  baseId: null,
  selectedSizeKey: 'Reguler',
  selectedToppingKey: 'Normal'
};

function showVariantModal(baseId) {
  ensureVariantModal();
  const menu = menuItems.find((m) => m.id === baseId);
  if (!menu) return;

  variantState = { baseId, selectedSizeKey: 'Reguler', selectedToppingKey: 'Normal' };

  const title = document.getElementById('variant-title');
  const baseprice = document.getElementById('variant-baseprice');
  const sizeEl = document.getElementById('variant-size');
  const toppingEl = document.getElementById('variant-topping');
  const finalPriceEl = document.getElementById('variant-finalprice');
  const addBtn = document.getElementById('variant-add');

  title.textContent = menu.name;
  baseprice.textContent = `Rp ${formatPrice(menu.price)} (dasar)`;

  sizeEl.innerHTML = sizes
    .map(
      (s) => `
      <button type="button" data-key="${s.key}" style="flex:1; min-width:140px; border:2px solid #eee; background:#fff; padding:10px; border-radius:12px; cursor:pointer; font-weight:700;" class="variant-opt ${s.key === variantState.selectedSizeKey ? 'active' : ''}">
        ${s.label} ${s.deltaPrice ? `(+Rp ${formatPrice(s.deltaPrice)})` : ''}
      </button>
    `
    )
    .join('');

  toppingEl.innerHTML = toppings
    .map(
      (t) => `
      <button type="button" data-key="${t.key}" style="flex:1; min-width:140px; border:2px solid #eee; background:#fff; padding:10px; border-radius:12px; cursor:pointer; font-weight:700;" class="variant-opt ${t.key === variantState.selectedToppingKey ? 'active' : ''}">
        ${t.label} ${t.deltaPrice ? `(+Rp ${formatPrice(t.deltaPrice)})` : ''}
      </button>
    `
    )
    .join('');

  finalPriceEl.textContent = `Rp ${formatPrice(computeUnitPrice(menu.price, variantState.selectedSizeKey, variantState.selectedToppingKey))}`;

  const applyActive = () => {
    const sizeButtons = sizeEl.querySelectorAll('button');
    const toppingButtons = toppingEl.querySelectorAll('button');

    sizeButtons.forEach((b) => {
      const k = b.getAttribute('data-key');
      const active = k === variantState.selectedSizeKey;
      b.style.borderColor = active ? '#ff6b35' : '#eee';
      b.style.background = active ? '#fff4ef' : '#fff';
    });

    toppingButtons.forEach((b) => {
      const k = b.getAttribute('data-key');
      const active = k === variantState.selectedToppingKey;
      b.style.borderColor = active ? '#ff6b35' : '#eee';
      b.style.background = active ? '#fff4ef' : '#fff';
    });
  };

  applyActive();

  sizeEl.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      variantState.selectedSizeKey = btn.getAttribute('data-key');
      applyActive();
      finalPriceEl.textContent = `Rp ${formatPrice(computeUnitPrice(menu.price, variantState.selectedSizeKey, variantState.selectedToppingKey))}`;
    });
  });

  toppingEl.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      variantState.selectedToppingKey = btn.getAttribute('data-key');
      applyActive();
      finalPriceEl.textContent = `Rp ${formatPrice(computeUnitPrice(menu.price, variantState.selectedSizeKey, variantState.selectedToppingKey))}`;
    });
  });

  addBtn.onclick = () => {
    const unitPrice = computeUnitPrice(menu.price, variantState.selectedSizeKey, variantState.selectedToppingKey);
    const variantKey = computeVariantKey(menu.id, variantState.selectedSizeKey, variantState.selectedToppingKey);
    addToCartVariant({ baseId: menu.id, variantKey, unitPrice });
    hideVariantModal();
  };

  document.getElementById('variant-modal').style.display = 'flex';
}

function hideVariantModal() {
  const modal = document.getElementById('variant-modal');
  if (modal) modal.style.display = 'none';
}

// ===== Menu Render =====
function renderMenu() {
  const menuGrid = document.getElementById('menu-grid');
  if (!menuGrid) return;

  const stock = loadStock();

  // cek per item: stok utama cukup untuk minimal 1 porsi (Reguler + Normal)
  const isMenuSoldOut = (item) => {
    const sizeDef = getSizeDef('Reguler');
    const toppingDef = getToppingDef('Normal');
    const needed = {};

    for (const [ing, amountPerUnit] of Object.entries(item.ingredients || {})) {
      const qty = amountPerUnit * sizeDef.sizeMultiplier * toppingDef.toppingMultiplier;
      needed[ing] = (needed[ing] || 0) + qty;
    }

    if (toppingDef.extraSambal) {
      needed.sambal = (needed.sambal || 0) + toppingDef.extraSambal;
    }

    for (const [ing, qty] of Object.entries(needed)) {
      if ((stock[ing] ?? 0) < qty) return true;
    }
    return false;
  };

  menuGrid.innerHTML = menuItems
    .map((item) => {
      const r = getRatingSummary(item.id);
      const ratingText = r.count ? `★ ${r.avg.toFixed(1)} (${r.count})` : 'Belum ada rating';

      const soldOut = isMenuSoldOut(item);

      return `
      <div class="menu-item" data-id="${item.id}" style="${soldOut ? 'opacity:0.6; filter:grayscale(0.3);' : ''}">
        <img src="${item.image}" alt="${item.name}">
        <div class="menu-item-content">
          <h3>${item.name}</h3>
          <p>${item.description}</p>
          <div style="display:flex; gap:10px; align-items:center; justify-content:space-between;">
            <div class="menu-price">Rp ${formatPrice(item.price)}</div>
            <div style="font-size:0.95rem; color:#ff6b35; font-weight:700;">${ratingText}</div>
          </div>
          ${soldOut ? `<div style="margin-top:0.75rem; color:#e74c3c; font-weight:800; text-align:center;">Sedang habis</div>` : ''}
          <button class="add-to-cart" type="button" ${soldOut ? 'disabled style="background:#ccc; cursor:not-allowed;"' : 'onclick="showVariantModal(' + item.id + ')"'}>
            <i class="fas fa-plus"></i> ${soldOut ? 'Tambah' : 'Tambah'}
          </button>
        </div>
      </div>
    `;
    })
    .join('');
}

// ===== Cart operations =====
function addToCartVariant({ baseId, variantKey, unitPrice }) {
  const existing = cart.find((x) => x.baseId === baseId && x.variantKey === variantKey);
  if (existing) existing.quantity += 1;
  else cart.push({ baseId, variantKey, unitPrice, quantity: 1 });

  saveCart();
  renderCart();
  updateCartCount();
  showNotification(`Ditambahkan ke keranjang!`);
}

function removeFromCart(variantKey) {
  cart = cart.filter((x) => x.variantKey !== variantKey);
  saveCart();
  renderCart();
  updateCartCount();
}

function updateQuantity(variantKey, change) {
  const item = cart.find((x) => x.variantKey === variantKey);
  if (!item) return;

  item.quantity += change;
  if (item.quantity <= 0) removeFromCart(variantKey);
  else {
    saveCart();
    renderCart();
    updateCartCount();
  }
}

function renderCart() {
  const cartItemsEl = document.getElementById('cart-items');
  const totalPriceEl = document.getElementById('total-price');
  const checkoutBtn = document.getElementById('checkout-btn');
  const cartSubnoteEl = document.getElementById('cart-subnote');

  if (!cartItemsEl) return;

  if (!cart.length) {
    cartItemsEl.innerHTML = '<p style="text-align: center; color: #666; font-size: 1.2rem;">Keranjang kosong. <a href="#menu">Pesan sekarang!</a></p>';
    if (totalPriceEl) totalPriceEl.textContent = '0';
    if (checkoutBtn) checkoutBtn.style.display = 'none';
    if (cartSubnoteEl) cartSubnoteEl.textContent = '';
    return;
  }

  cartItemsEl.innerHTML = cart
    .map((ci) => {
      const menu = menuItems.find((m) => m.id === ci.baseId);
      const v = parseVariantKey(ci.variantKey);
      const s = getSizeDef(v.sizeKey);
      const t = getToppingDef(v.toppingKey);

      return `
      <div class="cart-item">
        <img src="${menu?.image || ''}" alt="${menu?.name || ''}">
        <div class="cart-item-info">
          <h4>${menu?.name || ''}</h4>
          <p style="color:#666; font-weight:600;">${s.label} • ${t.label}</p>
          <p>Rp ${formatPrice(ci.unitPrice)} / porsi</p>
        </div>
        <div class="quantity-controls">
          <button class="qty-btn" type="button" onclick="updateQuantity('${ci.variantKey}', -1)">-</button>
          <span class="quantity">${ci.quantity}</span>
          <button class="qty-btn" type="button" onclick="updateQuantity('${ci.variantKey}', 1)">+</button>
        </div>
        <button class="remove-item" type="button" onclick="removeFromCart('${ci.variantKey}')">Hapus</button>
      </div>
    `;
    })
    .join('');

  const total = cart.reduce((sum, x) => sum + x.unitPrice * x.quantity, 0);
  if (totalPriceEl) totalPriceEl.textContent = formatPrice(total);
  if (checkoutBtn) checkoutBtn.style.display = 'block';

  const stock = loadStock();
  // subnote sederhana: stok bahan utama (ayam/usss/cumi/babat/...) terlihat dari item pertama
  const firstMenu = menuItems.find((m) => m.id === cart[0].baseId);
  if (cartSubnoteEl && firstMenu?.ingredients) {
    const mainIng = Object.keys(firstMenu.ingredients)[0];
    cartSubnoteEl.textContent = mainIng ? `Stok ${mainIng}: ${formatStock(stock[mainIng] ?? 0)}` : '';
  }
}

function formatStock(v) {
  return Number(v).toFixed(2).replace(/\.00$/, '');
}

function updateCartCount() {
  const countEl = document.getElementById('cart-count');
  if (!countEl) return;
  const count = cart.reduce((sum, x) => sum + x.quantity, 0);
  countEl.textContent = count;
}

function goToPayment() {
  if (!cart.length) return;

  const totals = calcCartTotals(cart);
  const formTotal = document.getElementById('form-total');
  if (formTotal) formTotal.textContent = formatPrice(totals.total);

  const royaltyDetail = document.getElementById('royalty-detail');
  if (royaltyDetail) {
    royaltyDetail.innerHTML = `Royalty (${(royaltyRate * 100).toFixed(0)}%): Rp ${formatPrice(totals.royalty)}`;
  }

  const membershipDetail = document.getElementById('membership-detail');
  if (membershipDetail) {
    membershipDetail.innerHTML = `Diskon: Rp ${formatPrice(totals.discount)} • Estimasi poin: +${totals.points} pts`;
  }

  const membershipInfo = document.getElementById('membership-poin-info');
  if (membershipInfo) {
    membershipInfo.textContent = `Benefit: ${totals.membership.label} (+${totals.points} poin estimasi) `;
  }

  const cartSection = document.querySelector('#cart');
  const paymentSection = document.getElementById('pembayaran');
  if (cartSection) cartSection.style.display = 'none';
  if (paymentSection) {
    paymentSection.style.display = 'block';
    paymentSection.scrollIntoView({ behavior: 'smooth' });
  }
}

// ===== Rating =====
function showRatingPageAfterPayment() {
  const ratingSection = document.getElementById('rating');
  if (!ratingSection) return;
  ratingSection.style.display = 'block';
  ratingSection.scrollIntoView({ behavior: 'smooth' });

  const ratingGrid = document.getElementById('rating-grid');
  if (!ratingGrid) return;

  ratingGrid.innerHTML = menuItems
    .map((m) => {
      const r = getRatingSummary(m.id);
      const existingStars = '';

      return `
        <div style="border:1px solid #eee; border-radius:14px; padding:14px; background:#fff;">
          <div style="display:flex; gap:12px; align-items:center;">
            <img src="${m.image}" alt="${m.name}" style="width:52px; height:52px; border-radius:12px; object-fit:cover;" />
            <div>
              <div style="font-weight:800; margin-bottom:2px;">${m.name}</div>
              <div style="color:#666; font-size:0.95rem;">Saat ini: ${r.count ? `★ ${r.avg.toFixed(1)} (${r.count})` : 'Belum ada rating'}</div>
            </div>
          </div>
          <div style="margin-top:12px;">
            <div style="font-weight:700; color:#333; margin-bottom:8px;">Beri rating</div>
            <select id="rating-${m.id}" style="width:100%; padding:10px; border-radius:12px; border:2px solid #e9ecef;">
              <option value="">Pilih...</option>
              <option value="5">5 - Mantap</option>
              <option value="4">4 - Bagus</option>
              <option value="3">3 - Cukup</option>
              <option value="2">2 - Kurang</option>
              <option value="1">1 - Mengecewakan</option>
            </select>
          </div>
        </div>
      `;
    })
    .join('');
}

function submitRatings() {
  for (const m of menuItems) {
    const sel = document.getElementById(`rating-${m.id}`);
    if (!sel) continue;
    if (sel.value) submitMenuRating(m.id, sel.value);
  }

  showNotification('Terima kasih! Rating tersimpan.');
  const ratingSection = document.getElementById('rating');
  if (ratingSection) ratingSection.style.display = 'none';
  renderMenu();
}



// ===== Payment =====
function handlePayment(e) {
  e.preventDefault();

  const name = document.getElementById('customer-name')?.value?.trim();
  const phone = document.getElementById('customer-phone')?.value?.trim();
  const address = document.getElementById('customer-address')?.value?.trim();

  const paymentMethodEls = document.querySelectorAll('#payment-method');
  const method = paymentMethodEls?.[0]?.value;

  if (!name || !phone || !address || !method) {
    alert('Mohon lengkapi semua field!');
    return;
  }

  // Simulate processing
  setTimeout(() => {
    const stockResult = applyStockDecrementForCart(cart);
    if (!stockResult.ok) {
      alert(stockResult.reason || 'Gagal memproses stok.');
      return;
    }

    const paymentSection = document.getElementById('pembayaran');
    const orderSection = document.querySelector('.order-process');
    const confirmation = document.getElementById('confirmation');
    const cartSection = document.querySelector('#cart');

    if (paymentSection) paymentSection.style.display = 'none';
    if (orderSection) orderSection.style.display = 'none';
    if (confirmation) confirmation.style.display = 'block';

    if (confirmation && cartSection) {
      confirmation.scrollIntoView({ behavior: 'smooth' });
    }

    // Simpan Rating dan Stok
    cart = [];
    localStorage.removeItem('cart');
    updateCartCount();
    renderCart();

    //  rating 
    showRatingPageAfterPayment();
  }, 1200);
}

// Save cart to localStorage
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Format price
function formatPrice(price) {
  return new Intl.NumberFormat('id-ID').format(price);
}

// Notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: #28a745;
    color: white;
    padding: 1rem 2rem;
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    z-index: 2000;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
`;
document.head.appendChild(style);

// ===== Boot =====
document.addEventListener('DOMContentLoaded', function () {
  normalizeCart();

  renderMenu();
  renderCart();
  updateCartCount();

  // Navbar mobile
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      if (navMenu) navMenu.classList.toggle('active');
    });
  }

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
      if (navMenu) navMenu.classList.remove('active');
    });
  });

  // Checkout
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) checkoutBtn.addEventListener('click', goToPayment);

  // Payment form
  const paymentForm = document.getElementById('payment-form');
  if (paymentForm) paymentForm.addEventListener('submit', handlePayment);

  // QRIS toggle (tetap dari versi lama)
  const paymentMethodEls = document.querySelectorAll('#payment-method');
  if (paymentMethodEls && paymentMethodEls.length > 0) {
    const paymentMethodEl = paymentMethodEls[0];

    const updateQrisVisibility = () => {
      const qrisContainer = document.getElementById('qris-container');
      if (!qrisContainer) return;
      const isQris = paymentMethodEl.value === 'transfer';
      qrisContainer.style.display = isQris ? 'block' : 'none';
    };

    paymentMethodEl.addEventListener('change', updateQrisVisibility);
    updateQrisVisibility();
  }

  // membership change 
  const membershipEl = document.getElementById('membership-level');
  if (membershipEl) {
    membershipEl.addEventListener('change', () => {
      const paymentSection = document.getElementById('pembayaran');
      if (paymentSection && paymentSection.style.display === 'block') {
        const totals = calcCartTotals(cart);
        const formTotal = document.getElementById('form-total');
        if (formTotal) formTotal.textContent = formatPrice(totals.total);
        const royaltyDetail = document.getElementById('royalty-detail');
        if (royaltyDetail) royaltyDetail.innerHTML = `Royalty (${(royaltyRate * 100).toFixed(0)}%): Rp ${formatPrice(totals.royalty)}`;
        const membershipDetail = document.getElementById('membership-detail');
        if (membershipDetail) membershipDetail.innerHTML = `Diskon: Rp ${formatPrice(totals.discount)} • Estimasi poin: +${totals.points} pts`;
      }
    });
  }
});

// Expose functions to inline HTML onclick
window.showVariantModal = showVariantModal;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.goToPayment = goToPayment;
window.handlePayment = handlePayment;
// handleBarcodeLookup sudah dihapus (fitur scan barcode dinonaktifkan)
window.submitRatings = submitRatings;

