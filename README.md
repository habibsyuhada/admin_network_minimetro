# NOC Flow

Game strategi jaringan mobile/PWA. Setiap kabel menghubungkan tepat dua perangkat dan mempunyai satu pengangkut yang bolak-balik khusus pada kabel itu. Pemain membangun jaringan bercabang, sementara paket memilih rute otomatis ke node mana pun dengan ikon layanan yang cocok. Node berikon sama boleh muncul berkali-kali.

## Bermain

- Pilih jenis kabel, lalu tarik dari perangkat A ke B. Kabel hanya dibuat lewat drag. Tap, klik, Enter, dan Spasi pada node membuka detail, tidak membuat kabel.
- Warna menunjukkan jenis kabel, bukan nomor rute. Jenis yang sama boleh dipakai pada banyak sambungan. Satu pasangan router/switch dapat memiliki beberapa kabel paralel, termasuk jenis dan warna yang sama. Setiap kabel mempunyai pengangkut, harga, maintenance, dan pemakaian port sendiri.
- Pengangkut mengambil paket di ujung kabel setelah jeda bongkar-muat 0,4 detik. Paket menunggu jika kapasitas penuh atau pengangkut belum datang. Muatan/kapasitas ditampilkan di pengangkut.
- Paket transit turun di perangkat perantara dan menunggu pengangkut kabel selanjutnya. Kabel dua arah memakai pengangkut yang sama, bukan perjalanan paket mandiri.
- Routing otomatis memperhitungkan jarak, kecepatan kabel, dan banyaknya muatan yang mengantre dibandingkan kapasitas. Rute dihitung lagi saat pemuatan; tujuan ditentukan oleh ikon layanan, bukan nomor node. Routing dapat memilih ulang node lain dengan ikon sama.

| Jenis | Warna | Kapasitas awal | Kecepatan relatif | Harga gold |
|---|---|---:|---|---:|
| Ethernet | Toska | 4 paket | Seimbang | 100 |
| Fiber | Oranye | 3 paket | Cepat | 200 |
| Backbone | Ungu | 8 paket | Lambat | 250 |

Modal awal 1.600 gold. Profit 18 gold per paket yang sampai ke tujuan akhir, dibayarkan setiap menit setelah dikurangi maintenance. Maintenance per bulan: Ethernet 20, Fiber 35, Backbone 40, router 30 dan switch 15 gold; dihitung per tick sesuai lama aktif, lalu dibulatkan ke atas satu gold saat settlement. Saldo negatif saat settlement mengakhiri sesi. Satu bulan berlangsung 60 detik simulasi. Upgrade bulanan opsional: +2 kapasitas mulai 300 gold (naik 300 setiap pembelian kapasitas) atau +15 kecepatan mulai 250 gold (naik 225 setiap pembelian kecepatan). Maintenance setiap kabel bertambah ceil(2 x bonus kapasitas + bonus kecepatan / 10) gold/bulan; biaya yang sudah berjalan tidak dihitung ulang. Gelombang perangkat muncul setiap 45 detik, maksimal 36 node otomatis. Ambang antrean PC/layanan 10, switch 16, router 24 paket; penuh selama 25 detik mengakhiri permainan.

**Kelola kabel** menghapus satu sambungan tanpa mengubah sambungan lainnya. Sebanyak 100% harga beli dikembalikan; maintenance yang sudah berjalan tetap ditagih; muatan yang sedang bergerak dikembalikan ke perangkat keberangkatannya.

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

PC menghasilkan permintaan berikon layanan aktif (YouTube, Facebook, TikTok, Instagram, WhatsApp, Netflix, Spotify). Layanan menghasilkan balasan sesuai jenis client aktif (misalnya laptop atau ponsel), yang hanya diterima client dengan ikon yang cocok. Jenis layanan aktif dipilih merata, sehingga duplikat node tidak memperbesar bobot jenis tersebut. Trafik masih simulasi sederhana, bukan pasangan request/response protokol nyata.

## Router buatan pemain

Tekan **Pasang router** untuk memunculkan pratinjau di tengah tampilan peta. Geser router ke posisi yang diinginkan, kemudian **OK** untuk membeli seharga 150 gold, atau **Cancel** untuk membatalkan tanpa biaya. Simulasi dijeda selama pratinjau, tetapi peta tetap bisa digeser dan di-zoom. Penempatan harus di dalam peta dan minimal 75 unit dari node lain. Hubungkan router memakai drag kabel seperti node lain. Router dan switch hanya menjadi titik transit, tidak menghasilkan paket dan bukan tujuan akhir. Antrean router mengikuti aturan overload yang sama.

Node aktif dan posisi router disimpan dalam state sesi, sehingga penambahan router tidak menggeser identitas tujuan paket atau mengganggu kemunculan PC/layanan. Tiga node awal kini berjarak sekitar 294, 291, dan 435 unit. Node otomatis selanjutnya memiliki variasi posisi dan menghindari tumpang tindih dengan node pemain.

## Variasi layanan, gelombang PC, dan switch

Setiap kemunculan memilih gelombang PC (50%) atau satu layanan (50%). Dalam gelombang PC, jumlahnya 1 (60%), 2 (30%), atau 3 (10%). Node layanan dipilih merata dari tujuh jenis, termasuk yang sudah ada. Client dalam satu gelombang ditempatkan 85-130 unit dari client pertama, dengan jarak minimal 75 unit satu sama lain. Kelompok baru tetap berjarak minimal 130 unit dari endpoint lama. Posisi acak menghindari node lain; bila area penuh, jumlah aktual dapat lebih kecil. Batas 36 hanya berlaku untuk node otomatis, bukan router/switch buatan pemain.

| Perangkat | Harga | Maintenance/bulan | Port kabel | Ambang antrean | Bongkar-muat |
|---|---:|---:|---:|---:|---:|
| Router | 150 | 30 | 8 | 24 | 0,4 detik |
| Switch | 80 | 15 | 4 | 16 | 0,2 detik saat tiba |

Client dan layanan (YouTube, Facebook, dan lainnya) hanya memiliki 1 port. Router tetap 8 port dan switch 4 port. Setiap kabel (termasuk kabel paralel) memakai satu port pada masing-masing ujung. Menghapus kabel membebaskan port. Keduanya memakai pratinjau geser dengan OK/Cancel dan bukan sumber atau tujuan paket.

## Pindah, jual, dan variasi client

Buka detail router/switch lalu pilih **Pindahkan**. Geser pratinjau, kemudian **OK** atau **Cancel**. Pemindahan gratis; kabel dan pengangkut mengikuti posisi baru tanpa kehilangan muatan. Label node tetap sama setelah node lain dijual.

**Jual node** meminta konfirmasi dan mengembalikan 50% harga node ditambah 100% harga kabel yang terhubung. Paket tersisa dipindahkan ke node lain tanpa dihitung sebagai pengiriman berhasil; maintenance yang sudah berjalan tetap ditagih. PC dan layanan otomatis tidak dapat dijual.

Client memiliki 16 variasi ikon: desktop, laptop, ponsel, tablet, konsol, Smart TV, printer, CCTV, jam pintar, speaker pintar, kios, headset VR, handheld, mini PC, workstation, dan terminal kasir. Variasi dipilih acak saat PC muncul, dan paket tujuan client mengikuti ikon masing-masing jenis perangkat. Galeri tersedia di Panduan.

## Jeda desain dan kecepatan

Tombol Jeda/Lanjut menghentikan atau menjalankan simulasi tanpa menutup peta. Saat dijeda, pemain tetap dapat membuat kabel, membeli/memindahkan/menjual router atau switch, dan memeriksa node. Pengangkut, antrean, kemunculan node, overload, serta maintenance tidak berkembang selama jeda. Tombol kecepatan berputar 1x, 2x, 3x untuk seluruh waktu simulasi. Menutup detail atau pratinjau tidak membatalkan jeda manual.

Detail node menampilkan kabel yang terhubung, perangkat di ujung lainnya, dan refund harga penuh. Tombol Hapus hanya menghapus kabel tersebut dan mengembalikan muatannya. Kegagalan koneksi menampilkan pesan error di dekat peta; port penuh menyebut nama node, kapasitas port, dan petunjuk membebaskan port melalui detail node.

## Mengganti tipe kabel

Detail node memperlihatkan ikon dan nama perangkat pada ujung kabel. Buka **Ganti tipe kabel**, lalu pilih jenis pengganti. Biaya adalah selisih harga kabel; pindah ke tipe lebih murah mengembalikan selisihnya. Sambungan, ID kabel, dan posisi pengangkut dipertahankan tanpa memerlukan port tambahan. Jika kapasitas baru lebih kecil, kelebihan muatan kembali ke antrean asal perjalanan. Maintenance berikutnya mengikuti tipe baru.

Jual router mengembalikan 75 gold, jual switch 40 gold. Kabel yang ikut dilepas tetap dikembalikan penuh. Lihat [laporan keseimbangan](BALANCE_REPORT.md) untuk hasil pengujian 12 bulan dan batas interpretasinya. Jalankan `node scripts/balance.mjs` untuk mengulang simulasi, atau `node scripts/play-season.mjs` saat server lokal aktif untuk memainkan strategi yang sama melalui browser.
