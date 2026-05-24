# CakGup Microsite - Yayasan Indonesia Maju Gemilang

Versi ini menyesuaikan tampilan dengan referensi visual bernuansa Islami, ornamen Turki, aksen tema Palestina, logo YIMG animasi zoom in/out, efek salju ringan, dan tombol nasyid kecil berupa ikon melodi.

## Struktur

```text
u/
├── index.html
├── 404.html
├── assets/
│   ├── css/style.css
│   ├── js/config.js
│   ├── js/api.js
│   ├── js/auth.js
│   ├── js/microsite.js
│   ├── js/admin.js
│   ├── js/app.js
│   ├── img/logo-yimg.png
│   └── audio/nasyid.mp3
└── gas/Code.gs
```

## URL

- Publik: `https://cakgup.github.io/u/`
- Alternatif: `https://cakgup.github.io/u/yimg`
- Admin: `https://cakgup.github.io/u/admin`
- Cek API: `https://cakgup.github.io/u/diagnostics`

## Backend GAS

`gas/Code.gs` sudah disederhanakan. Tidak ada log klik dan tidak ada update profil. API hanya menangani:

- `GET ?action=ping`
- `GET ?action=getMicrosite&username=yimg`
- `POST action=loginAdmin`
- `POST action=getMicrositeLinks`
- `POST action=saveMicrositeLink`
- `POST action=deleteMicrositeLink`

## Sheet

Hanya memakai sheet:

```text
microsite_links
```

Kolom:

```text
id, username, title, subtitle, url, icon, button_color, text_color, sort_order, is_active, created_at, updated_at
```

## Token

Simpan token di Apps Script Properties:

```text
CAKGUP_MICROSITE_API_TOKEN
```

Fallback sementara masih `cakgup`.


## Admin Dashboard

Halaman admin tersedia pada `/u/admin`. Password default admin adalah `cakgup`. Dashboard admin difokuskan untuk mengelola komponen link: menambah, mengubah, mengaktifkan/nonaktifkan, dan menghapus link.
