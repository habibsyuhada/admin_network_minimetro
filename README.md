# NOC Flow

Game strategi jaringan mobile/PWA. Setiap kabel menghubungkan tepat dua perangkat dan mempunyai satu pengangkut yang bolak-balik khusus pada kabel itu. Pemain membangun jaringan bercabang, sementara paket memilih rute menuju satu node tertentu secara otomatis. Ikon paket menunjukkan jenis perangkat tujuan, sedangkan nomor node menentukan penerimanya.

## Bermain

- Pilih jenis kabel, lalu tarik dari perangkat A ke B. Alternatif tap/keyboard: pilih sumber lalu tujuan. Setelah kabel dibuat, pemilihan selesai; node ketiga memulai sambungan baru.
- Warna menunjukkan jenis kabel, bukan nomor rute. Jenis yang sama boleh dipakai pada banyak sambungan. Satu pasangan perangkat dapat memiliki kabel paralel dengan jenis berbeda; duplikat pasangan dan jenis yang sama ditolak.
- Pengangkut mengambil paket di ujung kabel setelah jeda bongkar-muat 0,4 detik. Paket menunggu jika kapasitas penuh atau pengangkut belum datang. Muatan/kapasitas ditampilkan di pengangkut.
- Paket transit turun di perangkat perantara dan menunggu pengangkut kabel selanjutnya. Kabel dua arah memakai pengangkut yang sama, bukan perjalanan paket mandiri.
- Routing otomatis memperhitungkan jarak, kecepatan kabel, dan banyaknya muatan yang mengantre dibandingkan kapasitas. Rute dihitung lagi saat pemuatan; tujuan adalah node persis yang ditetapkan saat paket muncul. Node lain dengan ikon sama hanya menjadi tempat transit.

| Jenis | Warna | Kapasitas awal | Kecepatan relatif | Biaya stok |
|---|---|---:|---|---:|
| Ethernet | Toska | 4 paket | Seimbang | 1 |
| Fiber | Oranye | 3 paket | Cepat | 2 |
| Backbone | Ungu | 8 paket | Lambat | 2 |

Stok awal 6. Tiap menit mendapat 2 stok, lalu satu bonus: tambahan 4 stok, +2 kapasitas semua pengangkut, atau peningkatan kecepatan. Perangkat baru muncul setiap 35 detik, hingga 12 perangkat. Antrean minimal 8 paket selama 20 detik mengakhiri permainan.

**Kelola kabel** menghapus satu sambungan tanpa mengubah sambungan lainnya. Biaya stok dikembalikan seluruhnya; muatan yang sedang bergerak dikembalikan ke perangkat keberangkatannya.

**Detail node** menampilkan daftar perangkat dan antrean yang dikelompokkan berdasarkan tujuan, termasuk jumlah paket, kabel berikutnya, dan tujuan yang belum terhubung. Pilih node di peta lalu buka Detail untuk langsung memeriksanya, atau buka Detail node untuk daftar semua perangkat. Simulasi dijeda selama panel terbuka.

## Peta dan penyimpanan

Panel kontrol diringkas agar peta mendapat lebih banyak ruang pada HP; layar lebar memakai panel kontrol di samping. Geser area kosong untuk memindahkan peta. Pinch dua jari, roda mouse, atau tombol − / + mengatur zoom 65–300%. Persentase zoom mereset tampilan. Kamera dibatasi area 400 × 600; peta tetap di tengah jika lebih kecil daripada viewport. Sentuhan kedua membatalkan pembuatan kabel dan memulai pinch. Kabel paralel memiliki lajur terpisah dan paket mengikuti lajurnya.

Game dijeda saat masuk latar belakang. Sesi aktif belum disimpan setelah reload; rekor paket dan suara tersimpan saat kembali ke menu. Mode shift lama telah dihapus; data browser lamanya tidak diubah.

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

Build tersedia di `dist/`. Base relatif mendukung subpath GitHub Pages. PWA offline membutuhkan kunjungan online pertama. Ini belum APK/IPA.

`src/game/metro.ts` menyimpan simulasi dan routing; `src/MetroGame.tsx` menangani permainan; `src/game/mapView.ts` mengatur batas kamera dan lajur kabel; `src/NetworkArt.tsx` menyediakan ikon perangkat. Uji otomatis meliputi muatan per jenis kabel, antrean transit, routing alternatif, perjalanan dua arah, konservasi paket saat kabel dihapus, ekonomi stok, input, pinch, layout dan offline. Verifikasi perangkat iPhone fisik tetap diperlukan.
