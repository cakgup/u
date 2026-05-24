# CakGup Microsite - Yayasan Indonesia Maju Gemilang

Microsite statis berbasis GitHub Pages untuk Yayasan Indonesia Maju Gemilang, dengan backend Google Apps Script `doGet` dan `doPost` serta database Google Sheets.

## Fitur Utama

- Halaman publik microsite di `https://cakgup.github.io/u/`
- Halaman publik per username, contoh `https://cakgup.github.io/u/yimg`
- Dashboard admin di `https://cakgup.github.io/u/admin`
- Tema warna mengikuti logo Yayasan Indonesia Maju Gemilang: oranye, merah, dan ungu
- Ornamen dan script islami
- Backsound nasyid dengan tombol bulat Play/Stop di kanan bawah
- CRUD profil microsite
- CRUD tombol link
- Statistik klik sederhana
- Pencatatan klik ke Google Sheets

## Struktur Folder

```text
u/
├── index.html
├── 404.html
├── .nojekyll
├── assets/
│   ├── audio/
│   │   └── nasyid.mp3
│   ├── css/
│   │   └── style.css
│   ├── img/
│   │   └── logo-yimg.png
│   └── js/
│       ├── config.js
│       ├── api.js
│       ├── auth.js
│       ├── microsite.js
│       ├── admin.js
│       └── app.js
└── gas/
    └── Code.gs
```

## Setup GitHub Pages

1. Buat repository GitHub bernama `u` pada akun/organisasi `cakgup`.
2. Upload seluruh isi folder ini ke repository tersebut.
3. Aktifkan GitHub Pages:
   - Settings
   - Pages
   - Source: Deploy from a branch
   - Branch: `main`
   - Folder: `/root`
4. Setelah aktif, microsite dapat dibuka melalui:

```text
https://cakgup.github.io/u/
https://cakgup.github.io/u/yimg
https://cakgup.github.io/u/admin
```

## Setup Google Apps Script

1. Buat Google Spreadsheet baru untuk database microsite.
2. Buka `Extensions > Apps Script`.
3. Salin isi file berikut ke Apps Script:

```text
gas/Code.gs
```

4. Jalankan fungsi berikut dari Apps Script editor:

```text
testSetup
```

5. Jalankan juga data awal:

```text
testCreateDefaultMicrosite
testCreateDefaultLinks
```

6. Atur token admin dengan Script Properties:
   - Project Settings
   - Script Properties
   - Tambahkan property:

```text
CAKGUP_MICROSITE_API_TOKEN = token_rahasia_anda
```

Jika property ini belum diisi, fallback token sementara adalah:

```text
cakgup
```

## Deploy Web App Google Apps Script

1. Klik `Deploy > New deployment`.
2. Pilih type: `Web app`.
3. Execute as: `Me`.
4. Who has access: `Anyone`.
5. Klik Deploy.
6. Salin URL Web App yang berakhiran `/exec`.

## Konfigurasi Frontend

Buka file:

```text
assets/js/config.js
```

Ganti nilai berikut:

```javascript
API_BASE_URL: "PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE"
```

menjadi URL Web App Google Apps Script, contoh:

```javascript
API_BASE_URL: "https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxx/exec"
```

## Cara Menggunakan Admin

1. Buka:

```text
https://cakgup.github.io/u/admin
```

2. Masukkan token admin.
3. Kelola profil yayasan.
4. Kelola daftar link.
5. Klik `Simpan Profil` atau `Simpan Link`.
6. Buka halaman publik:

```text
https://cakgup.github.io/u/yimg
```

## Catatan Penting Audio

Browser modern biasanya memblokir audio autoplay. Karena itu backsound nasyid diputar setelah pengunjung menekan tombol bulat `Play` di pojok kanan bawah.

## Catatan Keamanan

- Jangan menulis token admin di `config.js`.
- Simpan token admin di Google Apps Script Properties.
- File frontend GitHub Pages bersifat publik.
- Aksi admin tetap divalidasi oleh Google Apps Script melalui token.
