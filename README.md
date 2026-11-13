# Workday Pomodoro

Workday Pomodoro adalah aplikasi timer Pomodoro desktop untuk Windows. Aplikasi ini membagi sisa jam kerja menjadi sesi fokus dan istirahat, lalu menampilkan pengingat melalui notifikasi desktop dan system tray.

## Instalasi

1. Unduh **`Workday-Pomodoro-Setup-1.0.0.exe`** dari halaman rilis aplikasi. Ini adalah installer yang perlu dijalankan.
2. Klik kanan file installer dan pilih **Run as administrator / Jalankan sebagai administrator**. Setujui dialog Windows jika muncul, lalu ikuti petunjuk instalasi. Kamu dapat memilih lokasi instalasi.
3. Jalankan **Workday Pomodoro** dari Start Menu atau shortcut desktop.

### File di folder `release/`

Jika mengunduh dari halaman rilis, pilih hanya file installer berikut:

- **`Workday-Pomodoro-Setup-1.0.0.exe`** — installer untuk pengguna. Jalankan file ini untuk memasang aplikasi.
- `Workday-Pomodoro-Setup-1.0.0.exe.blockmap` — file pendamping untuk pembaruan otomatis/distribusi rilis; bukan aplikasi dan tidak perlu dibuka.
- `win-unpacked/` — folder keluaran build yang berisi aplikasi dan file runtime. Ini untuk pengujian atau pengembangan, bukan installer yang biasa dibagikan kepada pengguna.
- `builder-debug.yml` — informasi debug dari proses build; tidak perlu dijalankan.

Jika terdapat beberapa file installer dengan nama mirip, gunakan file dengan nama **`Workday-Pomodoro-Setup-<versi>.exe`** yang sesuai versi rilis. Abaikan file `.blockmap` dan folder `win-unpacked`.

Aplikasi ini mendukung Windows 10 dan Windows 11. Jika Windows menampilkan peringatan karena penerbit aplikasi belum memiliki tanda tangan digital, pastikan installer berasal dari sumber rilis tepercaya sebelum melanjutkan.

## Menggunakan timer

1. Buka aplikasi saat berada di dalam jam kerja yang aktif.
2. Tekan **Start focus** untuk memulai sesi. Timer akan mengatur interval fokus dan istirahat berdasarkan sisa waktu kerja.
3. Saat interval berakhir, aplikasi menampilkan notifikasi. Ketika waktunya istirahat, overlay timer dapat tampil di atas jendela lain.
4. Gunakan **Pause** untuk menjeda timer, **Resume** untuk melanjutkan, atau **Stop** untuk mengakhiri sesi.

Timer mengikuti jadwal kerja yang dikonfigurasi. Sesi berhenti pada akhir jam kerja, dan hitung mundur tetap sinkron setelah komputer tidur atau aplikasi disembunyikan.

## System tray

Saat jendela ditutup, aplikasi tetap berjalan di system tray di area notifikasi Windows. Klik kanan ikon Workday Pomodoro untuk membuka aplikasi, masuk ke pengaturan, menjeda atau melanjutkan timer, menghentikan sesi, atau memilih **Exit** untuk menutup aplikasi sepenuhnya.

## Pengaturan

Buka **Settings** dari aplikasi atau menu ikon system tray untuk mengubah:

- Jam kerja pagi dan siang.
- Durasi minimum dan maksimum interval fokus dan istirahat.
- Overlay **Always on top** saat istirahat.
- Notifikasi desktop dan suara pengingat.
- Perilaku aplikasi saat jendela ditutup.

Pengaturan dan progres sesi disimpan secara lokal di komputer.

## Jam kerja dan zona waktu

Jadwal menggunakan waktu lokal komputer. Pengaturan bawaan adalah **07:30–12:00** dan **13:30–15:30**. Timer hanya dapat dimulai selama salah satu rentang jam kerja tersebut.

## Menjalankan saat pengembangan

Bagian ini ditujukan bagi pengembang yang ingin menjalankan atau membangun aplikasi dari source code. Pastikan Node.js 20 atau lebih baru dan npm telah terpasang, lalu jalankan:

```bash
npm install
npm run dev
```

Vite dan Electron akan berjalan bersamaan. Untuk membuat installer Windows:

```bash
npm test
npm run dist
```

Installer NSIS akan tersedia di folder `release/`.
