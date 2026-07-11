/* =========================================================
   DATOS HIPOTÉTICOS DE LA TIENDA
   Cambia números de WhatsApp, precios, stock, imágenes, etc.
   ========================================================= */

// Número de WhatsApp de la tienda (se puede sobrescribir desde el panel)
let WHATSAPP_NUMBER = "573057420352";

// Configuración de la tienda (fácil de editar)
const STORE = {
  // Monto para envío gratis (usado en la barra del carrito)
  freeShippingFrom: 150000,
  // Cupón que se muestra en la barra de anuncio
  coupon: "BIENVENIDA10",
  couponText: "10% de descuento en tu primera compra",
  // Frase del anuncio superior (el icono se agrega automáticamente)
  announce: "Envío GRATIS en compras superiores a $150.000 · Atención inmediata por WhatsApp",
};

// Beneficios / sellos de confianza (barra bajo el encabezado)
const BENEFITS = [
  { icon: "fa-solid fa-truck-fast", title: "Envío a todo el país", text: "Recíbelo en casa" },
  { icon: "fa-solid fa-headset", title: "Asesoría por WhatsApp", text: "Te ayudamos a elegir" },
  { icon: "fa-solid fa-shield-halved", title: "Productos garantizados", text: "Calidad certificada" },
  { icon: "fa-solid fa-hand-holding-dollar", title: "Pago contra entrega", text: "Paga al recibir" },
];

// Opiniones destacadas de clientes (prueba social)
const TESTIMONIALS = [
  { name: "Luz Marina T.", text: "Excelente atención por WhatsApp, me asesoraron para elegir la silla de ruedas ideal para mi mamá. Llegó rápido.", stars: 5 },
  { name: "Fernando A.", text: "Compré una faja lumbar y una rodillera. Productos de muy buena calidad y precio justo. Volveré a comprar.", stars: 5 },
  { name: "Diana C.", text: "Me encantó lo fácil que fue pedir por WhatsApp. Súper recomendados, muy amables y cumplidos.", stars: 5 },
];

// Categorías (respaldo; se sobrescriben con las del panel si existen)
let CATEGORIES = [
  { name: "Protección", icon: "fa-solid fa-shield-halved" },
  { name: "Oxigenoterapia", icon: "fa-solid fa-lungs" },
  { name: "Órtesis y Ortopedia", icon: "fa-solid fa-bone" },
  { name: "Movilidad humana", icon: "fa-solid fa-wheelchair" },
  { name: "Medias", icon: "fa-solid fa-socks" },
  { name: "Insumos médicos", icon: "fa-solid fa-briefcase-medical" },
  { name: "Fisioterapia y rehabilitación", icon: "fa-solid fa-dumbbell" },
  { name: "Equipos médicos", icon: "fa-solid fa-stethoscope" },
  { name: "Cuidado personal y bienestar", icon: "fa-solid fa-shoe-prints" },
];

// Slides del banner principal (respaldo; se sobrescriben con los del panel)
let SLIDES = [
  {
    title: "Asesoría profesional",
    text: "Te ayudamos a elegir el producto ortopédico <strong>ideal para tu bienestar</strong>. Atención personalizada por WhatsApp.",
    image: "assets/img/banner_001.webp",
  },
  {
    title: "Fabricación a la medida",
    text: "Somos <strong>fabricantes</strong> de calzado y plantillas ortopédicas hechas especialmente para ti.",
    image: "assets/img/banner_002.webp",
  },
  {
    title: "Soporte y movilidad",
    text: "Rodilleras, tobilleras, muletas y bastones para <strong>recuperar tu independencia</strong>.",
    image: "assets/img/banner_003.webp",
  },
  {
    title: "Calidad de vida",
    text: "Productos ortopédicos que mejoran tu <strong>movilidad y bienestar</strong> día a día.",
    image: "assets/img/banner_004.webp",
  },
];

/* Cada producto:
   - id, name, category, brand
   - price (precio actual) y oldPrice (precio antes, para mostrar descuento)
   - stock (número). Si es 0 => "Agotado"
   - sizes: array de tallas (opcional)
   - colors: array {name, hex} (opcional)
   - rating y reviews[] (reseñas de ejemplo)
   - desc: descripción
   - img: ruta de imagen (déjalo "" para mostrar un ícono provisional)
   NOTA: estos son datos de RESPALDO. Los productos reales se administran
   desde el panel (admin.html) y se guardan en Supabase.
*/
let PRODUCTS = [
  {
    id: 1,
    name: "Guante Nitrilo",
    category: "Protección",
    brand: "SafeCare",
    tag: "Más vendido",
    sold: 340,
    price: 30000,
    oldPrice: 38000,
    stock: 24,
    sizes: ["S", "M", "L", "XL"],
    colors: [{ name: "Negro", hex: "#222" }, { name: "Azul", hex: "#2a5db0" }],
    rating: 4.8,
    desc: "Caja x100 unidades. Guantes de nitrilo sin polvo, alta resistencia y sensibilidad táctil. Ideal para uso médico y aseo.",
    img: "",
    reviews: [
      { user: "María G.", stars: 5, text: "Excelente calidad, muy resistentes." },
      { user: "Carlos R.", stars: 4, text: "Buenos guantes, tallaje justo." },
    ],
  },
  {
    id: 2,
    name: "Polainas Antideslizantes",
    category: "Protección",
    brand: "MediStep",
    price: 12000,
    oldPrice: 0,
    stock: 0,
    sizes: ["Única"],
    colors: [{ name: "Azul", hex: "#2a5db0" }],
    rating: 4.2,
    desc: "Cubre calzado desechable con banda antideslizante. Paquete x50 unidades.",
    img: "",
    reviews: [
      { user: "Ana P.", stars: 4, text: "Cumplen su función perfectamente." },
    ],
  },
  {
    id: 3,
    name: "Tapa Oídos Espuma",
    category: "Protección",
    brand: "SilentPro",
    price: 2000,
    oldPrice: 3000,
    stock: 120,
    sizes: [],
    colors: [{ name: "Naranja", hex: "#ff7a1a" }],
    rating: 4.6,
    desc: "Tapones auditivos de espuma de alta densidad. Reducción de ruido cómoda para dormir o trabajar.",
    img: "",
    reviews: [
      { user: "Jorge M.", stars: 5, text: "Muy cómodos, bloquean bastante el ruido." },
      { user: "Laura V.", stars: 4, text: "Buenos por el precio." },
    ],
  },
  {
    id: 4,
    name: "Tapabocas Begut x50",
    category: "Protección",
    brand: "Begut",
    price: 18000,
    oldPrice: 20000,
    stock: 8,
    sizes: [],
    colors: [{ name: "Azul", hex: "#2a5db0" }, { name: "Blanco", hex: "#f2f2f2" }],
    rating: 4.7,
    desc: "Tapabocas de 3 capas con filtro. Caja x50 unidades, elástico suave y ajuste nasal.",
    img: "",
    reviews: [
      { user: "Diana S.", stars: 5, text: "Buena protección y no aprietan." },
    ],
  },
  {
    id: 5,
    name: "Concentrador de Oxígeno 5L",
    category: "Oxigenoterapia",
    brand: "OxyLife",
    tag: "Destacado",
    sold: 87,
    price: 2500000,
    oldPrice: 2800000,
    stock: 3,
    sizes: [],
    colors: [{ name: "Blanco", hex: "#f2f2f2" }],
    rating: 4.9,
    desc: "Concentrador de oxígeno de 5 litros por minuto para uso domiciliario. Bajo consumo y funcionamiento silencioso.",
    img: "",
    reviews: [
      { user: "Pedro L.", stars: 5, text: "Funciona perfecto, muy silencioso." },
      { user: "Rosa T.", stars: 5, text: "Nos ha servido muchísimo en casa." },
    ],
  },
  {
    id: 6,
    name: "Cánula Nasal Adulto",
    category: "Oxigenoterapia",
    brand: "AirMed",
    price: 8000,
    oldPrice: 0,
    stock: 45,
    sizes: [],
    colors: [{ name: "Transparente", hex: "#dbe9f5" }],
    rating: 4.5,
    desc: "Cánula nasal de oxígeno para adulto, tubo de 2 metros. Material suave hipoalergénico.",
    img: "",
    reviews: [{ user: "Luis F.", stars: 4, text: "Cómoda y buen material." }],
  },
  {
    id: 7,
    name: "Rodillera Ortopédica",
    category: "Órtesis y Ortopedia",
    brand: "OrthoFlex",
    tag: "Más vendido",
    sold: 512,
    price: 45000,
    oldPrice: 60000,
    stock: 15,
    sizes: ["S", "M", "L", "XL"],
    colors: [{ name: "Negro", hex: "#222" }, { name: "Gris", hex: "#888" }],
    rating: 4.6,
    desc: "Rodillera con soporte lateral y banda rotuliana. Ideal para recuperación de lesiones y soporte deportivo.",
    img: "",
    reviews: [
      { user: "Andrés C.", stars: 5, text: "Me ayudó mucho con el dolor de rodilla." },
      { user: "Sofía R.", stars: 4, text: "Buen soporte, tela cómoda." },
    ],
  },
  {
    id: 8,
    name: "Faja Lumbar",
    category: "Órtesis y Ortopedia",
    brand: "BackSupport",
    price: 55000,
    oldPrice: 70000,
    stock: 0,
    sizes: ["M", "L", "XL", "XXL"],
    colors: [{ name: "Negro", hex: "#222" }],
    rating: 4.4,
    desc: "Faja lumbar con varillas de soporte. Alivia dolor de espalda baja y mejora la postura.",
    img: "",
    reviews: [{ user: "Marta D.", stars: 4, text: "Firme y cómoda para trabajar." }],
  },
  {
    id: 9,
    name: "Silla de Ruedas Estándar",
    category: "Movilidad humana",
    brand: "MoviCare",
    tag: "Destacado",
    sold: 156,
    price: 480000,
    oldPrice: 550000,
    stock: 5,
    sizes: [],
    colors: [{ name: "Negro", hex: "#222" }, { name: "Azul", hex: "#2a5db0" }],
    rating: 4.7,
    desc: "Silla de ruedas plegable en acero, apoyabrazos fijos y frenos manuales. Capacidad hasta 100 kg.",
    img: "",
    reviews: [
      { user: "Gloria M.", stars: 5, text: "Resistente y fácil de plegar." },
      { user: "Hernán P.", stars: 4, text: "Buena relación calidad-precio." },
    ],
  },
  {
    id: 10,
    name: "Bastón Ajustable",
    category: "Movilidad humana",
    brand: "MoviCare",
    price: 35000,
    oldPrice: 42000,
    stock: 20,
    sizes: [],
    colors: [{ name: "Negro", hex: "#222" }, { name: "Plateado", hex: "#c0c0c0" }],
    rating: 4.5,
    desc: "Bastón de aluminio con altura ajustable y puño ergonómico antideslizante.",
    img: "",
    reviews: [{ user: "Beatriz L.", stars: 5, text: "Ligero y muy estable." }],
  },
  {
    id: 11,
    name: "Medias de Compresión",
    category: "Medias",
    brand: "VenaFit",
    tag: "Más vendido",
    sold: 623,
    price: 40000,
    oldPrice: 50000,
    stock: 30,
    sizes: ["S", "M", "L", "XL"],
    colors: [{ name: "Negro", hex: "#222" }, { name: "Beige", hex: "#d8c3a5" }],
    rating: 4.8,
    desc: "Medias de compresión graduada 15-20 mmHg. Mejoran la circulación y reducen la fatiga en las piernas.",
    img: "",
    reviews: [
      { user: "Camila R.", stars: 5, text: "Alivian mucho la pesadez de piernas." },
      { user: "Nubia G.", stars: 5, text: "Excelente compresión, buena tela." },
    ],
  },
  {
    id: 12,
    name: "Tensiómetro Digital",
    category: "Equipos médicos",
    brand: "HealthMeter",
    tag: "Destacado",
    sold: 274,
    price: 95000,
    oldPrice: 120000,
    stock: 12,
    sizes: [],
    colors: [{ name: "Blanco", hex: "#f2f2f2" }],
    rating: 4.7,
    desc: "Tensiómetro digital de brazo automático con pantalla grande y memoria para 2 usuarios.",
    img: "",
    reviews: [
      { user: "Óscar V.", stars: 5, text: "Preciso y fácil de usar." },
    ],
  },
  {
    id: 13,
    name: "Rodillo de Espuma",
    category: "Fisioterapia y rehabilitación",
    brand: "FisioPro",
    price: 38000,
    oldPrice: 0,
    stock: 18,
    sizes: [],
    colors: [{ name: "Azul", hex: "#2a5db0" }, { name: "Negro", hex: "#222" }],
    rating: 4.6,
    desc: "Rodillo de espuma de alta densidad para liberación miofascial y masaje muscular.",
    img: "",
    reviews: [{ user: "Julián A.", stars: 5, text: "Ideal para estirar después de entrenar." }],
  },
  {
    id: 14,
    name: "Baja Lengua Madera x100",
    category: "Insumos médicos",
    brand: "MediWood",
    price: 9000,
    oldPrice: 11000,
    stock: 60,
    sizes: [],
    colors: [],
    rating: 4.3,
    desc: "Bajalenguas de madera estériles, paquete x100 unidades. Uso clínico y manualidades.",
    img: "",
    reviews: [{ user: "Clínica Sur", stars: 4, text: "Buena calidad y precio." }],
  },
  {
    id: 15,
    name: "Separador de Dedos Gel",
    category: "Cuidado personal y bienestar",
    brand: "SoftFeet",
    price: 15000,
    oldPrice: 20000,
    stock: 25,
    sizes: [],
    colors: [{ name: "Transparente", hex: "#dbe9f5" }],
    rating: 4.5,
    desc: "Separador de dedos de gel para juanetes. Alivia la presión y corrige la alineación del dedo.",
    img: "",
    reviews: [
      { user: "Patricia N.", stars: 5, text: "Muy cómodo, alivia el dolor del juanete." },
      { user: "Elena M.", stars: 4, text: "Suave, se ajusta bien." },
    ],
  },
];
