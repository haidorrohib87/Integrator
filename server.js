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


// === Sesuaikan URL dengan server mahasiswa masing-masing ===
const URL_VENDOR_A = "https://vendor-a-intero.vercel.app/api/vendor-a/products";
const URL_VENDOR_B = "https://vendorb-prod.vercel.app/vendor-b/fashion";
const URL_VENDOR_C = "https://vendor-c-intero.vercel.app/products";

// ============================================================
//                 FUNGSI NORMALISASI DATA
// ============================================================

// --- Normalisasi Vendor A (Mahasiswa 1) ---
function normalizeVendorA(item) {
  const harga = parseInt(item.hrg); // string → integer

  // diskon 10%
  const diskon = harga * 0.10;
  const harga_final = harga - diskon;

  return {
        vendor: "Vendor A (Warung Klontong)",
        kd_produk: p.kd_produk,
        nm_brg: p.nm_brg,
        hrg: hargaAsli,
        diskon: "10%",
        harga_diskon: hargaFinal,
        ket_stok: p.ket_stok
    };
}

// --- Normalisasi Vendor B (Mahasiswa 2) ---
function normalizeVendorB(item) {
  return {
    vendor: "Vendor B (Distro Fashion)",
    sku: p.sku,
    productName: p.productName,
    price: p.price,
    isAvailable: p.isAvailable,
  };
}

// --- Normalisasi Vendor C (Mahasiswa 3) ---
function normalizeVendorC(item) {
  let finalName = item.details.name;

  // Tambahkan label Recommended jika Food
  if (item.details.category === "Food") {
    finalName += " (Recommended)";
  }

 return {
        vendor: "Vendor C (Resto dan Kuliner)",
        id: p.id,
        details: {
            name: nama,
            category: p.category,
        },
        pricing: {
           base_price: p.base_price,
           tax: p.tax,
           harga_final: p.harga_final,
        },     
        stock: p.stock > 0 ? "ada" : "habis",
    };
}

// ============================================================
//               ROUTE UTAMA AGGREGASI DATA
// ============================================================

app.get("/aggregate", async (req, res) => {
  try {
    // --- Ambil data dari tiga vendor ---
    const [v1, v2, v3] = await Promise.all([
      axios.get(URL_VENDOR_A),
      axios.get(URL_VENDOR_B),
      axios.get(URL_VENDOR_C),
    ]);

    const vendorAData = v1.data.map(normalizeVendorA);
    const vendorBData = v2.data.map(normalizeVendorB);
    const vendorCData = v3.data.data
      ? v3.data.data.map(normalizeVendorC)
      : v3.data.map(normalizeVendorC);

    // Gabungkan semua menjadi satu format seragam
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
    console.error("ERROR AGGREGATOR:", err.message);
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
