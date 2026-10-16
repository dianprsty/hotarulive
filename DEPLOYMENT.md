# 🚀 Panduan Setup Awal, Database D1, dan CI/CD Cloudflare — Hotaru Live

Dokumen ini memuat panduan lengkap dari awal untuk menghubungkan proyek **Hotaru Live** ke **GitHub**, menyiapkan database **Cloudflare D1 (SQLite Serverless)**, serta mengaktifkan pipeline **CI/CD otomatis** menggunakan **Cloudflare Pages**.

---

## 📑 Daftar Isi
1. [Arsitektur Sistem](#1-arsitektur-sistem)
2. [Prasyarat](#2-prasyarat)
3. [Langkah 1: Setup Git Repository & Keamanan](#langkah-1-setup-git-repository--keamanan)
4. [Langkah 2: Setup Database Cloudflare D1](#langkah-2-setup-database-cloudflare-d1)
5. [Langkah 3: Konfigurasi CI/CD di Cloudflare Pages](#langkah-3-konfigurasi-cicd-di-cloudflare-pages)
6. [Langkah 4: Alur Kerja Harian (Daily Workflow)](#langkah-4-alur-kerja-harian-daily-workflow)
7. [Tips Keamanan: Mencegah Database ID Terekspos](#tips-keamanan-mencegah-database-id-terekspos)
8. [Troubleshooting & FAQ](#troubleshooting--faq)

---

## 1. Arsitektur Sistem

```
┌─────────────────────────┐          ┌─────────────────────────┐          ┌─────────────────────────┐
│       Laptop Anda       │          │       GitHub Repo       │          │     Cloudflare Edge     │
│   (Local Development)   │          │  (Pemicu CI/CD Webhook) │          │     (Hosting & DB)      │
│                         │          │                         │          │                         │
│ • Local Store (.data/)  │ git push │ • Source code           │ webhook  │ • Cloudflare Pages      │
│ • Next.js Dev (port 3030│─────────►│ • Drizzle migrations    │─────────►│ • D1 Database (SQLite)  │
│ • OBS Overlay & Host UI │          │ • Safe .gitignore       │          │ • Zero-downtime deploy  │
└─────────────────────────┘          └─────────────────────────┘          └─────────────────────────┘
```

---

## 2. Prasyarat

Sebelum memulai, pastikan Anda telah menyiapkan:
1. **Node.js** versi 20 atau lebih baru.
2. **Akun GitHub**: [github.com](https://github.com)
3. **Akun Cloudflare**: [dash.cloudflare.com](https://dash.cloudflare.com) (Gratis)
4. **Wrangler CLI** (sudah terpasang di dependencies proyek ini).

---

## Langkah 1: Setup Git Repository & Keamanan

### 1.1. Pastikan Data Runtime Lokal Tidak Masuk ke Git
File `.data/store.json` adalah database cache saat development lokal dan sudah dimasukkan ke `.gitignore`:
```gitignore
# local persistent store (dev only)
/.data/
```

### 1.2. Inisialisasi dan Push ke GitHub
1. Buat repository baru di [github.com/new](https://github.com/new) dengan nama **`hotarulive`** (pilih *Private* atau *Public*).
2. Jalankan perintah berikut di terminal proyek:
```bash
# Tambahkan semua perubahan kode
git add .

# Buat commit pertama
git commit -m "feat: complete Hotaru Live application ready for Cloudflare"

# Pastikan nama branch utama adalah main
git branch -M main

# Hubungkan ke repository GitHub Anda (ganti URL di bawah)
git remote add origin https://github.com/USERNAME-ANDA/hotarulive.git

# Push kode ke GitHub
git push -u origin main
```

---

## Langkah 2: Setup Database Cloudflare D1

### 2.1. Login ke Cloudflare via Terminal
```bash
npx wrangler login
```
*Browser akan terbuka meminta konfirmasi otorisasi akun Cloudflare Anda.*

### 2.2. Buat Database D1
Jalankan perintah ini:
```bash
npx wrangler d1 create weblive-db
```
Terminal akan mencetak informasi seperti:
```text
✅ Successfully created DB 'weblive-db' with ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```
> [!NOTE]
> Simpan `database_id` ini di catatan sementara Anda untuk menjalankan migrasi lokal/remote.

### 2.3. Jalankan Migrasi Skema ke Database D1
Skema tabel `requests`, `viewers`, dan `settings` sudah tersedia di folder `drizzle/`. Eksekusi migrasi langsung ke cloud:

```bash
# Migrasi 1: Tabel requests & settings
npx wrangler d1 execute weblive-db --remote --file=./drizzle/0000_little_beast.sql

# Migrasi 2: Tabel viewers
npx wrangler d1 execute weblive-db --remote --file=./drizzle/0001_lame_ender_wiggin.sql
```
*Database D1 Anda sekarang sudah terisi skema tabel yang siap digunakan!*

---

## Langkah 3: Konfigurasi CI/CD di Cloudflare Pages

Ini adalah langkah inti agar **setiap `git push` otomatis langsung ter-deploy**:

1. Masuk ke dashboard [Cloudflare Pages](https://dash.cloudflare.com/).
2. Di menu navigasi samping, klik **Workers & Pages** ➜ **Create application** ➜ pilih tab **Pages**.
3. Klik tombol **Connect to Git**.
4. Beri akses ke akun GitHub Anda, lalu pilih repository **`hotarulive`**.
5. Isi konfigurasi build:
   - **Project name**: `hotarulive`
   - **Production branch**: `main`
   - **Framework preset**: `Next.js`
   - **Build command**: `npx @opennextjs/cloudflare build`
   - **Build output directory**: `.worker-next` *(atau sesuai petunjuk OpenNext)*
   - **Environment variables**:
     - Variable name: `NODE_VERSION`
     - Value: `20`
6. Klik **Save and Deploy**.

### 3.1. Hubungkan Database D1 ke Pages (Binding Tanpa Hardcode ID)
Agar aplikasi yang di-build dapat mengakses database D1 secara aman:
1. Di dashboard Cloudflare Pages project Anda, buka menu **Settings** ➜ **Functions**.
2. Scroll ke bagian **D1 Database Bindings** ➜ klik **Add binding**:
   - **Variable name**: `DB` *(harus huruf kapital sesuai kode schema `src/db/`)*
   - **D1 Database**: Pilih `weblive-db` dari dropdown menu.
3. Klik **Save**.
4. Lakukan re-deploy atau buat commit baru untuk mengaktifkan koneksi database.

---

## Langkah 4: Alur Kerja Harian (Daily Workflow)

Setelah konfigurasi di atas selesai, Anda **TIDAK PERLU** lagi deploy manual atau mengetik perintah rumit:

```bash
# 1. Edit kode / tambahkan fitur di laptop
# 2. Simpan dan commit perubahan
git add .
git commit -m "update: fitur baru atau perbaikan tampilan"

# 3. Kirim ke GitHub
git push origin main
```

**Apa yang terjadi setelah Anda `git push`?**
1. GitHub menerima commit dan mengirim webhook otomatis ke Cloudflare.
2. Cloudflare memicu worker cloud untuk mendownload dependencies dan mem-build Next.js.
3. Cloudflare menyambungkan database D1.
4. Versi baru langsung aktif di URL publik Anda (misal `https://hotarulive.pages.dev`) dalam waktu ~1 menit!

---

## Tips Keamanan: Mencegah Database ID Terekspos

Untuk menjaga agar `database_id` tidak pernah masuk ke repository GitHub:

1. **Gunakan Binding Dashboard**:
   Seperti yang dilakukan pada [Langkah 3.1](#31-hubungkan-database-d1-ke-pages-binding-tanpa-hardcode-id), database dikaitkan langsung lewat dashboard Cloudflare Pages, sehingga Anda **tidak perlu menuliskan ID database di dalam kode repo**.
2. **Gunakan Template untuk wrangler.toml**:
   Simpan contoh template di `wrangler.toml.example`:
   ```toml
   name = "hotarulive"
   compatibility_date = "2026-10-01"
   compatibility_flags = ["nodejs_compat"]

   [[d1_databases]]
   binding = "DB"
   database_name = "weblive-db"
   database_id = "YOUR_DATABASE_ID_HERE"
   ```
   Lalu tambahkan `wrangler.toml` ke `.gitignore` jika Anda ingin file konfigurasi lokal Anda tetap privat.

---

## Troubleshooting & FAQ

### Q1: Apakah data penonton dan antrean akan hilang saat deploy baru?
**Tidak.** Cloudflare D1 adalah database cloud terpisah yang persisten. Saat aplikasi di-deploy ulang, hanya bundle kode frontend/API yang diperbarui, sedangkan data di D1 tetap aman.

### Q2: Apa yang terjadi jika build di Cloudflare gagal karena typo?
Cloudflare menerapkan sistem **Atomic Zero-Downtime Deployment**:
- Jika build gagal, versi lama website Anda akan **tetap online tanpa gangguan**.
- Anda akan menerima laporan log error langsung di dashboard Cloudflare atau email untuk diperbaiki.

### Q3: Bagaimana cara melihat isi database D1 secara langsung?
Anda bisa melihat dan mengelola isi tabel secara visual langsung di dashboard Cloudflare:
- Buka **Storage & Databases** ➜ **D1 SQL Database** ➜ Pilih `weblive-db` ➜ Buka tab **Explore data** atau **Console** untuk menjalankan query SQL.
