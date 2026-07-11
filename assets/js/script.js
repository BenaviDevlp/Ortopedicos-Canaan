/* =========================================================
   ORTOPÉDICOS CANAAN - Lógica del sitio
   ========================================================= */

// ---------- Utilidades ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const money = (n) =>
  "$ " + (Number(n) || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 });

const starString = (rating) => {
  const full = Math.round(rating);
  return "★★★★★☆☆☆☆☆".slice(5 - full, 10 - full);
};

let CART = [];

// ---------- Toast ----------
let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2500);
}

/* =========================================================
   SLIDER HERO
   ========================================================= */
function renderSlides() {
  const wrap = $("#heroSlides");
  wrap.innerHTML = SLIDES.map(
    (s, i) => `
    <div class="slide ${i === 0 ? "active" : ""}" style="background-image:url('${s.image}')">
      <div class="slide-overlay"></div>
      <div class="slide-text">
        <h2>${s.title}</h2>
        <p>${s.text}</p>
        <a href="#productos" class="btn-yellow">Ver productos</a>
      </div>
    </div>`
  ).join("");
}

let slideIndex = 0;
function showSlide(i) {
  const slides = $$(".slide");
  if (!slides.length) return;
  slideIndex = (i + slides.length) % slides.length;
  slides.forEach((s, idx) => s.classList.toggle("active", idx === slideIndex));
}
// Enlaza las flechas y el cambio automático (se llama una sola vez)
function initSliderControls() {
  $("#heroNext").addEventListener("click", () => showSlide(slideIndex + 1));
  $("#heroPrev").addEventListener("click", () => showSlide(slideIndex - 1));
  setInterval(() => showSlide(slideIndex + 1), 6000);
}

/* =========================================================
   CATEGORÍAS
   ========================================================= */
function renderCategories() {
  const grid = $("#catGrid");
  grid.innerHTML = CATEGORIES.map(
    (c) => `
    <div class="cat-card" data-cat="${c.name}">
      <div class="cat-thumb"><i class="${c.icon}"></i></div>
      <span class="cat-name">${c.name}</span>
    </div>`
  ).join("");

  $$(".cat-card").forEach((card) =>
    card.addEventListener("click", () => {
      filterProducts(card.dataset.cat);
      $("#productos").scrollIntoView({ behavior: "smooth" });
    })
  );
}

// Menú desplegable de categorías (encabezado) generado dinámicamente
function renderCatMenu() {
  const wrap = $("#catMenu .container");
  if (!wrap) return;
  wrap.innerHTML =
    `<a href="#" data-cat="all">Todas las categorías</a>` +
    CATEGORIES.map((c) => `<a href="#" data-cat="${c.name}">${c.name}</a>`).join("");

  wrap.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      filterProducts(a.dataset.cat);
      $("#catMenu").classList.remove("open");
      $("#productos").scrollIntoView({ behavior: "smooth" });
    })
  );
}

/* =========================================================
   ANUNCIO / BENEFICIOS / OFERTAS / TESTIMONIOS
   ========================================================= */
function renderAnnounce() {
  $("#announceText").innerHTML = `<i class="fa-solid fa-truck-fast"></i> ${STORE.announce}`;
  const btn = $("#announceCoupon");
  btn.textContent = `Cupón: ${STORE.coupon}`;
  btn.title = STORE.couponText + " (clic para copiar)";
  btn.addEventListener("click", () => {
    navigator.clipboard?.writeText(STORE.coupon);
    toast(`Cupón ${STORE.coupon} copiado · ${STORE.couponText}`);
  });
}

function renderBenefits() {
  $("#benefitsGrid").innerHTML = BENEFITS.map(
    (b) => `
    <div class="benefit">
      <div class="benefit-icon"><i class="${b.icon}"></i></div>
      <div>
        <div class="benefit-title">${b.title}</div>
        <div class="benefit-text">${b.text}</div>
      </div>
    </div>`
  ).join("");
}

function renderOffers() {
  // productos con descuento y en stock
  const offers = PRODUCTS.filter(
    (p) => p.oldPrice && p.oldPrice > p.price && p.stock > 0
  ).slice(0, 4);
  renderProducts(offers, "#offersGrid");
}

function renderTestimonials() {
  $("#testiGrid").innerHTML = TESTIMONIALS.map(
    (t) => `
    <div class="testi-card">
      <div class="stars">${starString(t.stars)}</div>
      <p class="testi-text">"${t.text}"</p>
      <div class="testi-name">${t.name}</div>
    </div>`
  ).join("");
}

/* =========================================================
   TABS (filtros de productos)
   ========================================================= */
function renderTabs() {
  const tabs = $("#tabs");
  const cats = ["all", ...CATEGORIES.map((c) => c.name)];
  tabs.innerHTML = cats
    .map(
      (c) =>
        `<button class="tab ${c === "all" ? "active" : ""}" data-cat="${c}">${
          c === "all" ? "Todos" : c
        }</button>`
    )
    .join("");

  $$(".tab").forEach((tab) =>
    tab.addEventListener("click", () => filterProducts(tab.dataset.cat))
  );
}

function filterProducts(cat, search = "") {
  $$(".tab").forEach((t) => t.classList.toggle("active", t.dataset.cat === cat));

  let list = PRODUCTS;
  if (cat !== "all") list = list.filter((p) => p.category === cat);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
    );
  }
  renderProducts(list);
}

/* =========================================================
   PRODUCTOS (cards)
   ========================================================= */
function renderProducts(list, gridSelector = "#productGrid") {
  const grid = $(gridSelector);
  if (!list.length) {
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#9aa1b0;">No se encontraron productos.</p>`;
    return;
  }

  grid.innerHTML = list
    .map((p) => {
      const hasDiscount = p.oldPrice && p.oldPrice > p.price;
      const discount = hasDiscount
        ? Math.round((1 - p.price / p.oldPrice) * 100)
        : 0;
      const inStock = p.stock > 0;
      const lowStock = inStock && p.stock <= 10;

      const imgContent = p.img
        ? `<img src="${p.img}" alt="${p.name} - ${p.category}" loading="lazy" decoding="async">`
        : `<i class="fa-regular fa-image ph-ic"></i>`;

      return `
      <div class="product-card">
        ${hasDiscount ? `<span class="badge-discount">-${discount}%</span>` : ""}
        ${p.tag ? `<span class="badge-tag">${p.tag}</span>` : ""}
        <span class="badge-stock ${inStock ? "in" : "out"}">
          ${inStock ? "Disponible" : "Agotado"}
        </span>

        <div class="product-img" data-id="${p.id}">${imgContent}</div>

        <div class="product-name" data-id="${p.id}">${p.name}</div>
        <div class="product-cat">${p.category}</div>
        <div class="stars">${starString(p.rating)}<small>(${p.reviews.length})</small></div>
        ${p.sold ? `<div class="sold-count"><i class="fa-solid fa-arrow-trend-up"></i> ${p.sold} vendidos</div>` : ""}

        <div class="price-row">
          <span class="price">${money(p.price)}</span>
          ${hasDiscount ? `<span class="old-price">${money(p.oldPrice)}</span>` : ""}
        </div>

        ${lowStock ? `<span class="urgency"><i class="fa-solid fa-triangle-exclamation"></i> ¡Últimas ${p.stock} unidades!</span>` : ""}

        ${
          inStock
            ? `<div class="product-actions">
                 <button class="btn-yellow" data-view="${p.id}">Ver producto</button>
                 <button class="btn-wa-mini" data-wa="${p.id}" title="Comprar por WhatsApp"><i class="fa-brands fa-whatsapp"></i></button>
               </div>`
            : `<button class="btn-disabled" disabled>Agotado</button>`
        }
      </div>`;
    })
    .join("");

  // abrir modal (imagen y nombre)
  grid.querySelectorAll(".product-img[data-id], .product-name[data-id]").forEach((el) =>
    el.addEventListener("click", () => openModal(+el.dataset.id))
  );
  grid.querySelectorAll("[data-view]").forEach((el) =>
    el.addEventListener("click", () => openModal(+el.dataset.view))
  );
  // compra directa por WhatsApp desde la tarjeta
  grid.querySelectorAll("[data-wa]").forEach((el) =>
    el.addEventListener("click", () => quickBuy(+el.dataset.wa))
  );
}

// Compra rápida por WhatsApp desde la tarjeta (sin abrir modal)
function quickBuy(id) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) return;
  let msg = `Hola! Estoy interesado(a) en este producto:\n\n`;
  msg += `🛒 *${p.name}*\n`;
  msg += `💰 Precio: ${money(p.price)}\n\n`;
  msg += `¿Me pueden dar más información para comprarlo?`;
  openWhatsapp(msg);
}

/* =========================================================
   MODAL DE PRODUCTO
   ========================================================= */
let modalState = { product: null, size: null, color: null, qty: 1 };

function openModal(id) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) return;

  const gallery = p.images && p.images.length ? p.images : p.img ? [p.img] : [];
  modalState = {
    product: p,
    size: p.sizes && p.sizes.length ? p.sizes[0] : null,
    color: p.colors && p.colors.length ? p.colors[0].name : null,
    qty: 1,
    gallery,
    activeImg: 0,
  };

  renderModal();
  $("#productModal").classList.add("open");
  document.body.style.overflow = "hidden";
}

function renderModal() {
  const p = modalState.product;
  const hasDiscount = p.oldPrice && p.oldPrice > p.price;
  const inStock = p.stock > 0;
  const gallery = modalState.gallery || [];
  const mainSrc = gallery[modalState.activeImg];
  const mainImg = mainSrc
    ? `<img src="${mainSrc}" alt="${p.name}">`
    : `<i class="fa-regular fa-image ph-ic"></i>`;
  const thumbsHtml =
    gallery.length > 1
      ? `<div class="modal-thumbs">
           ${gallery
             .map(
               (u, i) =>
                 `<button class="modal-thumb ${i === modalState.activeImg ? "active" : ""}" data-img="${i}"><img src="${u}" alt=""></button>`
             )
             .join("")}
         </div>`
      : "";
  const galleryHtml = `
    <div class="modal-gallery">
      <div class="modal-img" id="modalMainImg">
        <div class="mimg-inner" id="mimgInner">${mainImg}</div>
        ${
          gallery.length > 1
            ? `<button class="gal-arrow left" id="galPrev" aria-label="Anterior">‹</button>
               <button class="gal-arrow right" id="galNext" aria-label="Siguiente">›</button>
               <span class="gal-counter" id="galCounter">${modalState.activeImg + 1}/${gallery.length}</span>`
            : ""
        }
        ${
          mainSrc
            ? `<button class="gal-zoom" id="galZoom" aria-label="Ampliar"><i class="fa-solid fa-magnifying-glass-plus"></i></button>`
            : ""
        }
      </div>
      ${thumbsHtml}
    </div>`;

  const sizesHtml =
    p.sizes && p.sizes.length
      ? `<div class="opt-group">
           <label>Talla:</label>
           <div class="size-btns">
             ${p.sizes
               .map(
                 (s) =>
                   `<button class="size-btn ${
                     s === modalState.size ? "selected" : ""
                   }" data-size="${s}">${s}</button>`
               )
               .join("")}
           </div>
         </div>`
      : "";

  const colorsHtml =
    p.colors && p.colors.length
      ? `<div class="opt-group">
           <label>Color: <span id="colorName">${modalState.color}</span></label>
           <div class="color-btns">
             ${p.colors
               .map(
                 (c) =>
                   `<div class="color-dot ${
                     c.name === modalState.color ? "selected" : ""
                   }" style="background:${c.hex}" title="${c.name}" data-color="${c.name}"></div>`
               )
               .join("")}
           </div>
         </div>`
      : "";

  const reviewsHtml = p.reviews
    .map(
      (r) => `
      <div class="review">
        <div class="review-head">
          <span class="review-user">${r.user}</span>
          <span class="stars">${starString(r.stars)}</span>
        </div>
        <div class="review-text">${r.text}</div>
      </div>`
    )
    .join("");

  $("#modalContent").innerHTML = `
    <div class="modal-grid">
      ${galleryHtml}
      <div class="modal-info">
        <div class="modal-brand">${p.brand} · ${p.category}</div>
        <h2>${p.name}</h2>
        <div class="stars">${starString(p.rating)} <small>${p.rating} (${p.reviews.length} reseñas)</small></div>

        <div class="modal-price-row">
          <span class="modal-price">${money(p.price)}</span>
          ${hasDiscount ? `<span class="old-price">${money(p.oldPrice)}</span>` : ""}
          ${
            hasDiscount
              ? `<span class="badge-discount" style="position:static">-${Math.round(
                  (1 - p.price / p.oldPrice) * 100
                )}%</span>`
              : ""
          }
        </div>

        <p class="modal-desc">${p.desc}</p>

        ${sizesHtml}
        ${colorsHtml}

        <div class="stock-info ${inStock ? "in" : "out"}">
          ${
            inStock
              ? `<i class="fa-solid fa-circle-check"></i> Disponible · Quedan ${p.stock} unidades en stock`
              : `<i class="fa-solid fa-circle-xmark"></i> Agotado temporalmente`
          }
        </div>

        ${
          inStock
            ? `<div class="qty-row">
                 <label>Cantidad:</label>
                 <div class="qty-ctrl">
                   <button id="qtyMinus">−</button>
                   <span id="qtyVal">${modalState.qty}</span>
                   <button id="qtyPlus">+</button>
                 </div>
               </div>

               <div class="modal-subtotal">
                 Subtotal: <strong id="modalSubtotal">${money(p.price * modalState.qty)}</strong>
               </div>

               <div class="modal-actions">
                 <button class="btn-yellow" id="modalAddCart">Añadir al carrito</button>
                 <button class="btn-wa" id="modalBuyWa"><i class="fa-brands fa-whatsapp"></i> Comprar por WhatsApp</button>
               </div>`
            : `<button class="btn-wa" id="modalNotify"><i class="fa-brands fa-whatsapp"></i> Consultar disponibilidad</button>`
        }
      </div>
    </div>

    <div class="reviews">
      <h3>Reseñas de clientes (${p.reviews.length})</h3>
      ${reviewsHtml || "<p style='color:#9aa1b0'>Aún no hay reseñas.</p>"}
    </div>
  `;

  bindModalEvents();
}

function bindModalEvents() {
  const p = modalState.product;

  // cambiar imagen principal al tocar una miniatura
  $$("#modalContent .modal-thumb").forEach((t) =>
    t.addEventListener("click", () => galShow(+t.dataset.img))
  );

  // flechas de navegación de la galería
  const galPrev = $("#galPrev");
  const galNext = $("#galNext");
  if (galPrev) galPrev.addEventListener("click", (e) => { e.stopPropagation(); galShow(modalState.activeImg - 1); });
  if (galNext) galNext.addEventListener("click", (e) => { e.stopPropagation(); galShow(modalState.activeImg + 1); });

  // botón de zoom / clic en la imagen principal => abrir lightbox
  const galZoom = $("#galZoom");
  if (galZoom) galZoom.addEventListener("click", (e) => { e.stopPropagation(); openLightbox(modalState.activeImg); });
  const mainImgEl = $("#modalMainImg");
  if (mainImgEl) mainImgEl.addEventListener("click", () => openLightbox(modalState.activeImg));

  // deslizar (swipe) en móvil para cambiar de imagen
  if (mainImgEl && modalState.gallery.length > 1) {
    attachSwipe(
      mainImgEl,
      () => galShow(modalState.activeImg + 1), // izquierda -> siguiente
      () => galShow(modalState.activeImg - 1)  // derecha -> anterior
    );
  }

  $$("#modalContent .size-btn").forEach((b) =>
    b.addEventListener("click", () => {
      modalState.size = b.dataset.size;
      $$("#modalContent .size-btn").forEach((x) =>
        x.classList.toggle("selected", x === b)
      );
    })
  );

  $$("#modalContent .color-dot").forEach((d) =>
    d.addEventListener("click", () => {
      modalState.color = d.dataset.color;
      $$("#modalContent .color-dot").forEach((x) =>
        x.classList.toggle("selected", x === d)
      );
      const cn = $("#colorName");
      if (cn) cn.textContent = modalState.color;
    })
  );

  const updateSubtotal = () => {
    $("#qtyVal").textContent = modalState.qty;
    const sub = $("#modalSubtotal");
    if (sub) sub.textContent = money(p.price * modalState.qty);
  };

  const minus = $("#qtyMinus");
  const plus = $("#qtyPlus");
  if (minus)
    minus.addEventListener("click", () => {
      if (modalState.qty > 1) modalState.qty--;
      updateSubtotal();
    });
  if (plus)
    plus.addEventListener("click", () => {
      if (modalState.qty < p.stock) modalState.qty++;
      else toast("No hay más unidades en stock");
      updateSubtotal();
    });

  const addBtn = $("#modalAddCart");
  if (addBtn) addBtn.addEventListener("click", () => { addToCart(); });

  const buyWa = $("#modalBuyWa");
  if (buyWa) buyWa.addEventListener("click", buyNowWhatsapp);

  const notify = $("#modalNotify");
  if (notify) notify.addEventListener("click", () => {
    const msg = `Hola! Quiero consultar la disponibilidad del producto *${p.name}* (${p.category}).`;
    openWhatsapp(msg);
  });
}

function closeModal() {
  $("#productModal").classList.remove("open");
  document.body.style.overflow = "";
}

/* =========================================================
   GALERÍA (flechas, miniaturas, swipe) Y ZOOM (lightbox)
   ========================================================= */
// Cambia la imagen principal del modal
function galShow(i) {
  const g = modalState.gallery || [];
  if (!g.length) return;
  modalState.activeImg = (i + g.length) % g.length;
  const inner = $("#mimgInner");
  if (inner) inner.innerHTML = `<img src="${g[modalState.activeImg]}" alt="">`;
  $$("#modalContent .modal-thumb").forEach((x, idx) =>
    x.classList.toggle("active", idx === modalState.activeImg)
  );
  const c = $("#galCounter");
  if (c) c.textContent = `${modalState.activeImg + 1}/${g.length}`;
}

// Detecta deslizamiento horizontal (táctil) sobre un elemento
function attachSwipe(el, onLeft, onRight) {
  let startX = 0, startY = 0, active = false;
  el.addEventListener("touchstart", (e) => {
    active = true;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });
  el.addEventListener("touchend", (e) => {
    if (!active) return;
    active = false;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) onLeft(); else onRight();
    }
  }, { passive: true });
}

// ---------- Lightbox (zoom) ----------
let lbIndex = 0;
let lbZoomed = false;

function openLightbox(i) {
  const g = modalState.gallery || [];
  if (!g.length) return;
  lbIndex = i;
  lbSetImg();
  $("#lightbox").classList.add("open");
}
function closeLightbox() {
  $("#lightbox").classList.remove("open");
  lbSetZoom(false);
}
function lbSetImg() {
  const g = modalState.gallery || [];
  if (!g.length) return;
  lbIndex = (lbIndex + g.length) % g.length;
  $("#lbImg").src = g[lbIndex];
  lbSetZoom(false);
  const c = $("#lbCounter");
  if (c) c.textContent = g.length > 1 ? `${lbIndex + 1}/${g.length}` : "";
  const multi = g.length > 1;
  $("#lbPrev").style.display = multi ? "" : "none";
  $("#lbNext").style.display = multi ? "" : "none";
}
function lbSetZoom(on) {
  lbZoomed = on;
  const img = $("#lbImg");
  img.classList.toggle("zoomed", on);
  if (!on) img.style.transformOrigin = "center center";
  const hint = $("#lbHint");
  if (hint) hint.textContent = on ? "Mueve para explorar · toca para alejar" : "Toca la imagen para acercar";
}
function lbMove(clientX, clientY) {
  if (!lbZoomed) return;
  const stage = $("#lbStage");
  const r = stage.getBoundingClientRect();
  const x = Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100));
  const y = Math.max(0, Math.min(100, ((clientY - r.top) / r.height) * 100));
  $("#lbImg").style.transformOrigin = `${x}% ${y}%`;
}

function initLightbox() {
  const lb = $("#lightbox");
  if (!lb) return;

  $("#lbClose").addEventListener("click", closeLightbox);
  $("#lbPrev").addEventListener("click", () => { lbIndex--; lbSetImg(); });
  $("#lbNext").addEventListener("click", () => { lbIndex++; lbSetImg(); });

  // clic en el fondo cierra
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLightbox(); });

  const img = $("#lbImg");
  // clic en la imagen alterna el zoom
  img.addEventListener("click", (e) => { e.stopPropagation(); lbSetZoom(!lbZoomed); });

  const stage = $("#lbStage");
  stage.addEventListener("mousemove", (e) => lbMove(e.clientX, e.clientY));
  stage.addEventListener("touchmove", (e) => {
    if (lbZoomed) {
      e.preventDefault();
      lbMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: false });

  // deslizar para cambiar de imagen cuando NO está en zoom
  attachSwipe(
    stage,
    () => { if (!lbZoomed) { lbIndex++; lbSetImg(); } },
    () => { if (!lbZoomed) { lbIndex--; lbSetImg(); } }
  );
}

/* =========================================================
   CARRITO
   ========================================================= */
function addToCart() {
  const p = modalState.product;
  const item = {
    key: `${p.id}-${modalState.size || ""}-${modalState.color || ""}`,
    id: p.id,
    name: p.name,
    img: p.img,
    price: p.price,
    size: modalState.size,
    color: modalState.color,
    qty: modalState.qty,
    stock: p.stock,
  };

  const existing = CART.find((c) => c.key === item.key);
  if (existing) existing.qty = Math.min(existing.qty + item.qty, p.stock || existing.qty + item.qty);
  else CART.push(item);

  updateCartUI();
  toast(`${p.name} añadido al carrito`);
  closeModal();
}

function removeFromCart(key) {
  CART = CART.filter((c) => c.key !== key);
  updateCartUI();
}

// Sube o baja la cantidad de un producto del carrito
function changeCartQty(key, delta) {
  const it = CART.find((c) => c.key === key);
  if (!it) return;
  const next = it.qty + delta;
  if (next < 1) {
    removeFromCart(key);
    return;
  }
  if (it.stock && next > it.stock) {
    toast("No hay más unidades en stock");
    return;
  }
  it.qty = next;
  updateCartUI();
}

function cartTotal() {
  return CART.reduce((sum, c) => sum + c.price * c.qty, 0);
}
function cartCount() {
  return CART.reduce((sum, c) => sum + c.qty, 0);
}

function updateShippingBar() {
  const total = cartTotal();
  const goal = STORE.freeShippingFrom;
  const pct = Math.min(100, Math.round((total / goal) * 100));
  $("#cartShipFill").style.width = pct + "%";
  const txt = $("#cartShipText");
  if (total === 0) {
    txt.innerHTML = `Agrega productos y obtén <strong>envío gratis</strong> desde ${money(goal)}.`;
  } else if (total >= goal) {
    txt.innerHTML = `<i class="fa-solid fa-circle-check"></i> ¡Felicidades! Tienes <strong>envío GRATIS</strong>.`;
  } else {
    txt.innerHTML = `Te faltan <strong>${money(goal - total)}</strong> para el envío gratis.`;
  }
}

// Guarda / carga el carrito en el navegador para que no se pierda al recargar
function saveCart() {
  try { localStorage.setItem("canaan_cart", JSON.stringify(CART)); } catch (e) {}
}
function loadCart() {
  try {
    const d = localStorage.getItem("canaan_cart");
    if (d) CART = JSON.parse(d) || [];
  } catch (e) { CART = []; }
}

function updateCartUI() {
  saveCart();
  $("#cartCount").textContent = cartCount();
  $("#cartTotal").textContent = money(cartTotal());
  $("#cartDrawerTotal").textContent = money(cartTotal());
  updateShippingBar();

  const items = $("#cartItems");
  if (!CART.length) {
    items.innerHTML = `<p class="cart-empty">Tu carrito está vacío.</p>`;
    return;
  }

  items.innerHTML = CART.map((c) => {
    const meta = [c.size, c.color].filter(Boolean).join(" · ");
    const thumb = c.img ? `<img src="${c.img}" alt="">` : `<i class="fa-regular fa-image ph-ic"></i>`;
    return `
    <div class="cart-item">
      <div class="cart-item-thumb">${thumb}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${c.name}</div>
        ${meta ? `<div class="cart-item-meta">${meta}</div>` : ""}
        <div class="cart-item-price">${money(c.price * c.qty)}</div>
        <div class="cart-qty">
          <button class="cart-qty-btn" data-dec="${c.key}" aria-label="Restar">−</button>
          <span class="cart-qty-val">${c.qty}</span>
          <button class="cart-qty-btn" data-inc="${c.key}" aria-label="Sumar">+</button>
        </div>
      </div>
      <button class="cart-item-remove" data-remove="${c.key}" aria-label="Eliminar"><i class="fa-solid fa-trash"></i></button>
    </div>`;
  }).join("");

  items.querySelectorAll("[data-remove]").forEach((b) =>
    b.addEventListener("click", () => removeFromCart(b.dataset.remove))
  );
  items.querySelectorAll("[data-inc]").forEach((b) =>
    b.addEventListener("click", () => changeCartQty(b.dataset.inc, 1))
  );
  items.querySelectorAll("[data-dec]").forEach((b) =>
    b.addEventListener("click", () => changeCartQty(b.dataset.dec, -1))
  );
}

function openCart() {
  $("#cartDrawer").classList.add("open");
  $("#cartOverlay").classList.add("show");
}
function closeCart() {
  $("#cartDrawer").classList.remove("open");
  $("#cartOverlay").classList.remove("show");
}

/* =========================================================
   WHATSAPP
   ========================================================= */
function openWhatsapp(message) {
  const num = String(WHATSAPP_NUMBER).replace(/\D/g, ""); // solo dígitos
  const url = `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

function buyNowWhatsapp() {
  const p = modalState.product;
  let msg = `Hola! Quiero comprar este producto:\n\n`;
  msg += `🛒 *${p.name}*\n`;
  if (modalState.size) msg += `📏 Talla: ${modalState.size}\n`;
  if (modalState.color) msg += `🎨 Color: ${modalState.color}\n`;
  msg += `🔢 Cantidad: ${modalState.qty}\n`;
  msg += `💰 Precio unitario: ${money(p.price)}\n`;
  msg += `💵 Total: ${money(p.price * modalState.qty)}`;
  openWhatsapp(msg);
}

function checkoutWhatsapp() {
  if (!CART.length) {
    toast("Tu carrito está vacío");
    return;
  }
  let msg = `Hola! Quiero realizar el siguiente pedido:\n\n`;
  CART.forEach((c, i) => {
    const meta = [c.size, c.color].filter(Boolean).join(", ");
    msg += `${i + 1}. *${c.name}*${meta ? ` (${meta})` : ""}\n`;
    msg += `   Cant: ${c.qty} × ${money(c.price)} = ${money(c.price * c.qty)}\n`;
  });
  msg += `\n💵 *TOTAL: ${money(cartTotal())}*`;
  openWhatsapp(msg);
}

/* =========================================================
   MENÚ / EVENTOS GENERALES
   ========================================================= */
function initMenus() {
  // hamburguesa móvil
  const hamburger = $("#hamburger");
  const mobileMenu = $("#mobileMenu");
  const overlay = $("#overlay");

  const closeMobile = () => {
    mobileMenu.classList.remove("open");
    overlay.classList.remove("show");
  };

  hamburger.addEventListener("click", () => {
    mobileMenu.classList.toggle("open");
    overlay.classList.toggle("show");
  });
  overlay.addEventListener("click", closeMobile);
  $$("#mobileMenu a").forEach((a) => a.addEventListener("click", closeMobile));

  // dropdown categorías (desktop) — los enlaces se generan en renderCatMenu()
  $("#catToggle").addEventListener("click", () =>
    $("#catMenu").classList.toggle("open")
  );

  // carrito
  $("#cartBtn").addEventListener("click", openCart);
  $("#cartClose").addEventListener("click", closeCart);
  $("#cartOverlay").addEventListener("click", closeCart);
  $("#checkoutWhatsapp").addEventListener("click", checkoutWhatsapp);

  // modal
  $("#modalClose").addEventListener("click", closeModal);
  $("#productModal").addEventListener("click", (e) => {
    if (e.target.id === "productModal") closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if ($("#lightbox").classList.contains("open")) { closeLightbox(); return; }
      closeModal();
      closeCart();
    }
    if ($("#lightbox").classList.contains("open")) {
      if (e.key === "ArrowRight") { lbIndex++; lbSetImg(); }
      if (e.key === "ArrowLeft") { lbIndex--; lbSetImg(); }
    }
  });

  // whatsapp flotante
  $("#whatsappFloat").addEventListener("click", (e) => {
    e.preventDefault();
    openWhatsapp("Hola! Me gustaría recibir información sobre sus productos ortopédicos.");
  });
  // cerrar burbuja de ayuda
  $("#waBubbleClose").addEventListener("click", (e) => {
    e.stopPropagation();
    $("#waBubble").classList.add("hide");
  });
  // banner CTA de asesoría
  $("#ctaWhatsapp").addEventListener("click", () =>
    openWhatsapp("Hola! Necesito asesoría para elegir el producto ortopédico adecuado. ¿Me pueden ayudar?")
  );

  // búsqueda
  const doSearch = () => {
    const q = $("#searchInput").value.trim();
    filterProducts("all", q);
    $("#productos").scrollIntoView({ behavior: "smooth" });
  };
  $("#searchBtn").addEventListener("click", doSearch);
  $("#searchInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") doSearch();
  });
}

/* =========================================================
   INIT
   ========================================================= */
// Carga los productos desde Supabase (si falla, usa los de ejemplo)
async function loadProducts() {
  try {
    const { data, error } = await supabaseClient
      .from("productos")
      .select("*")
      .order("id", { ascending: true });
    if (error) throw error;
    if (data && data.length) {
      // solo productos activos (los ocultos no se muestran en la tienda)
      PRODUCTS = data.filter((r) => r.activo !== false).map(mapRow);
    }
  } catch (e) {
    console.warn("No se pudieron cargar productos de Supabase, usando datos de ejemplo.", e);
  }
}

// Actualiza un texto por id si el elemento existe y hay valor
function setText(sel, value) {
  const el = $(sel);
  if (el && value) el.textContent = value;
}

// Carga la configuración del sitio desde el panel (tabla configuracion)
async function loadConfig() {
  try {
    const { data } = await supabaseClient
      .from("configuracion")
      .select("*")
      .eq("id", 1)
      .single();
    if (!data) return;

    if (data.whatsapp) { WHATSAPP_NUMBER = data.whatsapp; setText("#fWhatsapp", data.whatsapp); }
    if (data.telefono) setText("#fTelefono", data.telefono);
    if (data.correo) { setText("#fCorreo", data.correo); setText("#topMail", data.correo); }
    if (data.direccion) setText("#fDireccion", data.direccion);
    if (data.cupon) STORE.coupon = data.cupon;
    if (data.cupon_texto) STORE.couponText = data.cupon_texto;
    if (data.envio_gratis) STORE.freeShippingFrom = Number(data.envio_gratis);
    if (data.anuncio) STORE.announce = data.anuncio;
    if (Array.isArray(data.slides) && data.slides.length) SLIDES = data.slides;
  } catch (e) {
    console.warn("Sin configuración personalizada, usando valores por defecto.", e);
  }
}

// Carga las categorías desde el panel (tabla categorias)
async function loadCategories() {
  try {
    const { data } = await supabaseClient
      .from("categorias")
      .select("*")
      .order("orden", { ascending: true });
    if (data && data.length) {
      CATEGORIES = data.map((c) => ({ name: c.nombre, icon: c.icono || "fa-solid fa-tag" }));
    }
  } catch (e) {
    console.warn("Sin categorías personalizadas, usando las de respaldo.", e);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // 1) Pinta de inmediato con los valores por defecto (respaldo)
  renderAnnounce();
  renderBenefits();
  renderSlides();
  showSlide(0);
  renderTestimonials();
  renderCategories();
  renderCatMenu();
  renderTabs();
  initMenus();
  initLightbox();
  initSliderControls();
  loadCart();
  updateCartUI();

  // 2) Carga desde la base de datos
  await Promise.all([loadConfig(), loadCategories(), loadProducts()]);

  // 3) Re-pinta lo que pudo cambiar desde el panel
  renderAnnounce();
  renderSlides();
  showSlide(0);
  renderCategories();
  renderCatMenu();
  renderTabs();
  renderOffers();
  renderProducts(PRODUCTS);
  updateCartUI();
});
