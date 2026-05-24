# Catatan Optimasi v9

- Audio `nasyid.mp3` dikompres dari ±5,25 MB menjadi ±1,32 MB.
- Audio diubah dari `preload=auto` menjadi lazy-load `preload=none` agar tidak membebani awal halaman.
- Script admin (`auth.js` dan `admin.js`) tidak lagi dimuat di halaman publik; baru dimuat saat membuka `/admin`.
- Efek salju dikurangi jumlah elemennya agar lebih ringan di handphone.
- Backend GAS ditambah cache publik singkat untuk mempercepat akses link.
- Cache dibersihkan otomatis saat link ditambah, diubah, dinonaktifkan, diaktifkan, atau dihapus.
