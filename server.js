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

//Sesuaikan URL dengan server mahasiswa masing-masing
const URL_VENDOR_A = "https://vendor-a-intero.vercel.app/api/vendor-a/products";
const URL_VENDOR_B = "https://vendorb-prod.vercel.app/vendor-b/fashion";
const URL_VENDOR_C = "https://vendor-c-intero.vercel.app/products";

//FUNGSI NORMALISASI DATA
//Normalisasi Vendor A (Mahasiswa 1)
function normalizeVendorA(item) {
  const harga = parseInt(item.hrg);

  // diskon 10%
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

//Normalisasi Vendor B (Mahasiswa 2)
function normalizeVendorB(item) {
  return {
    vendor: "Vendor B (Distro Fashion)",
    sku: item.sku,
    productName: item.productName,
    price: item.price,
    isAvailable: item.isAvailable,
  };
}

// --- Normalisasi Vendor C (Mahasiswa 3) ---
function normalizeVendorC(item) {
  // Asumsi: item memiliki struktur seperti:
  // { id, details: { name, category }, pricing: { base_price, tax, harga_final }, stock }

  let finalName = item.details?.name || "Tidak diketahui";

  // Tambahkan label Recommended jika kategori Food
   if (item.category.toLowerCase() === "makanan") {
        nama = `${nama} (Recommended)`;
    }

  return {
    vendor: "Vendor C (Resto dan Kuliner)",
    id: item.id,
    details: {
      name: finalName,
      category: item.details?.category || "Unknown",
    },
    pricing: {
      base_price: item.pricing?.base_price || 0,
      tax: item.pricing?.tax || 0,
      harga_final: item.pricing?.harga_final || 0,
    },
    stock: (item.stock > 0) ? "ada" : "habis",
  };
}


//ROUTE UTAMA AGGREGASI DATA
app.get("/aggregate", async (req, res) => {
  try {
    // Ambil data dari tiga vendor
    const [v1, v2, v3] = await Promise.all([
      axios.get(URL_VENDOR_A),
      axios.get(URL_VENDOR_B),
      axios.get(URL_VENDOR_C),
    ]);

    // Normalisasi data
    const vendorAData = v1.data.map(normalizeVendorA);
    const vendorBData = v2.data.map(normalizeVendorB);

    // Vendor C: pastikan struktur datanya benar
    const vendorCRaw = v3.data.data ? v3.data.data : v3.data;
    const vendorCData = vendorCRaw.map(normalizeVendorC);

    // Gabungkan semua menjadi satu format seragam
    const finalOutput = [
      ...vendorAData,
      ...vendorBData,
      ...vendorCData
    ].filter(Boolean);

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


const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Integrator berjalan di http://localhost:${PORT}/aggregate`);
});