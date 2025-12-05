require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API berjalan dengan benar");
});

// === URL VENDOR (tanpa spasi di akhir!) ===
const URL_VENDOR_A = "https://vendor-a-intero.vercel.app/api/vendor-a/products";
const URL_VENDOR_B = "https://vendorb-prod.vercel.app/vendor-b/fashion";
const URL_VENDOR_C = "https://vendor-c-intero.vercel.app/products";

// ============================================================
//                 FUNGSI NORMALISASI DATA
// ============================================================

// --- Normalisasi Vendor A ---
function normalizeVendorA(item) {
  if (!item) return null;
  const harga = parseInt(item.hrg) || 0;
  const diskon = harga * 0.1;
  const harga_final = harga - diskon;

  return {
    vendor: "Vendor A (Warung Klontong)",
    kd_produk: item.kd_produk,
    nm_brg: item.nm_brg,
    hrg: harga,
    diskon: "10%",
    harga_diskon: harga_final,
    ket_stok: item.ket_stok
  };
}

// --- Normalisasi Vendor B ---
function normalizeVendorB(item) {
  if (!item) return null;
  return {
    vendor: "Vendor B (Distro Fashion)",
    sku: item.sku,
    productName: item.productName,
    price: item.price,
    isAvailable: item.isAvailable,
  };
}

// --- Normalisasi Vendor C ---
function normalizeVendorC(item) {
  if (!item) return null;

  const name = item.details?.name || "Tidak diketahui";
  const category = (item.details?.category || "").toString();

  let finalName = name;
  // Cek jika kategori adalah "makanan" (case-insensitive)
  if (category.toLowerCase() === "makanan") {
    finalName += " (Recommended)";
  }

  return {
    vendor: "Vendor C (Resto dan Kuliner)",
    id: item.id,
    details: {
      name: finalName,
      category: category,
    },
    pricing: {
      base_price: item.pricing?.base_price || 0,
      tax: item.pricing?.tax || 0,
      harga_final: item.pricing?.harga_final || 0,
    },
    stock: (item.stock > 0) ? "ada" : "habis",
  };
}

// ============================================================
//               ROUTE UTAMA AGGREGASI DATA
// ============================================================

app.get("/aggregate", async (req, res) => {
  try {
    // Ambil data dari tiga vendor secara paralel
    const [v1, v2, v3] = await Promise.all([
      axios.get(URL_VENDOR_A),
      axios.get(URL_VENDOR_B),
      axios.get(URL_VENDOR_C),
    ]);

    // Pastikan respons berisi array
    const vendorAArray = Array.isArray(v1.data) ? v1.data : [];
    const vendorBArray = Array.isArray(v2.data) ? v2.data : [];
    const vendorCArray = v3.data.data && Array.isArray(v3.data.data)
      ? v3.data.data
      : Array.isArray(v3.data) ? v3.data : [];

    // Normalisasi data
    const vendorAData = vendorAArray.map(normalizeVendorA).filter(Boolean);
    const vendorBData = vendorBArray.map(normalizeVendorB).filter(Boolean);
    const vendorCData = vendorCArray.map(normalizeVendorC).filter(Boolean);

    // Gabungkan semua data
    const finalOutput = [
      ...vendorAData,
      ...vendorBData,
      ...vendorCData
    ];

    res.json({
      success: true,
      total: finalOutput.length,
      data: finalOutput
    });

  } catch (err) {
    console.error("ERROR AGGREGATOR:", err);
    res.status(500).json({
      success: false,
      error: "Gagal mengambil atau menggabungkan data vendor",
      details: err.message
    });
  }
});

// ============================================================
//                    JALANKAN SERVER
// ============================================================

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Integrator berjalan di http://localhost:${PORT}/aggregate`);
});