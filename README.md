# NOC Shift — HQ District

Game strategi jaringan single-player untuk browser desktop dan mobile. Rilis v1 berisi satu map dengan shift 10 menit: tiga kantor, dua router, lonjakan traffic, dan gangguan jalur. Semua data permainan tinggal di perangkat; tidak ada akun, backend, analytics, atau leaderboard online.

## Menjalankan

Node.js 22 LTS dan npm:

```sh
npm ci
npm run dev
npm test
npm run check
npm run build
npx playwright install chromium webkit
npm run test:e2e
npm run preview
```

`npm run build` menghasilkan `dist/`. Browser test memakai production preview pada port 4173. `npm run format` merapikan source. Pengujian browser memerlukan runtime browser Playwright, bukan koneksi akun.

## Bermain

Buat jalur Kantor HQ → Router A → App Server dengan drag, atau pilih node → Sambungkan → tujuan. Keyboard: Tab memilih kontrol, Enter/Space mengaktifkan, Escape menutup detail atau membuka jeda. Detail node terus menjalankan simulasi; menu jeda menghentikannya. Semua biaya tampil sebelum tindakan.

| Tindakan | Kredit |
|---|---:|
| Budget awal | 1.000 |
| Buat koneksi | 40 |
| Lepas koneksi | +20 |
| Upgrade router 120 → 260 req/s | 260 |
| Perbaiki jalur A–Server | 120 |

| Waktu | Peristiwa |
|---|---|
| 00:00 | HQ aktif; persiapan awal 75 detik |
| 01:30 | Kantor Cabang dan Router B tersedia |
| 03:00 | Studio tersedia |
| 04:00 | Jam sibuk |
| 06:00 | Peringatan gangguan jalur |
| 06:30 | Jalur Router A–Server gagal |
| 08:00 | Lonjakan akhir |
| 10:00 | Evaluasi |

Kantor baru mendapat 30 detik persiapan. Setelah masa persiapan, kantor tidak terhubung, loss >8%, atau latency >250 ms selama 45 detik berturut-turut mengakhiri shift. Pemulihan mereset countdown. Kemenangan memerlukan uptime historis ≥90% dan 20 detik terakhir stabil: semua kantor terhubung, loss ≤1%, latency <50 ms.

Dua strategi yang diuji otomatis sampai selesai:

- **Kapasitas terpusat:** semua kantor melalui Router A, upgrade sebelum jam sibuk, perbaiki jalur setelah insiden.
- **Jalur cadangan:** Studio melalui Router B; hubungkan A–B dan upgrade kedua router sebelum insiden. Routing otomatis menghindari link rusak.

Routing memakai BFS dengan urutan node stabil; ia memilih jumlah hop paling sedikit, bukan jalur dengan kapasitas terbesar. Koneksi tambahan tidak otomatis membagi satu sumber ke dua jalur. Lepaskan koneksi yang tidak diinginkan untuk mengarahkan ulang traffic.

## Model simulasi

`src/game/map.ts` menyimpan konfigurasi satu map. `engine.ts` berisi fungsi murni untuk topologi, ekonomi, traffic, insiden, dan penilaian status. UI menggunakan fixed timestep 100 ms dengan accumulator. Saat background, simulasi berhenti dan pemain harus melanjutkan secara eksplisit. Stall lebih dari 500 ms dibatasi agar kembali dari jeda sistem tidak langsung menghabiskan toleransi.

Traffic berupa request aggregate, bukan paket protokol nyata. Office tidak boleh menjadi perantara. Seluruh router yang dilalui membatasi throughput; alokasi proporsional mempertahankan konservasi `served + dropped + queued = total`. Antrean per kantor maksimal 80 request; sumber terputus membuang antrean dan request baru. Estimasi latency mengikuti antrean sumber. Link tidak memiliki batas bandwidth terpisah. Ini model strategi sederhana, bukan emulator jaringan produksi.

Demand berubah ±4% berdasarkan seed tersimpan dan interval simulasi. Reload tidak mengubah urutan traffic. Uptime adalah rasio waktu keterjangkauan per kantor setelah grace period, terpisah dari loss. Skor = uptime × 40 + rasio served/total × 4.000 + budget × 2 − durasi kantor terputus setelah insiden × 5, dibulatkan dan dibatasi minimum nol. Hanya kemenangan memperbarui rekor terbaik.

## Penyimpanan dan migrasi

Autosave setiap sekitar satu detik, saat background, saat kembali ke menu, dan saat hasil muncul. Save v2 memvalidasi struktur, angka, topologi, fase, ekonomi, serta konservasi traffic; snapshot valid sebelumnya disimpan sebagai cadangan. Storage yang ditolak/kehabisan kuota menampilkan peringatan dan tetap mengizinkan permainan.

Tutorial v1 tidak setara dengan skenario 10 menit. Migrasi mempertahankan rekor lama secara terpisah, jumlah kemenangan, suara, dan raw save v1 yang tidak diubah; pemain diberi pemberitahuan untuk memulai HQ District. Shift lama tidak dikonversi menjadi posisi permainan baru yang menyesatkan. Data tetap bisa diakses melalui key `noc-shift-save-v1`; save aktif memakai `noc-shift-save-v2`.

Save bersifat lokal dan tidak anti-cheat. Membuka beberapa tab yang memainkan shift secara bersamaan tidak didukung: gunakan satu tab untuk bermain. Menghapus data situs menghapus progres.

## PWA / offline

Service worker hanya terdaftar pada production build. Instalasi pertama membutuhkan koneksi dan caching aset berhasil. Cache dipisahkan per scope dan versi konten; dokumen serta aset dipasangkan dengan build yang sama. Static cache mengabaikan variasi header Origin agar module-script hasil precache dapat dibaca offline. Tidak ada aktivasi paksa di tengah shift. Pembaruan menunggu semua tab versi lama ditutup; menu menampilkan pemberitahuan jika update menunggu.

GitHub Pages menggunakan base relatif, sehingga subpath repo didukung. Safari iPhone: Bagikan → Tambah ke Layar Utama. Browser dapat menghapus cache/storage; offline bukan jaminan penyimpanan permanen.

## Struktur dan pengujian

- `src/game/map.ts`, `engine.ts`: map dan simulasi murni.
- `src/game/storage.ts`: validasi save, cadangan, migrasi, skor.
- `src/App.tsx`: map SVG, input, fixed clock, HUD dan evaluasi.
- `src/GameShell.tsx`: menu, lifecycle, autosave, rekor dan instalasi.
- `src/Dialog.tsx`: native modal dengan fokus terkurung dan pemulihan fokus.
- `src/game/*.test.ts`: simulasi lengkap beberapa seed, batas router, konservasi, kegagalan/pemulihan, save/migrasi.
- `tests/game.spec.ts`: produksi desktop Chromium, Chromium mobile, dan WebKit: input, resume, hasil, kegagalan storage, layout, offline.
- `.github/workflows/pages.yml`: check, test, build, browser test pada PR; hanya main yang dipublikasikan.

Detail prosedur rilis dan pengujian perangkat nyata: [RELEASE.md](RELEASE.md). Tidak ada build Android/iOS native dalam lingkup v1; konfigurasi Capacitor lama tetap tersedia untuk pekerjaan lanjutan.
