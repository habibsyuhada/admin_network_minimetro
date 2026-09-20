# NOC Flow

Game strategi jaringan mobile/PWA. Setiap kabel menghubungkan tepat dua perangkat dan mempunyai satu pengangkut yang bolak-balik khusus pada kabel itu. Pemain membangun jaringan bercabang, sementara paket memilih rute otomatis ke node mana pun dengan ikon layanan yang cocok. Node berikon sama boleh muncul berkali-kali.

## Bermain

- Pilih jenis kabel, lalu tarik dari perangkat A ke B. Kabel hanya dibuat lewat drag. Tap, klik, Enter, dan Spasi pada node membuka detail, tidak membuat kabel.
- Warna menunjukkan jenis kabel, bukan nomor rute. Jenis yang sama boleh dipakai pada banyak sambungan. Satu pasangan perangkat dapat memiliki kabel paralel dengan jenis berbeda; duplikat pasangan dan jenis yang sama ditolak.
- Pengangkut mengambil paket di ujung kabel setelah jeda bongkar-muat 0,4 detik. Paket menunggu jika kapasitas penuh atau pengangkut belum datang. Muatan/kapasitas ditampilkan di pengangkut.
- Paket transit turun di perangkat perantara dan menunggu pengangkut kabel selanjutnya. Kabel dua arah memakai pengangkut yang sama, bukan perjalanan paket mandiri.
- Routing otomatis memperhitungkan jarak, kecepatan kabel, dan banyaknya muatan yang mengantre dibandingkan kapasitas. Rute dihitung lagi saat pemuatan; tujuan ditentukan oleh ikon layanan, bukan nomor node. Routing dapat memilih ulang node lain dengan ikon sama.

| Jenis | Warna | Kapasitas awal | Kecepatan relatif | Harga gold |
|---|---|---:|---|---:|
| Ethernet | Toska | 4 paket | Seimbang | 100 |
| Fiber | Oranye | 3 paket | Cepat | 200 |
| Backbone | Ungu | 8 paket | Lambat | 250 |

Modal awal 1.000 gold. Profit 25 gold per paket yang sampai ke tujuan akhir, dibayarkan setiap menit setelah dikurangi maintenance. Maintenance per minggu: Ethernet 20, Fiber 35, Backbone 40, router 30 dan switch 15 gold; dihitung per tick sesuai lama aktif, lalu dibulatkan ke atas satu gold saat settlement. Saldo negatif saat settlement mengakhiri sesi. Upgrade mingguan opsional: +2 kapasitas seharga 300 gold atau kecepatan seharga 250 gold. Gelombang perangkat muncul setiap 35 detik, maksimal 36 node otomatis. Ambang antrean PC/layanan 8, switch 10, router 16 paket; penuh selama 20 detik mengakhiri permainan.

**Kelola kabel** menghapus satu sambungan tanpa mengubah sambungan lainnya. Sebanyak 50% harga beli dikembalikan; maintenance yang sudah berjalan tetap ditagih; muatan yang sedang bergerak dikembalikan ke perangkat keberangkatannya.

**Detail node** menampilkan daftar perangkat dan antrean yang dikelompokkan berdasarkan tujuan, termasuk jumlah paket, kabel berikutnya, dan tujuan yang belum terhubung. Klik node di peta untuk langsung memeriksanya, atau buka Detail node untuk daftar semua perangkat. Simulasi dijeda selama panel terbuka.

## Peta dan penyimpanan

Panel kontrol diringkas agar peta mendapat lebih banyak ruang pada HP; layar lebar memakai panel kontrol di samping. Geser area kosong untuk memindahkan peta. Pinch dua jari, roda mouse, atau tombol − / + mengatur zoom 40–300%. Persentase zoom kembali ke area awal, tombol Peta menampilkan seluruh area. Node baru tersebar ke wilayah lebih jauh tanpa mengecilkan kamera otomatis. Detail node menyediakan tombol Lihat node di peta. Kamera dibatasi area 1.000 × 1.200 (luas 5x peta awal); peta tetap di tengah jika lebih kecil daripada viewport. Sentuhan kedua membatalkan pembuatan kabel dan memulai pinch. Kabel paralel memiliki lajur terpisah dan paket mengikuti lajurnya.

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

`src/game/metro.ts` menyimpan simulasi dan routing; `src/MetroGame.tsx` menangani permainan; `src/game/mapView.ts` mengatur batas kamera dan lajur kabel; `src/NetworkArt.tsx` menyediakan ikon perangkat. Uji otomatis meliputi muatan per jenis kabel, antrean transit, routing alternatif, perjalanan dua arah, konservasi paket saat kabel dihapus, ekonomi gold, input, pinch, layout dan offline. Verifikasi perangkat iPhone fisik tetap diperlukan.

PC menghasilkan permintaan berikon layanan aktif (YouTube, Facebook, TikTok, Instagram, WhatsApp, Netflix, Spotify). Layanan menghasilkan balasan berikon PC yang dapat diterima PC mana pun. Jenis layanan aktif dipilih merata, sehingga duplikat node tidak memperbesar bobot jenis tersebut. Trafik masih simulasi sederhana, bukan pasangan request/response protokol nyata.

## Router buatan pemain

Tekan **Pasang router** untuk memunculkan pratinjau di tengah tampilan peta. Geser router ke posisi yang diinginkan, kemudian **OK** untuk membeli seharga 150 gold, atau **Cancel** untuk membatalkan tanpa biaya. Simulasi dijeda selama pratinjau, tetapi peta tetap bisa digeser dan di-zoom. Penempatan harus di dalam peta dan minimal 75 unit dari node lain. Hubungkan router memakai drag kabel seperti node lain. Router dan switch hanya menjadi titik transit, tidak menghasilkan paket dan bukan tujuan akhir. Antrean router mengikuti aturan overload yang sama.

Node aktif dan posisi router disimpan dalam state sesi, sehingga penambahan router tidak menggeser identitas tujuan paket atau mengganggu kemunculan PC/layanan. Tiga node awal kini berjarak sekitar 294, 291, dan 435 unit. Node otomatis selanjutnya memiliki variasi posisi dan menghindari tumpang tindih dengan node pemain.

## Variasi layanan, gelombang PC, dan switch

Setiap kemunculan memilih gelombang PC (50%) atau satu layanan (50%). Dalam gelombang PC, jumlahnya 1 (60%), 2 (30%), atau 3 (10%). Node layanan dipilih merata dari tujuh jenis, termasuk yang sudah ada. Posisi acak menghindari node lain; bila area penuh, jumlah aktual dapat lebih kecil. Batas 36 hanya berlaku untuk node otomatis, bukan router/switch buatan pemain.

| Perangkat | Harga | Maintenance/minggu | Port kabel | Ambang antrean | Bongkar-muat |
|---|---:|---:|---:|---:|---:|
| Router | 150 | 30 | 8 | 16 | 0,4 detik |
| Switch | 80 | 15 | 4 | 10 | 0,2 detik saat tiba |

Setiap kabel (termasuk kabel paralel) memakai satu port. Menghapus kabel membebaskan port. Keduanya memakai pratinjau geser dengan OK/Cancel dan bukan sumber atau tujuan paket.
