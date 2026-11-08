/* =========================================================================
   DATA ILUSTRASI — Prototipe Platform Zakat Hijau Rendah Karbon
   Semua angka di file ini adalah DATA SIMULASI untuk keperluan prototipe,
   bukan data resmi BAZNAS. Faktor emisi bersifat asumsi ilustratif dan
   harus diganti dengan faktor emisi resmi (IPCC / KLHK / ESDM) pada tahap riset.
   ========================================================================= */

// Sembilan aspek penyaluran Zakat Hijau (Green Zakat Framework, Bab 3.2.4)
// ef = faktor emisi ilustratif (tCO2e per unit aktivitas per tahun)
// rpPerUnit = biaya ilustratif per unit aktivitas
// risk = skor risiko program ilustratif (0-1)
window.ASPEK = [
  { id: "lingkungan", nama: "Perlindungan Lingkungan", warna: "#1E7B3C",
    contoh: ["Rehabilitasi Mangrove", "Penanaman Pohon Desa", "Hutan Zakat Komunitas"],
    unit: "pohon", ef: 0.022, rpPerUnit: 25000, risk: 0.35,
    catatanEf: "serapan karbon rata-rata per pohon per tahun" },
  { id: "energi", nama: "Energi Bersih", warna: "#E0A800",
    contoh: ["PLTS Atap Masjid", "PLTMH Desa", "Lampu Tenaga Surya Mustahik"],
    unit: "kWh/tahun", ef: 0.00087, rpPerUnit: 10700, risk: 0.45,
    catatanEf: "faktor emisi jaringan listrik yang digantikan" },
  { id: "sampah", nama: "Pengelolaan Sampah", warna: "#8D6E63",
    contoh: ["Bank Sampah Mustahik", "Komposter Komunal", "Budidaya Maggot BSF"],
    unit: "ton sampah/tahun", ef: 0.6, rpPerUnit: 400000, risk: 0.30,
    catatanEf: "emisi metana TPA yang dihindari per ton sampah" },
  { id: "air", nama: "Manajemen Air", warna: "#1E88E5",
    contoh: ["Sumur Bor Tenaga Surya", "Penampungan Air Hujan", "Irigasi Tetes Petani"],
    unit: "m³/tahun", ef: 0.00015, rpPerUnit: 500, risk: 0.25,
    catatanEf: "emisi pompa diesel yang digantikan per m³" },
  { id: "transportasi", nama: "Transportasi Berkelanjutan", warna: "#7E57C2",
    contoh: ["Motor Listrik Ojek Mustahik", "Becak Listrik", "Sepeda Kerja"],
    unit: "km/tahun", ef: 0.00011, rpPerUnit: 1333, risk: 0.50,
    catatanEf: "emisi kendaraan BBM yang digantikan per km" },
  { id: "infrastruktur", nama: "Infrastruktur Hijau", warna: "#00897B",
    contoh: ["Rumah Layak Huni Hemat Energi", "Biopori dan RTH", "Atap Hijau Sekolah"],
    unit: "unit", ef: 0.8, rpPerUnit: 15000000, risk: 0.30,
    catatanEf: "penghematan energi per unit bangunan per tahun" },
  { id: "pembangunan", nama: "Pembangunan Berkelanjutan", warna: "#7CB342",
    contoh: ["Pertanian Organik", "Biogas Ternak", "Lumbung Pangan Rendah Input"],
    unit: "ha", ef: 1.5, rpPerUnit: 8000000, risk: 0.40,
    catatanEf: "emisi pupuk kimia dan bahan bakar yang dihindari per ha" },
  { id: "sosial", nama: "Kesetaraan Sosial", warna: "#D81B60",
    contoh: ["Kompor Biomassa Efisien", "Alat Hemat Energi Rumah Tangga Lansia"],
    unit: "rumah tangga", ef: 0.3, rpPerUnit: 1500000, risk: 0.30,
    catatanEf: "penghematan bahan bakar rumah tangga per tahun" },
  { id: "lainnya", nama: "Aspek Hijau Lainnya", warna: "#78909C",
    contoh: ["Edukasi Iklim Majelis Taklim", "Masjid Ramah Lingkungan"],
    unit: "kegiatan", ef: 0.5, rpPerUnit: 20000000, risk: 0.35,
    catatanEf: "estimasi penghematan per kegiatan" },
];

window.PROVINSI = [
  ["Aceh", 4.70, 96.75], ["Sumatera Utara", 2.10, 99.50], ["Sumatera Barat", -0.74, 100.80],
  ["Riau", 0.29, 101.70], ["Kepulauan Riau", 0.95, 104.45], ["Jambi", -1.61, 103.60],
  ["Sumatera Selatan", -3.32, 104.00], ["Kepulauan Bangka Belitung", -2.74, 106.44],
  ["Bengkulu", -3.79, 102.26], ["Lampung", -4.56, 105.40], ["DKI Jakarta", -6.20, 106.85],
  ["Jawa Barat", -6.90, 107.60], ["Banten", -6.40, 106.10], ["Jawa Tengah", -7.15, 110.14],
  ["DI Yogyakarta", -7.80, 110.40], ["Jawa Timur", -7.54, 112.24], ["Bali", -8.41, 115.19],
  ["Nusa Tenggara Barat", -8.65, 117.36], ["Nusa Tenggara Timur", -8.66, 121.08],
  ["Kalimantan Barat", 0.13, 111.10], ["Kalimantan Tengah", -1.68, 113.38],
  ["Kalimantan Selatan", -3.09, 115.28], ["Kalimantan Timur", 0.54, 116.42],
  ["Kalimantan Utara", 3.07, 116.04], ["Sulawesi Utara", 1.00, 124.50], ["Gorontalo", 0.70, 122.45],
  ["Sulawesi Tengah", -1.43, 121.45], ["Sulawesi Barat", -2.84, 119.23],
  ["Sulawesi Selatan", -3.67, 119.97], ["Sulawesi Tenggara", -4.14, 122.17],
  ["Maluku", -3.24, 129.49], ["Maluku Utara", 1.57, 127.81], ["Papua Barat", -1.34, 133.17],
  ["Papua", -4.27, 138.08],
].map(([nama, lat, lng]) => ({ nama, lat, lng }));

window.PELAKSANA = ["BAZNAS RI", "BAZNAS Provinsi", "BAZNAS Kab/Kota", "LAZ Mitra"];

// Generator data simulasi deterministik (seeded), agar tampilan konsisten
(function buildPrograms() {
  let seed = 20261108;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const between = (a, b) => a + (b - a) * rnd();
  // bobot frekuensi tiap aspek (program lingkungan & energi lebih banyak)
  const bobot = { lingkungan: 5, energi: 4, sampah: 4, air: 3, transportasi: 2, infrastruktur: 2, pembangunan: 4, sosial: 2, lainnya: 1 };
  const pool = [];
  ASPEK.forEach((a) => { for (let i = 0; i < bobot[a.id]; i++) pool.push(a); });

  const programs = [];
  const N = 180;
  for (let i = 0; i < N; i++) {
    const a = pick(pool);
    const p = pick(PROVINSI);
    // dana lognormal ~ Rp50 juta – Rp2 miliar
    const dana = Math.round(Math.exp(between(Math.log(5e7), Math.log(2e9))) / 1e6) * 1e6;
    const efisiensi = between(0.75, 1.25);
    const qty = Math.round((dana / a.rpPerUnit) * efisiensi);
    const tco2e = +(qty * a.ef * between(0.8, 1.2)).toFixed(1);
    const mustahik = Math.max(10, Math.round(dana / between(2e6, 9e6)));
    const ikb = +between(0.45, 0.92).toFixed(2);
    programs.push({
      id: "ZH-" + String(i + 1).padStart(3, "0"),
      nama: `${pick(a.contoh)} ${p.nama}`,
      aspek: a.id,
      provinsi: p.nama,
      lat: +(p.lat + between(-0.9, 0.9)).toFixed(4),
      lng: +(p.lng + between(-1.1, 1.1)).toFixed(4),
      tahun: 2022 + Math.floor(rnd() * 5),
      pelaksana: pick(PELAKSANA),
      dana, qty, unit: a.unit, tco2e, mustahik, ikb,
      status: rnd() < 0.7 ? "Berjalan" : "Selesai",
    });
  }
  window.PROGRAMS = programs;
})();
