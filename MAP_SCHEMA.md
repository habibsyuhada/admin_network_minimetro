# Skema level dan map NOC Flow

Campaign berisi enam misi berurutan. Setiap misi memakai dunia 1.000 x 1.200, tetapi area kemunculan node dan tekanan trafik berbeda. Pemain boleh membangun router/switch di seluruh peta. Distrik dan laut adalah penanda visual; tidak menghalangi kabel.

| Level | Map | Bentuk area spawn | Minimal bulan | Target paket | Modal gold |
|---|---|---|---:|---:|---:|
| 1 | Kampung Digital | Satu distrik dekat | 3 | 60 | 1.800 |
| 2 | Kampus Terhubung | Dua kelompok diagonal | 4 | 120 | 1.700 |
| 3 | Pelabuhan Data | Dua sisi memanjang | 6 | 250 | 1.900 |
| 4 | Pusat Kota | Empat distrik | 8 | 450 | 1.600 |
| 5 | Bukit Sinyal | Tiga kelompok diagonal | 10 | 700 | 1.800 |
| 6 | Metro Network | Seluruh area | 12 | 1.100 | 1.600 |

## Menang, bintang, dan progres

Kemenangan diperiksa pada akhir bulan sesudah tagihan maintenance. Pemain harus mencapai kedua target: bulan dan paket. Jika jumlah paket belum cukup, permainan berlanjut ke bulan berikutnya. Bangkrut atau overload tetap menyebabkan kalah.

- Satu bintang karena menyelesaikan misi.
- Satu bintang tambahan jika paket mencapai 125% target.
- Satu bintang tambahan jika saldo akhir minimal 50% modal awal.

Selesai satu misi membuka misi berikutnya. Hasil terbaik dipertahankan saat mengulang. Progres tersimpan di perangkat bersama pengaturan suara dan rekor; sesi yang sedang berjalan belum disimpan. Mode Bebas tetap tersedia tanpa kunci atau target kemenangan.

## Konfigurasi

Sumber definisi: `src/game/levels.ts`. Setiap objek `Level` berisi:

| Field | Arti |
|---|---|
| id | Identitas tetap untuk penyimpanan progres |
| name, subtitle, description, color | Identitas tampilan |
| seed | Benih acak tetap agar level bisa diulang |
| months, packets | Dua syarat minimum kemenangan |
| gold | Modal awal |
| spawnEvery | Detik simulasi antar gelombang |
| traffic | Pengali peluang pembuatan paket |
| maxNodes | Batas node otomatis; tidak termasuk router/switch pemain |
| zones | Persegi panjang area spawn (x, y, width, height) |
| start | Node awal, bentuk layanan/jenis client, dan posisi |

Gelombang client tetap bisa berisi beberapa node yang berdekatan. Node layanan/client tetap satu port. Mekanik routing, pengangkut per kabel, biaya dan maintenance mengikuti mode bebas.

Untuk menambah level, tambahkan definisi dan posisi pulaunya di `src/CampaignMap.tsx`, lalu sesuaikan jumlah level/bintang pada menu. ID level yang sudah dirilis harus dipertahankan agar progres lama tetap terbaca.

## Validasi

Simulasi adaptif keenam level tersimpan di `docs/balance/campaign-results.json`. Replay melalui tombol, drag kabel, dan jam browser menyelesaikan level pertama dalam 3 bulan dengan 66 paket dan 1.490 gold. Setelah kembali dan reload, level kedua berhasil terbuka. Hasil replay: `docs/balance/campaign-browser.json`.

Target belum dianggap sebagai keseimbangan final untuk semua gaya bermain. Pengujian ini memastikan konfigurasi dapat diselesaikan, dengan misi akhir membutuhkan jaringan lebih besar.
