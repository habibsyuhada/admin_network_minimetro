# NOC Flow

Game strategi jaringan untuk mobile browser/PWA. Satu menu game, satu mode endless: tarik kabel berwarna untuk menghubungkan client, server, dan database. Paket menuju jenis perangkat yang ditampilkan pada ikon antreannya, dengan transfer pada perangkat bersama.

## Bermain

- Tekan **Mulai bermain**; pilih jalur lalu sentuh perangkat secara berurutan, atau tarik dari perangkat awal ke tujuan. Perpanjang dari ujung jalur.
- Tiga jalur awal, masing-masing memiliki satu batch bergerak dengan kapasitas empat paket. Maksimal lima jalur.
- Perangkat baru setiap 35 detik, hingga 12 perangkat. Pilih peningkatan setiap satu menit.
- Antrean delapan paket memicu hitung mundur 20 detik. Kurangi antrean sebelum jaringan kewalahan.
- Atur ulang jalur untuk menggambar rute baru; paket dikembalikan ke perangkat terakhir.
- Permainan dijeda ketika aplikasi masuk latar belakang. Sesi aktif belum disimpan setelah reload. Rekor paket dan pengaturan suara disimpan saat kembali ke menu.

Mode shift 10 menit dan halaman lamanya sudah dihapus. Data browser dari versi lama tidak dihapus, namun tidak dipakai oleh NOC Flow.

## Menjalankan dan menguji

Node.js 22 dan npm:

```sh
npm ci
npm run dev
npm test
npm run check
npm run build
npx playwright install chromium webkit
npm run test:e2e
```

Build tersedia di `dist/`; base relatif mendukung subpath GitHub Pages. PWA memerlukan kunjungan online pertama untuk menyimpan aset. Android: pasang melalui menu browser; iPhone: Safari → Bagikan → Tambah ke Layar Utama. Ini belum merupakan APK/IPA.

`src/game/metro.ts` menyimpan simulasi murni. `src/MetroGame.tsx` menangani kontrol dan permainan; `src/NetworkArt.tsx` menyediakan ikon perangkat; `src/GameShell.tsx` adalah menu mobile. Tes mencakup transfer, konservasi paket, antrean, upgrade, kontrol, preferensi, layout dan pembaruan offline. Pengujian iPhone fisik tetap diperlukan; WebKit Windows mempunyai perbedaan visual/layout viewport bawaan.
