/* =========================================================
   PANEL ADMINISTRATIVO - Ortopédicos Canaan
   ========================================================= */
const $ = (s) => document.querySelector(s);

let productsCache = [];

// Tamaño cuadrado estándar para todas las fotos (px)
const IMG_SIZE = 800;
// Imágenes ya guardadas del producto que se está editando (URLs)
let existingImages = [];
// Fotos nuevas ya procesadas, listas para subir ({ blob, url })
let newImages = [];
// Cachés y estados de las nuevas secciones
let categoriasCache = [];
let reviewsEdit = [];
let slidesEdit = [];
let configId = 1;

/* Procesa la imagen: la ajusta a un cuadrado de IMG_SIZE x IMG_SIZE,
   la centra sobre fondo blanco (sin recortar) y la comprime a JPEG. */
function processImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const img = new Image();
    reader.onload = (e) => (img.src = e.target.result);
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    img.onerror = () => reject(new Error("Formato de imagen no válido"));
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = IMG_SIZE;
      canvas.height = IMG_SIZE;
      const ctx = canvas.getContext("2d");

      // fondo blanco
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, IMG_SIZE, IMG_SIZE);

      // ajuste tipo "contain": el producto completo, centrado
      const scale = Math.min(IMG_SIZE / img.width, IMG_SIZE / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (IMG_SIZE - w) / 2;
      const y = (IMG_SIZE - h) / 2;
      ctx.drawImage(img, x, y, w, h);

      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("No se pudo procesar la imagen")),
        "image/jpeg",
        0.85
      );
    };
    reader.readAsDataURL(file);
  });
}

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
}

const money = (n) => "$ " + Number(n || 0).toLocaleString("es-CO");

/* =========================================================
   AUTENTICACIÓN
   ========================================================= */
async function checkSession() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) showDashboard(data.session.user);
  else showLogin();
}

function showLogin() {
  $("#loginScreen").style.display = "grid";
  $("#dashboard").style.display = "none";
}

async function showDashboard(user) {
  $("#loginScreen").style.display = "none";
  $("#dashboard").style.display = "block";
  $("#adminEmail").textContent = user.email;
  await loadCategoriasAdmin();
  await loadProducts();
  await loadConfigAdmin();
  setView("Dashboard");
}

/* =========================================================
   NAVEGACIÓN ENTRE SECCIONES
   ========================================================= */
function setView(name) {
  ["Dashboard", "Productos", "Categorias", "Config"].forEach((v) => {
    const sec = $("#view" + v);
    if (sec) sec.style.display = v === name ? "" : "none";
  });
  document.querySelectorAll(".admin-nav-btn").forEach((b) =>
    b.classList.toggle("active", b.dataset.view === name)
  );
  if (name === "Dashboard") renderDashboard();
  if (name === "Categorias") renderCatsTable();
  if (name === "Config") renderConfigForm();
}

document.querySelectorAll(".admin-nav-btn").forEach((b) =>
  b.addEventListener("click", () => setView(b.dataset.view))
);

$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("#loginBtn");
  const err = $("#loginError");
  err.textContent = "";
  btn.disabled = true;
  btn.textContent = "Ingresando...";

  const email = $("#loginEmail").value.trim();
  const password = $("#loginPassword").value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  btn.disabled = false;
  btn.textContent = "Ingresar";

  if (error) {
    err.textContent = "Correo o contraseña incorrectos.";
    return;
  }
  showDashboard(data.user);
});

$("#logoutBtn").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  showLogin();
});

/* =========================================================
   LISTAR PRODUCTOS
   ========================================================= */
async function loadProducts() {
  $("#adminLoading").style.display = "block";
  const { data, error } = await supabaseClient
    .from("productos")
    .select("*")
    .order("id", { ascending: false });

  $("#adminLoading").style.display = "none";

  if (error) {
    toast("Error al cargar productos");
    console.error(error);
    return;
  }
  productsCache = data || [];
  renderTable();
  renderDashboard();
}

function renderTable() {
  const tbody = $("#productsTbody");
  $("#productCount").textContent = productsCache.length;

  if (!productsCache.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#9aa1b0;padding:30px">
      Aún no hay productos. Haz clic en "＋ Nuevo producto" para agregar el primero.</td></tr>`;
    return;
  }

  tbody.innerHTML = productsCache
    .map((p) => {
      const img = p.image_url
        ? `<img class="cell-img" src="${p.image_url}" alt="${p.name}" loading="lazy">`
        : `<div class="cell-img"><i class="fa-regular fa-image"></i></div>`;
      const stockPill =
        p.stock > 0
          ? `<span class="pill ok">${p.stock} disp.</span>`
          : `<span class="pill out">Agotado</span>`;
      return `
      <tr>
        <td>${img}</td>
        <td class="cell-name">${p.name}</td>
        <td>${p.category || "-"}</td>
        <td>${money(p.price)}</td>
        <td>${stockPill}</td>
        <td>
          <div class="row-actions">
            <button class="btn-edit" data-edit="${p.id}">Editar</button>
            <button class="btn-del" data-del="${p.id}">Borrar</button>
          </div>
        </td>
      </tr>`;
    })
    .join("");

  tbody.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => openForm(+b.dataset.edit))
  );
  tbody.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => deleteProduct(+b.dataset.del))
  );
}

/* =========================================================
   FORMULARIO (crear / editar)
   ========================================================= */
// Nombres de categorías (de la BD si hay, si no las de respaldo)
function catNames() {
  return categoriasCache.length
    ? categoriasCache.map((c) => c.nombre)
    : CATEGORIES.map((c) => c.name);
}

function fillCategories() {
  const sel = $("#pCategory");
  sel.innerHTML = catNames()
    .map((n) => `<option value="${n}">${n}</option>`)
    .join("");
}

function openForm(id) {
  $("#productForm").reset();
  $("#formError").textContent = "";
  existingImages = [];
  newImages = [];
  fillCategories();

  if (id) {
    const p = productsCache.find((x) => x.id === id);
    if (!p) return;
    $("#formTitle").textContent = "Editar producto";
    $("#pId").value = p.id;
    $("#pName").value = p.name || "";
    $("#pCategory").value = p.category || CATEGORIES[0].name;
    $("#pBrand").value = p.brand || "";
    $("#pTag").value = p.tag || "";
    $("#pPrice").value = p.price || 0;
    $("#pOldPrice").value = p.old_price || 0;
    $("#pStock").value = p.stock || 0;
    $("#pSold").value = p.sold || 0;
    $("#pRating").value = p.rating || 5;
    $("#pSizes").value = (p.sizes || []).join(", ");
    $("#pColors").value = (p.colors || [])
      .map((c) => `${c.name}:${c.hex}`)
      .join(", ");
    $("#pDesc").value = p.description || "";
    reviewsEdit = Array.isArray(p.reviews) ? JSON.parse(JSON.stringify(p.reviews)) : [];
    // cargar imágenes existentes (galería o, si no, la principal)
    if (Array.isArray(p.images) && p.images.length) {
      existingImages = [...p.images];
    } else if (p.image_url) {
      existingImages = [p.image_url];
    }
  } else {
    $("#formTitle").textContent = "Nuevo producto";
    $("#pId").value = "";
    reviewsEdit = [];
  }

  renderImagePreviews();
  renderReviewsEditor();
  $("#formModal").classList.add("open");
}

/* =========================================================
   EDITOR DE RESEÑAS (dentro del formulario de producto)
   ========================================================= */
function renderReviewsEditor() {
  const wrap = $("#reviewsEditor");
  if (!reviewsEdit.length) {
    wrap.innerHTML = `<p class="rev-empty">Sin reseñas. Agrega una para dar confianza.</p>`;
    return;
  }
  wrap.innerHTML = reviewsEdit
    .map(
      (r, i) => `
      <div class="rev-row">
        <input type="text" class="rev-user" data-i="${i}" placeholder="Nombre" value="${(r.user || "").replace(/"/g, "&quot;")}">
        <select class="rev-stars" data-i="${i}">
          ${[5, 4, 3, 2, 1].map((s) => `<option value="${s}" ${Number(r.stars) === s ? "selected" : ""}>${s} ★</option>`).join("")}
        </select>
        <input type="text" class="rev-text" data-i="${i}" placeholder="Comentario" value="${(r.text || "").replace(/"/g, "&quot;")}">
        <button type="button" class="rev-del" data-i="${i}" title="Quitar">&times;</button>
      </div>`
    )
    .join("");

  wrap.querySelectorAll(".rev-user").forEach((el) =>
    el.addEventListener("input", () => (reviewsEdit[+el.dataset.i].user = el.value))
  );
  wrap.querySelectorAll(".rev-text").forEach((el) =>
    el.addEventListener("input", () => (reviewsEdit[+el.dataset.i].text = el.value))
  );
  wrap.querySelectorAll(".rev-stars").forEach((el) =>
    el.addEventListener("change", () => (reviewsEdit[+el.dataset.i].stars = Number(el.value)))
  );
  wrap.querySelectorAll(".rev-del").forEach((el) =>
    el.addEventListener("click", () => {
      reviewsEdit.splice(+el.dataset.i, 1);
      renderReviewsEditor();
    })
  );
}

$("#addReviewBtn").addEventListener("click", () => {
  reviewsEdit.push({ user: "", stars: 5, text: "" });
  renderReviewsEditor();
});

// Dibuja las miniaturas (existentes + nuevas) con botón para quitar cada una
function renderImagePreviews() {
  const wrap = $("#imgPreview");
  const total = existingImages.length + newImages.length;
  if (!total) {
    wrap.innerHTML = `<span class="preview-empty">Aún no has agregado fotos.</span>`;
    return;
  }

  const existHtml = existingImages
    .map(
      (url, i) => `
      <div class="thumb-item">
        <img src="${url}" alt="">
        ${i === 0 ? '<span class="thumb-main">Principal</span>' : ""}
        <button type="button" class="thumb-remove" data-existing="${i}" title="Quitar">&times;</button>
      </div>`
    )
    .join("");

  const newHtml = newImages
    .map(
      (im, i) => `
      <div class="thumb-item">
        <img src="${im.url}" alt="">
        ${existingImages.length === 0 && i === 0 ? '<span class="thumb-main">Principal</span>' : ""}
        <button type="button" class="thumb-remove" data-new="${i}" title="Quitar">&times;</button>
      </div>`
    )
    .join("");

  wrap.innerHTML = `<div class="thumb-grid">${existHtml}${newHtml}</div>`;

  wrap.querySelectorAll("[data-existing]").forEach((b) =>
    b.addEventListener("click", () => {
      existingImages.splice(+b.dataset.existing, 1);
      renderImagePreviews();
    })
  );
  wrap.querySelectorAll("[data-new]").forEach((b) =>
    b.addEventListener("click", () => {
      newImages.splice(+b.dataset.new, 1);
      renderImagePreviews();
    })
  );
}

function closeForm() {
  $("#formModal").classList.remove("open");
}

$("#newProductBtn").addEventListener("click", () => openForm(null));
$("#formClose").addEventListener("click", closeForm);
$("#formCancel").addEventListener("click", closeForm);

// Al elegir fotos: procesa cada una (cuadrada, fondo blanco) y las agrega a la galería
$("#pImage").addEventListener("change", async (e) => {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;

  const wrap = $("#imgPreview");
  wrap.innerHTML = `<span class="preview-loading">Procesando ${files.length} imagen(es)...</span>`;

  for (const file of files) {
    try {
      const blob = await processImage(file);
      newImages.push({ blob, url: URL.createObjectURL(blob) });
    } catch (err) {
      console.warn("No se pudo procesar una imagen:", file.name, err);
    }
  }
  // limpiar el input para poder volver a elegir las mismas si se desea
  e.target.value = "";
  renderImagePreviews();
});

// Convierte los textos de tallas y colores a los formatos correctos
function parseSizes(str) {
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
function parseColors(str) {
  return str
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => {
      const [name, hex] = c.split(":").map((x) => (x || "").trim());
      return { name: name || "Color", hex: hex || "#cccccc" };
    });
}

// Sube la foto (ya procesada) al bucket y devuelve la URL pública
async function uploadImage(blob) {
  const fileName = `producto_${Date.now()}.jpg`;
  const { error } = await supabaseClient.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, blob, {
      cacheControl: "3600",
      upsert: false,
      contentType: "image/jpeg",
    });
  if (error) throw error;

  const { data } = supabaseClient.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(fileName);
  return data.publicUrl;
}

$("#productForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("#saveBtn");
  const err = $("#formError");
  err.textContent = "";
  btn.disabled = true;
  btn.textContent = "Guardando...";

  try {
    const id = $("#pId").value;

    // datos base del producto
    const payload = {
      name: $("#pName").value.trim(),
      category: $("#pCategory").value,
      brand: $("#pBrand").value.trim(),
      tag: $("#pTag").value.trim(),
      price: Number($("#pPrice").value) || 0,
      old_price: Number($("#pOldPrice").value) || 0,
      stock: Number($("#pStock").value) || 0,
      sold: Number($("#pSold").value) || 0,
      rating: Number($("#pRating").value) || 5,
      sizes: parseSizes($("#pSizes").value),
      colors: parseColors($("#pColors").value),
      description: $("#pDesc").value.trim(),
      reviews: reviewsEdit
        .filter((r) => (r.user || "").trim() && (r.text || "").trim())
        .map((r) => ({ user: r.user.trim(), stars: Number(r.stars) || 5, text: r.text.trim() })),
    };

    // subir las fotos nuevas y armar la galería final
    const uploaded = [];
    for (const im of newImages) {
      uploaded.push(await uploadImage(im.blob));
    }
    const finalImages = [...existingImages, ...uploaded];
    payload.images = finalImages;
    payload.image_url = finalImages[0] || null; // principal = primera

    let res;
    if (id) {
      res = await supabaseClient.from("productos").update(payload).eq("id", id);
    } else {
      res = await supabaseClient.from("productos").insert(payload);
    }
    if (res.error) throw res.error;

    toast(id ? "Producto actualizado" : "Producto creado");
    closeForm();
    loadProducts();
  } catch (e2) {
    console.error(e2);
    err.textContent = "Error al guardar: " + (e2.message || "intenta de nuevo");
  } finally {
    btn.disabled = false;
    btn.textContent = "Guardar producto";
  }
});

/* =========================================================
   BORRAR PRODUCTO
   ========================================================= */
async function deleteProduct(id) {
  const p = productsCache.find((x) => x.id === id);
  if (!confirm(`¿Seguro que quieres borrar "${p ? p.name : "este producto"}"?`))
    return;

  const { error } = await supabaseClient.from("productos").delete().eq("id", id);
  if (error) {
    toast("Error al borrar");
    return;
  }
  toast("Producto borrado");
  loadProducts();
}

// Cerrar modal al hacer clic afuera
$("#formModal").addEventListener("click", (e) => {
  if (e.target.id === "formModal") closeForm();
});

/* =========================================================
   DASHBOARD (resumen)
   ========================================================= */
let siteConfig = {};

function dashCard(icon, label, value) {
  return `<div class="dash-card">
    <div class="dash-ic"><i class="fa-solid ${icon}"></i></div>
    <div><div class="dash-val">${value}</div><div class="dash-lbl">${label}</div></div>
  </div>`;
}

function renderDashboard() {
  const grid = $("#dashGrid");
  if (!grid) return;
  const total = productsCache.length;
  const agotados = productsCache.filter((p) => (p.stock || 0) <= 0).length;
  const stockBajo = productsCache.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 10).length;
  const inventario = productsCache.reduce(
    (s, p) => s + (Number(p.price) || 0) * (Number(p.stock) || 0), 0
  );

  grid.innerHTML =
    dashCard("fa-box", "Productos", total) +
    dashCard("fa-circle-xmark", "Agotados", agotados) +
    dashCard("fa-triangle-exclamation", "Stock bajo", stockBajo) +
    dashCard("fa-warehouse", "Valor inventario", money(inventario));

  const top = [...productsCache].filter((p) => p.sold).sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 5);
  $("#dashTop").innerHTML = top.length
    ? top.map((p) => `<div class="dash-item"><span>${p.name}</span><strong>${p.sold} vendidos</strong></div>`).join("")
    : `<p class="rev-empty">Aún no hay datos de ventas.</p>`;

  const low = productsCache.filter((p) => (p.stock || 0) <= 10).sort((a, b) => (a.stock || 0) - (b.stock || 0)).slice(0, 10);
  $("#dashLow").innerHTML = low.length
    ? low.map((p) => `<div class="dash-item"><span>${p.name}</span><strong class="${(p.stock || 0) <= 0 ? "txt-red" : "txt-orange"}">${(p.stock || 0) <= 0 ? "Agotado" : p.stock + " u."}</strong></div>`).join("")
    : `<p class="rev-empty">Todo con buen stock.</p>`;
}

/* =========================================================
   GESTIÓN DE CATEGORÍAS
   ========================================================= */
async function loadCategoriasAdmin() {
  const { data, error } = await supabaseClient
    .from("categorias")
    .select("*")
    .order("orden", { ascending: true });
  if (!error) categoriasCache = data || [];
}

function renderCatsTable() {
  const tb = $("#catsTbody");
  $("#catCount").textContent = categoriasCache.length;
  if (!categoriasCache.length) {
    tb.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#9aa1b0;padding:24px">Sin categorías. Crea la primera.</td></tr>`;
    return;
  }
  tb.innerHTML = categoriasCache
    .map(
      (c) => `
    <tr>
      <td><i class="${c.icono || "fa-solid fa-tag"}" style="color:#10267a;font-size:20px"></i></td>
      <td class="cell-name">${c.nombre}</td>
      <td>${c.orden || 0}</td>
      <td><div class="row-actions">
        <button class="btn-edit" data-cedit="${c.id}">Editar</button>
        <button class="btn-del" data-cdel="${c.id}">Borrar</button>
      </div></td>
    </tr>`
    )
    .join("");
  tb.querySelectorAll("[data-cedit]").forEach((b) => b.addEventListener("click", () => openCatForm(+b.dataset.cedit)));
  tb.querySelectorAll("[data-cdel]").forEach((b) => b.addEventListener("click", () => deleteCategoria(+b.dataset.cdel)));
}

function openCatForm(id) {
  $("#catForm").reset();
  $("#catError").textContent = "";
  if (id) {
    const c = categoriasCache.find((x) => x.id === id);
    if (!c) return;
    $("#catFormTitle").textContent = "Editar categoría";
    $("#cId").value = c.id;
    $("#cNombre").value = c.nombre || "";
    $("#cIcono").value = c.icono || "";
    $("#cOrden").value = c.orden || 0;
    $("#cIconoPreview").className = c.icono || "fa-solid fa-tag";
  } else {
    $("#catFormTitle").textContent = "Nueva categoría";
    $("#cId").value = "";
    $("#cIconoPreview").className = "fa-solid fa-tag";
  }
  $("#catModal").classList.add("open");
}
function closeCatForm() { $("#catModal").classList.remove("open"); }

$("#newCatBtn").addEventListener("click", () => openCatForm(null));
$("#catClose").addEventListener("click", closeCatForm);
$("#catCancel").addEventListener("click", closeCatForm);
$("#catModal").addEventListener("click", (e) => { if (e.target.id === "catModal") closeCatForm(); });
$("#cIcono").addEventListener("input", () => {
  $("#cIconoPreview").className = $("#cIcono").value.trim() || "fa-solid fa-tag";
});

$("#catForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("#catError"); err.textContent = "";
  const payload = {
    nombre: $("#cNombre").value.trim(),
    icono: $("#cIcono").value.trim() || "fa-solid fa-tag",
    orden: Number($("#cOrden").value) || 0,
  };
  const id = $("#cId").value;
  const res = id
    ? await supabaseClient.from("categorias").update(payload).eq("id", id)
    : await supabaseClient.from("categorias").insert(payload);
  if (res.error) { err.textContent = "Error: " + res.error.message; return; }
  toast(id ? "Categoría actualizada" : "Categoría creada");
  closeCatForm();
  await loadCategoriasAdmin();
  renderCatsTable();
});

async function deleteCategoria(id) {
  const c = categoriasCache.find((x) => x.id === id);
  if (!confirm(`¿Borrar la categoría "${c ? c.nombre : ""}"? Los productos que la usan no se borran.`)) return;
  const { error } = await supabaseClient.from("categorias").delete().eq("id", id);
  if (error) { toast("Error al borrar"); return; }
  toast("Categoría borrada");
  await loadCategoriasAdmin();
  renderCatsTable();
}

/* =========================================================
   CONFIGURACIÓN DEL SITIO
   ========================================================= */
async function loadConfigAdmin() {
  const { data } = await supabaseClient.from("configuracion").select("*").eq("id", 1).single();
  siteConfig = data || {};
  slidesEdit = Array.isArray(siteConfig.slides) ? JSON.parse(JSON.stringify(siteConfig.slides)) : [];
}

function renderConfigForm() {
  const c = siteConfig || {};
  $("#cWhatsapp").value = c.whatsapp || "";
  $("#cTelefono").value = c.telefono || "";
  $("#cCorreo").value = c.correo || "";
  $("#cDireccion").value = c.direccion || "";
  $("#cCupon").value = c.cupon || "";
  $("#cCuponTexto").value = c.cupon_texto || "";
  $("#cEnvio").value = c.envio_gratis || "";
  $("#cAnuncio").value = c.anuncio || "";
  renderSlidesEditor();
}

function renderSlidesEditor() {
  const wrap = $("#slidesEditor");
  if (!slidesEdit.length) { wrap.innerHTML = `<p class="rev-empty">Sin diapositivas. Agrega una.</p>`; return; }
  wrap.innerHTML = slidesEdit
    .map((s, i) => `
    <div class="slide-edit">
      <div class="slide-edit-head">
        <strong>Diapositiva ${i + 1}</strong>
        <button type="button" class="rev-del" data-sdel="${i}" title="Quitar">&times;</button>
      </div>
      <input type="text" class="s-title" data-i="${i}" placeholder="Título" value="${(s.title || "").replace(/"/g, "&quot;")}">
      <input type="text" class="s-text" data-i="${i}" placeholder="Texto (puedes usar <strong>)" value="${(s.text || "").replace(/"/g, "&quot;")}">
      <div class="s-img-row">
        <input type="text" class="s-image" data-i="${i}" placeholder="Ruta o URL de imagen" value="${(s.image || "").replace(/"/g, "&quot;")}">
        <label class="btn-mini s-upload-label">Subir foto<input type="file" accept="image/*" class="s-upload" data-i="${i}" hidden></label>
      </div>
      ${s.image ? `<img class="s-preview" src="${s.image}" alt="">` : ""}
    </div>`)
    .join("");

  wrap.querySelectorAll(".s-title").forEach((el) => el.addEventListener("input", () => (slidesEdit[+el.dataset.i].title = el.value)));
  wrap.querySelectorAll(".s-text").forEach((el) => el.addEventListener("input", () => (slidesEdit[+el.dataset.i].text = el.value)));
  wrap.querySelectorAll(".s-image").forEach((el) => el.addEventListener("input", () => (slidesEdit[+el.dataset.i].image = el.value)));
  wrap.querySelectorAll("[data-sdel]").forEach((b) => b.addEventListener("click", () => { slidesEdit.splice(+b.dataset.sdel, 1); renderSlidesEditor(); }));
  wrap.querySelectorAll(".s-upload").forEach((inp) =>
    inp.addEventListener("change", async (e) => {
      const f = e.target.files[0]; if (!f) return;
      const i = +inp.dataset.i;
      toast("Subiendo imagen...");
      try { slidesEdit[i].image = await uploadBanner(f); renderSlidesEditor(); toast("Imagen subida"); }
      catch (err) { toast("Error al subir la imagen"); }
    })
  );
}

$("#addSlideBtn").addEventListener("click", () => { slidesEdit.push({ title: "", text: "", image: "" }); renderSlidesEditor(); });

// Redimensiona un banner (sin recortar) y lo sube al bucket
function resizeBanner(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const img = new Image();
    reader.onload = (e) => (img.src = e.target.result);
    reader.onerror = () => reject(new Error("No se pudo leer"));
    img.onerror = () => reject(new Error("Imagen no válida"));
    img.onload = () => {
      const maxW = 1600;
      const scale = Math.min(1, maxW / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/jpeg", 0.82);
    };
    reader.readAsDataURL(file);
  });
}
async function uploadBanner(file) {
  const blob = await resizeBanner(file);
  const fileName = `banner_${Date.now()}.jpg`;
  const { error } = await supabaseClient.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, blob, { cacheControl: "3600", upsert: false, contentType: "image/jpeg" });
  if (error) throw error;
  const { data } = supabaseClient.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

$("#configForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("#configError"); err.textContent = "";
  const btn = $("#saveConfigBtn"); btn.disabled = true; btn.textContent = "Guardando...";
  const payload = {
    id: 1,
    whatsapp: $("#cWhatsapp").value.trim(),
    telefono: $("#cTelefono").value.trim(),
    correo: $("#cCorreo").value.trim(),
    direccion: $("#cDireccion").value.trim(),
    cupon: $("#cCupon").value.trim(),
    cupon_texto: $("#cCuponTexto").value.trim(),
    envio_gratis: Number($("#cEnvio").value) || 0,
    anuncio: $("#cAnuncio").value.trim(),
    slides: slidesEdit.filter((s) => s.title || s.text || s.image),
  };
  const { error } = await supabaseClient.from("configuracion").upsert(payload);
  btn.disabled = false; btn.textContent = "Guardar configuración";
  if (error) { err.textContent = "Error: " + error.message; return; }
  siteConfig = payload;
  toast("Configuración guardada");
});

/* =========================================================
   INICIO
   ========================================================= */
checkSession();
