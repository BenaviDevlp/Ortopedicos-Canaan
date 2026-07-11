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

function showDashboard(user) {
  $("#loginScreen").style.display = "none";
  $("#dashboard").style.display = "block";
  $("#adminEmail").textContent = user.email;
  loadProducts();
}

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
function fillCategories() {
  const sel = $("#pCategory");
  sel.innerHTML = CATEGORIES.map(
    (c) => `<option value="${c.name}">${c.name}</option>`
  ).join("");
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
    // cargar imágenes existentes (galería o, si no, la principal)
    if (Array.isArray(p.images) && p.images.length) {
      existingImages = [...p.images];
    } else if (p.image_url) {
      existingImages = [p.image_url];
    }
  } else {
    $("#formTitle").textContent = "Nuevo producto";
    $("#pId").value = "";
  }

  renderImagePreviews();
  $("#formModal").classList.add("open");
}

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
   INICIO
   ========================================================= */
checkSession();
