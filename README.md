# Workday Pomodoro

Aplikasi Pomodoro desktop Windows yang menyesuaikan interval fokus dan istirahat dengan sisa waktu jam kerja. Dibangun menggunakan Electron, React, Vite, dan Tailwind CSS.

## Fitur

- Jadwal kerja lokal pagi dan siang yang dapat diubah.
- Generator sesi fokus/istirahat dengan validasi total durasi.
- Timer tetap sinkron setelah komputer tidur atau aplikasi disembunyikan.
- System tray, notifikasi desktop, dan overlay istirahat transparan yang dapat dipindahkan.
- Quick test mode untuk mencoba pergantian enam tahap berdurasi 10 detik.
- Pengaturan dan sesi disimpan secara lokal.

## Persyaratan

- Windows 10/11
- Node.js 20 atau lebih baru dan npm

## Instalasi dan development

```bash
npm install
npm run dev
```

Vite dan Electron akan berjalan bersamaan. Saat menjalankan aplikasi development, tutup proses dengan menu **Exit** dari system tray.

## Pengujian dan build

```bash
npm test
npm run build
npm run dist
```

Installer Windows NSIS tersedia di folder `release/` setelah `npm run dist`.

## Rilis portfolio

Setelah build, unggah installer dari `release/` sebagai GitHub Release. Jangan commit folder `node_modules/`, `dist/`, atau `release/`; semuanya dikecualikan oleh `.gitignore`.

## Perilaku

- Jadwal default: 07:30–12:00 dan 13:30–15:30 waktu lokal.
- Generator membagi setiap menit secara persis dan menolak kombinasi yang berada di luar batas durasi interval.
- Pengaturan dan progres sesi disimpan lokal menggunakan browser storage Electron.
- Countdown didasarkan pada timestamp sehingga tetap sinkron setelah komputer sleep.
- Saat istirahat, overlay timer transparan ditampilkan di atas aplikasi lain.
