/* =========================================================
   CHECKOUT - Ortopédicos Canaan
   Recoge los datos del comprador, guarda el pedido en Supabase
   y continúa el flujo de pago (por ahora WhatsApp / contra entrega).
   ========================================================= */
const $ = (s) => document.querySelector(s);
const money = (n) => "$ " + (Number(n) || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 });

let CART = [];

// Cargar carrito guardado
try {
  CART = JSON.parse(localStorage.getItem("canaan_cart")) || [];
} catch (e) { CART = []; }

const cartTotal = () => CART.reduce((s, c) => s + c.price * c.qty, 0);

/* ---------- Cargar configuración (WhatsApp y envío gratis) ---------- */
async function loadConfig() {
  try {
    const { data } = await supabaseClient.from("configuracion").select("*").eq("id", 1).single();
    if (data) {
      if (data.whatsapp) WHATSAPP_NUMBER = data.whatsapp;
      if (data.envio_gratis) STORE.freeShippingFrom = Number(data.envio_gratis);
    }
  } catch (e) { /* usa valores por defecto */ }
}

/* ---------- Render del resumen ---------- */
function renderSummary() {
  const wrap = $("#coItems");
  if (!CART.length) {
    wrap.innerHTML = `<p class="co-empty">Tu carrito está vacío. <a href="index.html">Ir a la tienda</a></p>`;
    $("#coSubmit").disabled = true;
    return;
  }
  wrap.innerHTML = CART.map((c) => {
    const meta = [c.size, c.color].filter(Boolean).join(" · ");
    const thumb = c.img ? `<img src="${c.img}" alt="">` : `<i class="fa-regular fa-image"></i>`;
    return `
    <div class="co-item">
      <div class="co-item-thumb">${thumb}</div>
      <div class="co-item-info">
        <div class="co-item-name">${c.name}</div>
        ${meta ? `<div class="co-item-meta">${meta}</div>` : ""}
        <div class="co-item-meta">Cant: ${c.qty} × ${money(c.price)}</div>
      </div>
      <div class="co-item-price">${money(c.price * c.qty)}</div>
    </div>`;
  }).join("");

  const total = cartTotal();
  $("#coSubtotal").textContent = money(total);
  $("#coTotal").textContent = money(total);
  const envio = $("#coEnvio");
  if (STORE.freeShippingFrom && total >= STORE.freeShippingFrom) {
    envio.textContent = "GRATIS";
    envio.style.color = "#25a35a";
  } else {
    envio.textContent = "Por coordinar";
  }
}

/* ---------- Validación ---------- */
function validar() {
  const obligatorios = [
    ["fNombre", "el nombre"],
    ["fTelefono", "el teléfono"],
    ["fDepartamento", "el departamento"],
    ["fCiudad", "la ciudad"],
    ["fDireccion", "la dirección"],
  ];
  for (const [id, nombre] of obligatorios) {
    const el = $("#" + id);
    if (!el.value.trim()) {
      el.focus();
      return `Por favor completa ${nombre}.`;
    }
  }
  return null;
}

/* ---------- Guardar pedido en Supabase ---------- */
async function guardarPedido(datos) {
  const pedido = {
    nombre: datos.nombre,
    telefono: datos.telefono,
    correo: datos.correo || null,
    documento: datos.documento || null,
    departamento: datos.departamento,
    ciudad: datos.ciudad,
    direccion: datos.direccion,
    barrio: datos.barrio || null,
    notas: datos.notas || null,
    items: CART.map((c) => ({
      id: c.id, nombre: c.name, talla: c.size || null, color: c.color || null,
      cantidad: c.qty, precio: c.price, subtotal: c.price * c.qty,
    })),
    total: cartTotal(),
    metodo_pago: datos.pago,
    estado: "nuevo",
  };
  // Intenta guardar; si falla (tabla no creada aún), no bloquea la venta
  try {
    const { error } = await supabaseClient.from("pedidos").insert(pedido);
    if (error) console.warn("No se pudo guardar el pedido en Supabase:", error.message);
  } catch (e) {
    console.warn("Error al guardar el pedido:", e);
  }
}

/* ---------- Mensaje de WhatsApp ---------- */
function abrirWhatsapp(datos) {
  const num = String(WHATSAPP_NUMBER).replace(/\D/g, "");
  let msg = `Hola! Quiero confirmar el siguiente pedido:\n\n`;
  msg += `*DATOS DEL COMPRADOR*\n`;
  msg += `Nombre: ${datos.nombre}\n`;
  msg += `Teléfono: ${datos.telefono}\n`;
  if (datos.correo) msg += `Correo: ${datos.correo}\n`;
  if (datos.documento) msg += `Documento: ${datos.documento}\n`;
  msg += `\n*ENVÍO*\n`;
  msg += `${datos.direccion}\n`;
  if (datos.barrio) msg += `Barrio/Ref: ${datos.barrio}\n`;
  msg += `${datos.ciudad}, ${datos.departamento}\n`;
  if (datos.notas) msg += `Notas: ${datos.notas}\n`;
  msg += `\n*PEDIDO*\n`;
  CART.forEach((c, i) => {
    const meta = [c.size, c.color].filter(Boolean).join(", ");
    msg += `${i + 1}. ${c.name}${meta ? ` (${meta})` : ""} — Cant: ${c.qty} × ${money(c.price)} = ${money(c.price * c.qty)}\n`;
  });
  msg += `\n*TOTAL: ${money(cartTotal())}*\n`;
  msg += `Pago: ${datos.pago}`;

  const url = `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}

/* =========================================================
   PROCESAR PAGO
   // AQUÍ SE INTEGRARÁ LA PASARELA DE PAGO (Wompi / Bold / Mercado Pago)
   Por ahora: guarda el pedido y continúa por WhatsApp / contra entrega.
   ========================================================= */
async function procesarPago(datos) {
  await guardarPedido(datos);
  abrirWhatsapp(datos);
  // limpiar carrito y mostrar éxito
  localStorage.removeItem("canaan_cart");
  CART = [];
  $("#checkoutMain").style.display = "none";
  $("#coSuccess").style.display = "flex";
  window.scrollTo(0, 0);
}

/* ---------- Envío del formulario ---------- */
$("#checkoutForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("#coError");
  err.textContent = "";

  if (!CART.length) { err.textContent = "Tu carrito está vacío."; return; }

  const mensaje = validar();
  if (mensaje) { err.textContent = mensaje; return; }

  const datos = {
    nombre: $("#fNombre").value.trim(),
    telefono: $("#fTelefono").value.trim(),
    correo: $("#fCorreo").value.trim(),
    documento: $("#fDocumento").value.trim(),
    departamento: $("#fDepartamento").value.trim(),
    ciudad: $("#fCiudad").value.trim(),
    direccion: $("#fDireccion").value.trim(),
    barrio: $("#fBarrio").value.trim(),
    notas: $("#fNotas").value.trim(),
    pago: $("#fPago").value,
  };

  const btn = $("#coSubmit");
  btn.disabled = true;
  btn.innerHTML = `Procesando...`;
  await procesarPago(datos);
});

/* ---------- Inicio ---------- */
(async () => {
  await loadConfig();
  renderSummary();
})();
