# ⚡ Hotaru Live — Interactive Streamer Queue & Request Hub

Aplikasi dasbor antrean live-streaming real-time untuk Streamer & Cosplayer. Mendukung pengelolaan antrean lagu (terintegrasi YouTube Auto-Player), Fansign, PAP (Pose Foto), dan Cosplay, dengan antarmuka Neobrutalisme modern dan dukungan OBS Overlay transparan.

---

## 🚀 Fitur Utama
- **Antrean Multi-Kategori**: Tab terpisah untuk Lagu, Fansign, PAP, dan Cosplay.
- **Fast Track Queue**: Jalur prioritas otomatis untuk donor sultan/paus (urutan berbasis waktu masuk).
- **OBS Overlay Real-Time**: Halaman overlay transparan (`/overlay`) siap pasang di OBS Browser Source.
- **Autosave Penonton Baru**: Pencarian live dan penyimpanan otomatis database penonton.
- **Filter Tanggal & Riwayat**: Antrean lagu khusus hari ini, dan tab riwayat data tersimpan dikelompokkan per tanggal.
- **Host & Mod Dashboard**: Halaman Host (`/ota`) dan Moderator ber-PIN (`/mod`).

---

## 🛠️ Menjalankan di Lokal (Development)

1. Jalankan development server:
   ```bash
   yarn dev
   # Server berjalan di http://localhost:3030
   ```
2. Buka browser:
   - **Antrean Publik**: [http://localhost:3030](http://localhost:3030)
   - **Dasbor Host**: [http://localhost:3030/ota](http://localhost:3030/ota)
   - **Dasbor Moderator**: [http://localhost:3030/mod](http://localhost:3030/mod) (PIN Default: `8888`)
   - **OBS Overlay**: [http://localhost:3030/overlay](http://localhost:3030/overlay)

---

## ☁️ Panduan Deploy & CI/CD ke Cloudflare D1

Panduan lengkap mengenai:
- Setup Git Repository (GitHub)
- Setup Database Cloudflare D1 (SQLite)
- Konfigurasi CI/CD Otomatis via Cloudflare Pages
- Keamanan credential database ID

👉 **Baca panduan lengkapnya di [DEPLOYMENT.md](./DEPLOYMENT.md)**.
