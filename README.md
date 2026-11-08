# Peta Karbon Zakat Hijau — Prototipe

Prototipe platform untuk usulan riset **"Pengukuran, Pemetaan, dan Optimasi Alokasi Zakat Hijau Rendah Karbon: Pendekatan Data-Driven untuk Kebijakan Zakat Berbasis Bukti melalui Platform Digital"** (RCC, Beasiswa Riset BAZNAS 2026, Klaster C.4).

> Seluruh data di prototipe ini adalah **data ilustrasi (simulasi)**, bukan data resmi BAZNAS.

## Fitur
- **Ringkasan**: KPI total dana, emisi dicegah (tCO₂e), program, penerima manfaat, biaya per tCO₂e, serta grafik per aspek dan per provinsi.
- **Peta**: sebaran program Zakat Hijau di 34 provinsi (Leaflet + OpenStreetMap), filter per aspek, tahun, dan pelaksana, plus rekap per provinsi.
- **Portofolio Alokasi**: optimasi alokasi dana per aspek (bobot emisi vs kesejahteraan, penalti risiko, batas min/maks, hak amil), perbandingan dengan komposisi saat ini, dan Pareto front.
- **Data Program**: tabel yang bisa dicari dan diurutkan, serta ekspor CSV.
- **Metodologi**: rumus estimasi emisi dan model optimasi.

## Struktur
```
public/
  index.html
  favicon.svg
  assets/
    style.css      # tema warna hijau–merah
    app.js         # logika peta, grafik, optimasi
    data.js        # 9 aspek Green Zakat Framework + data simulasi (ganti dengan data riset)
    vendor/        # Leaflet & Chart.js (lokal, tanpa CDN)
vercel.json
```
Situs ini statis, tanpa proses build.

## Deploy ke Vercel

**Opsi A — lewat GitHub (disarankan)**
1. Buat repository baru di GitHub, lalu unggah seluruh isi folder ini.
2. Masuk ke https://vercel.com → **Add New… → Project** → pilih repository tersebut.
3. Framework Preset: **Other**. Build Command: kosongkan. Output Directory: `public`.
4. Klik **Deploy**. Situs akan tersedia di `https://<nama-proyek>.vercel.app`.

**Opsi B — lewat Vercel CLI**
```bash
npm i -g vercel
cd zakathijau
vercel          # login dan jawab pertanyaan; terima output directory "public"
vercel --prod   # rilis ke domain produksi *.vercel.app
```

**Opsi C — tanpa terminal**: di dashboard Vercel, buat proyek baru lalu seret (drag and drop) folder ini.

## Menjalankan secara lokal
```bash
cd public
python3 -m http.server 8000
# buka http://localhost:8000
```

## Mengganti data ilustrasi dengan data riset
Edit `public/assets/data.js`:
- `ASPEK`: faktor emisi (`ef`), biaya per unit (`rpPerUnit`), dan skor risiko per aspek.
- `PROGRAMS`: ganti generator simulasi dengan array data program nyata dengan field
  `id, nama, aspek, provinsi, lat, lng, tahun, pelaksana, dana, qty, unit, tco2e, mustahik, ikb, status`.
