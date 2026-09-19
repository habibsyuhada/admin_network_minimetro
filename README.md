# NOC Shift

Game mobile web Level 1, **First Day at NOC**. React + TypeScript + Vite; SVG untuk peta dan packet. Semua berjalan lokal tanpa backend atau layanan akun.

## Run / build

Gunakan Node.js 22 LTS dan npm.

```sh
npm install
npm run dev
npm test
npm run build
npm run preview
```

Vite menampilkan alamat lokal. Untuk mencoba di HP, gunakan alamat LAN komputer pada jaringan yang sama. Production build ada di `dist/`.

## Bermain

1. Drag Office HQ ke Router-A. Koneksi hanya dibuat dengan drag.
2. Hubungkan Router-A ke App Server. Packet mulai bergerak.
3. Setelah 25 detik, Branch Office muncul. Hubungkan ke router atau HQ.
4. Setelah 20 detik traffic normal, Morning Login Rush menaikkan demand menjadi 160 req/s. Kapasitas router awal 100 req/s.
5. Tap Router-A dan upgrade (300 dari budget 500) ke 240 req/s.
6. Antrean turun. Pertahankan latency <50 ms, loss ≤1%, dan service uptime ≥99% selama 20 detik untuk menyelesaikan level.

Tombol pause menghentikan simulasi dan packet. Tab yang berada di background tidak memajukan permainan. Restart mengulang level. Tap node membuka detailnya; tap node lain mengganti detail tanpa membuat link. Tombol X atau tap area kosong menutup panel. Keyboard: Tab memilih node, Enter/Space membuka detail.

## Struktur

- `src/game/engine.ts`: state machine tutorial, routing BFS, parameter Level 1, simulasi aggregate; tidak bergantung React.
- `src/game/engine.test.ts`: routing, validasi link, konservasi traffic, overload dan recovery.
- `src/App.tsx`: HUD, pointer/keyboard controls, peta SVG, tutorial dan hasil.
- `src/style.css`: responsif, safe-area mobile, tema visual.
- `capacitor.config.json`: identitas aplikasi dan `webDir: dist`.

Simulasi diperbarui tiap 100 ms. Traffic dihitung dalam request aggregate; maksimal tujuh dot per link adalah representasi visual dan bukan object untuk setiap request. Antrean dibatasi 80 request; overflow menjadi dropped request. Latency = 18 ms + queue/capacity. Load menampilkan **offered demand**, sehingga bisa >100%. Link Level 1 tidak memiliki bottleneck terpisah; Router-A menjadi bottleneck utama. BFS memadai karena semua link dianggap berbobot sama.

Service uptime mengukur keterjangkauan layanan, terpisah dari packet loss; setup awal dan office yang belum tersambung belum menghasilkan request. Loss pada panel node adalah loss pada tick terkini; served/dropped adalah total sesi. Kemenangan memakai kondisi stabil terkini, sehingga pemain selalu bisa pulih setelah tutorial overload.

## Tambahkan Capacitor

Konfigurasi sudah disiapkan; tidak perlu `cap init`. Dari root project:

```sh
npm install @capacitor/core @capacitor/android @capacitor/ios
npm install -D @capacitor/cli
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

Untuk iOS, jalankan pada macOS dengan Xcode:

```sh
npx cap add ios
npx cap sync ios
npx cap open ios
```

Setiap perubahan web: `npm run build` lalu `npx cap sync`. Gunakan Android Studio untuk Android dan Xcode pada macOS untuk iOS. Sesuaikan `appId` sebelum distribusi. Persyaratan Node/SDK mengikuti versi Capacitor yang dipasang: [panduan resmi](https://capacitorjs.com/docs/getting-started) dan [environment setup](https://capacitorjs.com/docs/getting-started/environment-setup).

Build native belum dibuat atau diuji. Uji pada perangkat nyata untuk touch, safe area, lifecycle, dan frame pacing sebelum rilis. Progres, rekor, dan pengaturan suara tersimpan lokal di perangkat.

## Cakupan Level 1

Lampiran PLAN.md asli tidak tersedia melalui referensi percakapan. Implementasi mengikuti desain Level 1 yang dapat dibaca dari percakapan tersebut dan brief pengguna. Angka kapasitas memakai req/s secara konsisten; tidak mengklaim mensimulasikan protokol atau Mbps nyata. Durasi scripted sekitar 65 detik ditambah waktu pemain membuat koneksi dan menangani incident. Tidak ada fitur Level 2, monetisasi, auth, cloud save, atau backend.

## Tampilan game mobile

Game memenuhi viewport tanpa scroll halaman, dengan HUD ringkas, progres empat misi, arena SVG, serta menu pause/restart. Detail node muncul sebagai panel di atas arena. Hanya isi panel panjang dan panduan yang dapat digulir. Layout menyesuaikan portrait, landscape, dan safe area. Tombol layar penuh tersedia pada browser yang mendukung Fullscreen API; pada iPhone, instal ke Layar Utama untuk tampilan standalone.

Statistik atas telah dipindahkan ke detail node. Office menampilkan served miliknya sendiri; router dan server menampilkan total gabungan. Antrean aggregate melacak kontribusi masing-masing office untuk served dan loss. Latency adalah estimasi end-to-end melalui antrean bersama. Uptime adalah status keterjangkauan saat ini (0/100%), bukan persentase historis waktu online.

## Menu, progres, suara, dan instalasi

Menu utama menyediakan mulai baru, lanjutkan shift, panduan, rekor, dan pengaturan suara. Save otomatis setiap satu detik, ketika aplikasi masuk background, dan saat kembali ke menu. Browser yang menolak penyimpanan menampilkan pemberitahuan; game tetap dapat dimainkan. Reload tidak menjalankan shift otomatis: pilih Lanjutkan. Score = max(0, round(10000 - detik shift × 15 - request dropped × 2)). Level tutorial selalu bisa dipulihkan lewat upgrade, tanpa game-over permanen.

Efek suara dibuat lokal dengan Web Audio setelah interaksi pertama. Pindah aplikasi mem-pause shift dan membatalkan drag. Instalasi PWA tersedia pada browser yang mendukung; pada iPhone gunakan Safari → Bagikan → Tambah ke Layar Utama. Production build menyertakan service worker untuk menyimpan aset setelah kunjungan online pertama; offline memerlukan cache tersebut berhasil terpasang. Pembaruan cache aktif setelah tab versi lama ditutup. Dev server tidak mendaftarkan service worker.

Modul tambahan: src/GameShell.tsx (menu/lifecycle), src/game/storage.ts (save tervalidasi), src/game/audio.ts (efek suara), public/manifest.webmanifest (instalasi). Tidak ada analytics atau data yang dikirim dari save lokal.

## GitHub Pages

Source: https://github.com/habibsyuhada/admin_network_minimetro . Workflow .github/workflows/pages.yml menjalankan test, build, lalu deploy setiap push ke main. Di Settings > Pages, pilih GitHub Actions sebagai source. Vite memakai base relatif agar aset, manifest, dan service worker berjalan pada subfolder repo maupun Capacitor.

URL: https://habibsyuhada.github.io/admin_network_minimetro/ . Save lokal terpisah dari situs lama karena domain berbeda.

