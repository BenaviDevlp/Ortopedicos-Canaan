/* =========================================================
   CONEXIÓN CON SUPABASE
   Aquí van tus llaves públicas (seguras para el sitio web).
   La seguridad real la dan las reglas RLS que configuraste.
   ========================================================= */

const SUPABASE_URL = "https://ghbblhlchatigsoajppw.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoYmJsaGxjaGF0aWdzb2FqcHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3MjYwMDEsImV4cCI6MjA5OTMwMjAwMX0.lA1FdqstM0DcTU6fNpMD-R4dayyku--VcRMH_GZVc3o";

// Nombre del bucket de imágenes que creaste
const STORAGE_BUCKET = "productos";

// Cliente de Supabase (se usa en la tienda y en el panel admin)
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// Convierte una fila de la base de datos al formato que usa la tienda
function mapRow(r) {
  return {
    id: r.id,
    name: r.name || "",
    category: r.category || "",
    brand: r.brand || "",
    tag: r.tag || "",
    sold: r.sold || 0,
    price: Number(r.price) || 0,
    oldPrice: Number(r.old_price) || 0,
    stock: r.stock || 0,
    sizes: r.sizes || [],
    colors: r.colors || [],
    rating: Number(r.rating) || 5,
    desc: r.description || "",
    // Galería de imágenes (usa 'images' si existe; si no, cae a image_url)
    images:
      Array.isArray(r.images) && r.images.length
        ? r.images
        : r.image_url
        ? [r.image_url]
        : [],
    // Imagen principal (miniatura para las tarjetas)
    img: r.image_url || (Array.isArray(r.images) && r.images[0]) || "",
    reviews: r.reviews || [],
  };
}
