# Workday Pomodoro

Workday Pomodoro adalah aplikasi timer Pomodoro desktop untuk Windows. Aplikasi ini membagi sisa jam kerja menjadi sesi fokus dan istirahat, lalu menampilkan pengingat melalui notifikasi desktop dan system tray.

Panduan ini menjelaskan alur lengkap dari menyalin source code ke komputer, menjalankan aplikasi dalam mode development, membuat installer, hingga memasang aplikasi.

## 1. Persiapan

Pasang perangkat berikut di komputer Windows:

- **Git** untuk mengambil source code.
- **Node.js 20 atau lebih baru** (npm sudah disertakan bersama Node.js).
- **GitHub account** jika ingin melakukan fork repository.

## 2. Fork dan clone repository

1. Buka halaman repository Workday Pomodoro di GitHub.
2. Klik **Fork** untuk membuat salinan repository di akun GitHub kamu. Jika hanya ingin mencoba aplikasi dan tidak akan mengubah source code, kamu dapat melewati langkah fork.
3. Buka fork milikmu di GitHub, klik **Code**, lalu salin URL repository.
4. Buka terminal (PowerShell, Command Prompt, atau Git Bash), lalu jalankan:

```bash
git clone https://github.com/USERNAME/REPOSITORY.git
cd REPOSITORY
```

Ganti URL dan nama folder dengan milikmu. Jika tidak melakukan fork, gunakan URL repository asli.

## 3. Pasang dependensi dan jalankan aplikasi

Dari folder proyek, jalankan:

```bash
npm install
npm run dev
```

Perintah ini menjalankan Vite dan Electron bersamaan. Aplikasi development akan terbuka di desktop. Untuk menghentikannya, pilih **Exit** dari menu ikon aplikasi di system tray.

## 4. Uji dan buat installer Windows

Sebelum membuat installer, jalankan test:

```bash
npm test
```

Kemudian buat installer:

```bash
npm run dist
```

Perintah tersebut membangun aset aplikasi dan menghasilkan installer Windows NSIS di folder `release/`.

### File hasil build

- **`Workday-Pomodoro-Setup-<versi>.exe`** — installer yang digunakan untuk memasang aplikasi atau dibagikan kepada pengguna.
- `Workday-Pomodoro-Setup-<versi>.exe.blockmap` — file pendamping untuk distribusi/pembaruan; tidak perlu dibuka atau dijalankan.
- `win-unpacked/` — aplikasi hasil ekstrak untuk keperluan uji; bukan installer.
- `builder-debug.yml` — informasi debug proses build; tidak perlu dijalankan.

Jika nama file installer memiliki nomor versi, pilih file `.exe` yang namanya diawali **`Workday-Pomodoro-Setup-`**. Jangan menjalankan file `.blockmap`.

## 5. Pasang aplikasi dari installer

1. Buka folder `release/` setelah build selesai.
2. Klik kanan `Workday-Pomodoro-Setup-<versi>.exe`, lalu pilih **Run as administrator / Jalankan sebagai administrator**.
3. Setujui dialog Windows jika diminta, pilih lokasi instalasi, lalu selesaikan langkah-langkah installer.
4. Buka **Workday Pomodoro** dari Start Menu atau shortcut desktop.

Installer mungkin menampilkan peringatan Windows karena aplikasi belum ditandatangani dengan sertifikat code signing. Pastikan file berasal dari source atau rilis tepercaya sebelum menjalankannya.

## Menggunakan aplikasi

Tekan **Start focus** selama jam kerja aktif untuk memulai timer. Gunakan **Pause**, **Resume**, atau **Stop** untuk mengelola sesi. Saat jendela ditutup, aplikasi tetap berjalan di system tray; klik kanan ikon tray untuk membuka aplikasi, mengatur timer, atau memilih **Exit** untuk menutupnya.

Pengaturan bawaan menggunakan waktu lokal komputer dengan jadwal **07:30–12:00** dan **13:30–15:30**. Buka **Settings** untuk mengubah jam kerja, durasi interval, overlay saat istirahat, dan notifikasi. Pengaturan serta progres sesi disimpan secara lokal.
