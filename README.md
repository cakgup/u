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


## Endpoint API yang sudah diset

Frontend pada paket ini sudah disesuaikan dengan endpoint Google Apps Script berikut:

```text
https://script.google.com/macros/s/AKfycbybAACwBMZeiOERkFpZruMwgVWpmB45ddToZMScbGOPOJY2DRS0cfdBLJtHgaDnxxDzjw/exec
```

```javascript
API_BASE_URL: "https://script.google.com/macros/s/AKfycbybAACwBMZeiOERkFpZruMwgVWpmB45ddToZMScbGOPOJY2DRS0cfdBLJtHgaDnxxDzjw/exec"
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
API_BASE_URL: "https://script.google.com/macros/s/AKfycbybAACwBMZeiOERkFpZruMwgVWpmB45ddToZMScbGOPOJY2DRS0cfdBLJtHgaDnxxDzjw/exec"
```

menjadi URL Web App Google Apps Script, contoh:

```javascript
API_BASE_URL: "https://script.google.com/macros/s/AKfycbybAACwBMZeiOERkFpZruMwgVWpmB45ddToZMScbGOPOJY2DRS0cfdBLJtHgaDnxxDzjw/exec"
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


## Validasi Cepat

Setelah repository `u` ter-publish di GitHub Pages, buka halaman berikut untuk mengecek koneksi API dari browser:

```text
https://cakgup.github.io/u/diagnostics
```

Halaman tersebut menjalankan pengecekan ringan ke endpoint `ping` dan `getMicrosite` untuk username default `yimg`.

Endpoint yang diuji:

```text
https://script.google.com/macros/s/AKfycbybAACwBMZeiOERkFpZruMwgVWpmB45ddToZMScbGOPOJY2DRS0cfdBLJtHgaDnxxDzjw/exec?action=ping
https://script.google.com/macros/s/AKfycbybAACwBMZeiOERkFpZruMwgVWpmB45ddToZMScbGOPOJY2DRS0cfdBLJtHgaDnxxDzjw/exec?action=getMicrosite&username=yimg
```

## Optimasi Ringan

- Font eksternal dihilangkan agar halaman tidak bergantung pada Google Fonts.
- Logo dioptimalkan agar ukuran aset lebih kecil.
- Audio `nasyid.mp3` memakai `preload=none`, sehingga tidak dimuat otomatis saat halaman dibuka.
- Frontend hanya memanggil satu request utama untuk memuat data microsite publik.
- Jika data default belum tersedia di API, halaman utama tetap dapat tampil dengan fallback lokal agar mudah diakses.

## Update Visual v2

Perubahan terbaru:

- Backsound nasyid diupayakan otomatis berjalan saat halaman publik dibuka.
- Karena kebijakan browser modern dapat memblokir autoplay audio bersuara, sistem juga menyiapkan fallback: audio akan mulai setelah interaksi pertama pengguna seperti klik, sentuh, tekan tombol, atau scroll.
- Tombol audio dibuat lebih kecil dan hanya menggunakan ikon melodi tanpa teks.
- Ditambahkan efek salju ringan berbasis CSS/JavaScript.
- Logo utama diberi animasi zoom in/zoom out looping agar menyatu dengan background.
- Layout publik diperindah dengan ornamen Turki Islami dan aksen warna Palestina, dengan prioritas tampilan portrait 1080 x 1920.
