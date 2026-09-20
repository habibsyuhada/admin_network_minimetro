# Uji keseimbangan NOC Flow: 12 bulan

Aturan sebelumnya terlalu menekan di awal dan terlalu murah di akhir untuk jaringan yang sudah lancar. Perubahan ini membuat pertumbuhan lebih bertahap tanpa menjamin pemain selalu lolos.

## Metode

Satu bulan = 60 detik simulasi. Dua strategi diuji melalui mesin game yang sama, dengan seluruh biaya, port, antrean, overload, dan pergantian bulan tetap berlaku. Strategi hemat memperluas jaringan dengan Ethernet tanpa upgrade. Strategi adaptif memakai kabel sesuai jarak, mengganti kabel yang padat, dan membeli upgrade bulanan sambil menyisihkan dana ekspansi. Keputusan hanya memakai kondisi jaringan saat itu; tidak membaca node masa depan. Penyuntingan dianggap dilakukan saat jeda, sebagaimana di UI.

Lima seed dipakai untuk membandingkan sebelum/sesudah. Lima belas seed tambahan dipakai sebagai validasi setelah memilih aturan final. Angka berikut adalah hasil strategi otomatis, bukan estimasi persentase kemenangan pemain manusia. Strategi ini belum memanfaatkan semua kemungkinan, seperti topologi mesh dan optimasi switch.

| Kelompok | Hemat: selesai bulan 12 | Adaptif: selesai bulan 12 | Median bulan yang dicapai, hemat / adaptif |
|---|---:|---:|---:|
| Sebelum, 5 seed | 0/5 | 1/5 | 4 / 4 |
| Sesudah, 5 seed yang sama | 0/5 | 3/5 | 6 / 12 |
| Validasi, 15 seed tambahan | 0/15 | 10/15 | 7 / 12 |
| Total sesudah, 20 seed | 0/20 | 13/20 | 7 / 12 |

Sesudah perubahan, strategi adaptif masih dapat gagal di bulan 5-9 jika jalur utama menumpuk. Strategi hemat mencapai bulan 4-11. Saldo akhir median strategi adaptif yang selesai adalah 8.845 gold; satu sesi sukses sebelum perubahan menumpuk 52.894 gold. Distribusi sebelum/sesudah berbeda karena tidak semua sesi bertahan, sehingga ini bukan perbandingan sebab-akibat saldo dengan sampel yang setara.

## Penyesuaian yang dipilih

| Aturan | Sebelum | Sesudah |
|---|---:|---:|
| Modal awal | 1.000 | 1.600 gold |
| Profit/paket | 25 | 18 gold |
| Gelombang node | 35 detik | 45 detik |
| Peluang trafik tiap 3 detik/node | min(0,85; 0,4 + waktu/900) | min(0,65; 0,32 + waktu/2.400) |
| Ambang client/layanan | 8 | 10 paket |
| Ambang switch/router | 10 / 16 | 16 / 24 paket |
| Waktu antrean penuh sebelum gagal | 20 | 25 detik |
| Upgrade kapasitas | Tetap 300 | Mulai 300, naik 300 tiap pembelian |
| Upgrade kecepatan | Tetap 250 | Mulai 250, naik 225 tiap pembelian |

Upgrade jaringan juga menaikkan maintenance per kabel sebesar ceil(2 × bonus kapasitas + bonus kecepatan/10) gold/bulan. Tarif dasar kabel dan node tidak berubah. Modal tambahan membantu membangun jaringan awal, sementara profit dan biaya upgrade mengurangi penumpukan gold pada akhir permainan. Jual node mengikuti permintaan pengguna: 50%; kabel tetap 100%.

## Reproduksi dan bukti

- `node scripts/balance.mjs`: menjalankan lima seed dengan dua strategi melalui simulasi.
- `BALANCE_SEEDS`: daftar seed dipisahkan koma untuk batch tambahan.
- `node scripts/play-season.mjs`: memainkan seed 987 melalui browser lokal dengan klik/drag dan tombol ganti kabel, tanpa menyuntikkan state atau gold. Waktu dipercepat oleh jam pengujian, tetapi setiap tick game tetap dijalankan.
- Data ringkas tersimpan di `docs/balance/before.json`, `after.json`, dan `validation.json`.

Hasil ini mendukung ritme yang lebih ramah untuk awal permainan dan kebutuhan upgrade di pertengahan. Uji pemain manusia tetap diperlukan untuk menilai kenyamanan interaksi, strategi yang lebih kuat, dan kesulitan di atas bulan 12.

## Sesi melalui antarmuka browser

Sesi seed 987 diselesaikan sampai laporan **Bulan 12 selesai** dengan 55 tindakan yang memakai tombol/drag sebenarnya. Hasil: **1.322 paket terkirim, saldo 7.365 gold**. Pada bulan 6, profit 1.620 dikurangi maintenance 549 menghasilkan 1.071 gold bersih. Semua laporan bulanan tersimpan di `docs/balance/browser.json`.

Simulasi referensi dengan koordinat presisi menghasilkan 1.319 paket dan 7.311 gold. Selisih 3 paket dapat dipengaruhi pembulatan koordinat drag dan penjadwalan frame browser; tidak ada penambahan gold atau perubahan state langsung dalam sesi browser. Bukti berupa catatan hasil laporan, bukan screenshot sesi yang dipertahankan.
