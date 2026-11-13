# Plan: Pomodoro Timer Desktop Berbasis Jam Kerja

## 1. Tujuan Proyek

Membangun aplikasi desktop Pomodoro Timer untuk Windows menggunakan Electron, React, Vite, dan Tailwind CSS.

Aplikasi dirancang mengikuti jam kerja pengguna, bukan menggunakan siklus Pomodoro standar yang selalu dimulai dari 25 menit.

Sistem akan:

- Membaca waktu aktual ketika pengguna menekan tombol Start.
- Menghitung waktu tersisa sampai akhir jam kerja.
- Membagi waktu tersebut menjadi beberapa sesi fokus dan istirahat.
- Mengacak durasi fokus dan istirahat.
- Memastikan seluruh sesi selesai tepat pada akhir jam kerja.
- Berjalan di System Tray ketika disembunyikan.
- Menampilkan jendela Always on Top secara otomatis ketika memasuki waktu istirahat.

## 2. Jadwal Jam Kerja

Jadwal kerja default:

| Sesi  | Waktu Mulai | Waktu Selesai |
| ----- | ----------- | ------------- |
| Pagi  | 07:30       | 12:00         |
| Siang | 13:30       | 15:30         |

Aturan:

1. Pukul 07:30–12:00 merupakan sesi kerja pagi.
2. Pukul 12:00–13:30 merupakan waktu istirahat siang.
3. Pukul 13:30–15:30 merupakan sesi kerja siang.
4. Di luar jadwal tersebut, tombol Start dinonaktifkan.
5. Ketika Start ditekan, aplikasi mengambil waktu aktual saat itu.
6. Aplikasi menentukan batas akhir berdasarkan sesi kerja yang sedang berlangsung.
7. Timer tidak boleh melewati batas akhir sesi kerja.

Semua perhitungan menggunakan waktu lokal komputer.

## 3. Alur Penggunaan

### Ketika aplikasi dibuka

- Tampilkan jam saat ini.
- Tampilkan informasi jadwal kerja.
- Tampilkan tombol Start.
- Tampilkan tombol Settings.
- Tidak perlu melakukan pengaturan sebelum memulai.
- Jika berada di luar jam kerja, tampilkan informasi bahwa timer belum dapat dimulai.

### Ketika tombol Start ditekan

1. Ambil waktu aktual.
2. Identifikasi sesi kerja aktif.
3. Tentukan waktu akhir sesi.
4. Hitung selisih waktu dalam menit.
5. Hitung jumlah sesi menggunakan rumus.
6. Generate jadwal fokus dan istirahat secara acak.
7. Validasi seluruh jadwal.
8. Jika valid, mulai timer.

## 4. Rumus Perhitungan

Jumlah sesi menggunakan rumus:

```javascript
const sessionCount = Math.ceil(remainingMinutes / 30);
```

Contoh:

Pengguna menekan Start pukul 08:20.

```text
Waktu mulai       : 08:20
Waktu selesai     : 12:00
Sisa waktu        : 220 menit

Jumlah sesi       : ceil(220 / 30)
                  : ceil(7.33)
                  : 8 sesi
```

Dengan demikian sistem akan membuat:

- 8 sesi fokus.
- 7 sesi istirahat.
- Total 15 interval.

Tidak ada istirahat setelah sesi fokus terakhir.

## 5. Aturan Durasi

### Sesi fokus

- Minimum: 20 menit.
- Maksimum: 25 menit.
- Durasi diacak untuk setiap sesi.

### Sesi istirahat

- Minimum: 6 menit.
- Maksimum: 7 menit.
- Durasi diacak untuk setiap istirahat.

### Aturan total waktu

Jumlah seluruh durasi fokus dan istirahat harus sama persis dengan sisa waktu kerja.

Contoh:

```text
Total fokus     : 174 menit
Total istirahat : 46 menit
---------------------------
Total           : 220 menit
```

Timer harus berhenti tepat pukul 12:00.

## 6. Algoritma Pembentukan Jadwal

Untuk N sesi fokus:

- Jumlah sesi fokus = N.
- Jumlah istirahat = N - 1.

Hitung batas minimum dan maksimum total durasi:

```javascript
const minimumTotal = sessionCount * 20 + (sessionCount - 1) * 6;

const maximumTotal = sessionCount * 25 + (sessionCount - 1) * 7;
```

Jadwal hanya bisa dibuat apabila:

```javascript
remainingMinutes >= minimumTotal && remainingMinutes <= maximumTotal;
```

### Langkah pembagian durasi

1. Tentukan jumlah sesi.
2. Buat slot fokus sebanyak N.
3. Buat slot istirahat sebanyak N-1.
4. Berikan durasi minimum pada seluruh slot.
5. Hitung sisa menit yang belum dialokasikan.
6. Acak urutan slot menggunakan Fisher-Yates Shuffle.
7. Tambahkan menit secara acak ke slot yang masih memiliki kapasitas.
8. Pastikan setiap slot tidak melampaui durasi maksimum.
9. Ulangi sampai seluruh menit teralokasikan.
10. Susun jadwal secara berurutan: fokus, istirahat, fokus, istirahat, dan seterusnya.
11. Validasi total akhir.

### Contoh implementasi

```javascript
function generateSchedule(remainingMinutes) {
  const n = Math.ceil(remainingMinutes / 30);

  const slots = [
    ...Array.from({ length: n }, (_, index) => ({
      type: "focus",
      index,
      min: 20,
      max: 25,
      duration: 20,
    })),

    ...Array.from({ length: n - 1 }, (_, index) => ({
      type: "break",
      index,
      min: 6,
      max: 7,
      duration: 6,
    })),
  ];

  const minimumTotal = slots.reduce((sum, slot) => sum + slot.min, 0);

  const maximumTotal = slots.reduce((sum, slot) => sum + slot.max, 0);

  if (remainingMinutes < minimumTotal || remainingMinutes > maximumTotal) {
    return {
      success: false,
      message: "Tidak ada kombinasi durasi yang valid.",
      minimumTotal,
      maximumTotal,
    };
  }

  let extra = remainingMinutes - minimumTotal;

  // Fisher-Yates Shuffle
  const shuffled = [...slots];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Distribusikan sisa menit secara acak.
  while (extra > 0) {
    const available = shuffled.filter((slot) => slot.duration < slot.max);

    if (available.length === 0) {
      return {
        success: false,
        message: "Gagal membentuk jadwal.",
      };
    }

    const slot = available[Math.floor(Math.random() * available.length)];

    slot.duration += 1;
    extra -= 1;
  }

  // Susun kembali berdasarkan urutan sesi.
  const focusSlots = slots.filter((slot) => slot.type === "focus").sort((a, b) => a.index - b.index);

  const breakSlots = slots.filter((slot) => slot.type === "break").sort((a, b) => a.index - b.index);

  const schedule = [];

  for (let i = 0; i < n; i++) {
    schedule.push({
      type: "focus",
      duration: focusSlots[i].duration,
    });

    if (i < n - 1) {
      schedule.push({
        type: "break",
        duration: breakSlots[i].duration,
      });
    }
  }

  const totalMinutes = schedule.reduce((sum, item) => sum + item.duration, 0);

  if (totalMinutes !== remainingMinutes) {
    return {
      success: false,
      message: "Validasi total waktu gagal.",
    };
  }

  return {
    success: true,
    sessionCount: n,
    totalMinutes,
    schedule,
  };
}
```

Catatan: Implementasi final harus tetap mempertahankan referensi slot yang sudah dialokasikan. Validasi juga harus memastikan seluruh fokus berada pada 20–25 menit dan seluruh istirahat pada 6–7 menit.

### Kondisi jadwal tidak valid

Rumus jumlah sesi `ceil(remainingMinutes / 30)` tidak selalu menghasilkan kombinasi yang valid.

Contohnya, sisa waktu 30 menit akan menghasilkan satu sesi fokus, sedangkan fokus minimal 20 dan maksimal 25 menit.

Jika kombinasi tidak valid:

- Jangan memulai timer.
- Jangan mengubah durasi secara diam-diam.
- Tampilkan pesan yang menjelaskan kendala.
- Berikan informasi minimum dan maksimum durasi yang memungkinkan.

## 7. Tampilan Utama

Buat desain modern, minimalis, dan fokus pada produktivitas.

Elemen utama:

- Jam aktual.
- Status sesi kerja.
- Waktu selesai.
- Countdown timer.
- Progress bar.
- Tombol Start.
- Tombol Pause/Resume.
- Tombol Stop.
- Tombol Settings.
- Jumlah sesi tersisa.

Ketika timer belum dimulai, fokuskan tampilan pada jam aktual dan tombol Start.

Ketika timer berjalan, fokuskan tampilan pada countdown.

## 8. Perilaku Focus Mode dan Break Mode

### Focus Mode

Ketika sesi fokus berlangsung:

- Countdown berjalan.
- Aplikasi boleh disembunyikan ke System Tray.
- Always on Top dinonaktifkan.
- Pengguna tetap bisa menggunakan aplikasi lain.
- Ketika sesi fokus selesai, tampilkan notifikasi.

### Break Mode

Ketika memasuki sesi istirahat:

- Aplikasi otomatis ditampilkan.
- Aktifkan Always on Top.
- Jendela dapat dibuat lebih kecil.
- Tampilkan countdown istirahat.
- Tampilkan informasi bahwa pengguna sedang istirahat.
- Mainkan suara notifikasi jika diaktifkan.

Ketika istirahat selesai:

- Nonaktifkan Always on Top.
- Kembali ke Focus Mode.
- Lanjutkan sesi fokus berikutnya.

## 9. System Tray

Aplikasi tidak harus benar-benar ditutup ketika tombol X ditekan.

Gunakan Electron Tray.

Perilaku:

- Klik X: sembunyikan jendela.
- Ikon tetap muncul di notification area Windows.
- Klik dua kali ikon: tampilkan aplikasi.
- Klik kanan ikon: tampilkan menu.

Menu System Tray:

```text
Pomodoro Timer
--------------------
Show Application
Start / Resume
Pause
Stop Session
--------------------
Exit
```

Gunakan `setSkipTaskbar(true)` ketika jendela disembunyikan jika diperlukan.

Timer harus tetap berjalan meskipun jendela disembunyikan.

## 10. Pengaturan

Pengaturan tidak wajib dilakukan sebelum memulai.

Sediakan halaman Settings yang memungkinkan pengguna mengubah:

| Pengaturan                   | Default  |
| ---------------------------- | -------- |
| Jam mulai pagi               | 07:30    |
| Jam selesai pagi             | 12:00    |
| Jam mulai siang              | 13:30    |
| Jam selesai siang            | 15:30    |
| Fokus minimum                | 20 menit |
| Fokus maksimum               | 25 menit |
| Istirahat minimum            | 6 menit  |
| Istirahat maksimum           | 7 menit  |
| Always on Top saat istirahat | Aktif    |
| Desktop notification         | Aktif    |
| Sound notification           | Aktif    |
| Close to System Tray         | Aktif    |

Simpan pengaturan secara lokal.

## 11. Penanganan Kondisi Khusus

1. Start ditekan di luar jam kerja: tombol dinonaktifkan.
2. Start ditekan saat timer sudah berjalan: jangan membuat sesi baru.
3. Aplikasi disembunyikan: timer tetap berjalan.
4. Komputer sleep: hitung ulang berdasarkan timestamp, bukan hanya `setInterval`.
5. Komputer bangun: sesuaikan countdown dengan waktu aktual.
6. Waktu sistem berubah: lakukan validasi ulang.
7. Timer selesai: hentikan tepat pada batas akhir sesi.
8. Aplikasi benar-benar keluar: simpan status sesi secara lokal.
9. Jika sesi sudah melewati batas waktu akibat sleep, jangan melanjutkan jadwal melewati akhir jam kerja.
10. Saat tanggal berganti, gunakan jadwal kerja untuk tanggal baru.

Gunakan timestamp akhir interval sebagai sumber kebenaran timer. `setInterval` hanya digunakan untuk memperbarui tampilan countdown.

## 12. Teknologi

Gunakan:

- Electron.
- React.
- Vite.
- Tailwind CSS.
- JavaScript.
- LocalStorage atau SQLite untuk penyimpanan.
- Electron Tray.
- Electron Notification.
- Electron IPC.

Konfigurasi keamanan Electron:

```javascript
webPreferences: {
  contextIsolation: true,
  nodeIntegration: false,
  preload: path.join(__dirname, "preload.js"),
}
```

Jangan mengekspos Node.js secara langsung ke Renderer.

Gunakan Preload dan IPC untuk komunikasi antara React dan Electron Main Process.

## 13. Struktur Proyek

Struktur yang disarankan:

```text
pomodoro-desktop/
│
├── electron/
│   ├── main.js
│   ├── preload.js
│   ├── tray.js
│   ├── window.js
│   ├── notifications.js
│   └── timer-service.js
│
├── src/
│   ├── components/
│   │   ├── TimerDisplay.jsx
│   │   ├── ProgressBar.jsx
│   │   ├── SessionInfo.jsx
│   │   └── SettingsModal.jsx
│   │
│   ├── pages/
│   │   ├── Home.jsx
│   │   └── Settings.jsx
│   │
│   ├── services/
│   │   ├── scheduleGenerator.js
│   │   ├── workSchedule.js
│   │   └── timer.js
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── public/
├── package.json
└── README.md
```

Struktur boleh disesuaikan selama pemisahan Main Process, Preload, dan Renderer tetap terjaga.

## 14. Tahapan Pengembangan

### Tahap 1: Setup

- Inisialisasi Electron + React + Vite.
- Konfigurasi Tailwind.
- Pastikan aplikasi dapat berjalan.

### Tahap 2: Work Schedule

- Implementasi jadwal pagi dan siang.
- Deteksi jam kerja aktif.
- Hitung sisa waktu.
- Tentukan batas akhir.

### Tahap 3: Schedule Generator

- Implementasi perhitungan jumlah sesi.
- Implementasi pengacakan durasi.
- Validasi total durasi.
- Pengujian jadwal valid dan tidak valid.

### Tahap 4: Timer Engine

- Implementasi countdown.
- Implementasi perpindahan fokus dan istirahat.
- Implementasi timestamp.
- Penanganan sleep/resume.

### Tahap 5: User Interface

- Tampilan utama.
- Countdown.
- Progress bar.
- Settings.
- Status fokus dan istirahat.

### Tahap 6: Desktop Integration

- System Tray.
- Always on Top.
- Desktop Notification.
- Sound Notification.
- Hide dan Show Window.

### Tahap 7: Persistence

- Simpan pengaturan.
- Simpan status sesi.
- Simpan statistik produktivitas.

### Tahap 8: Testing dan Build

- Jalankan seluruh pengujian.
- Perbaiki bug.
- Build installer Windows `.exe`.

## 15. Kriteria Penerimaan

- [ ] Aplikasi dapat berjalan di Windows.
- [ ] Aplikasi membaca waktu aktual saat Start ditekan.
- [ ] Pukul 08:20 menghasilkan sisa waktu 220 menit.
- [ ] Batas akhir sesi pagi adalah pukul 12:00.
- [ ] Batas akhir sesi siang adalah pukul 15:30.
- [ ] Jumlah sesi menggunakan pembulatan ke atas.
- [ ] Durasi fokus selalu 20–25 menit.
- [ ] Durasi istirahat selalu 6–7 menit.
- [ ] Tidak ada istirahat setelah sesi fokus terakhir.
- [ ] Total durasi tepat sama dengan sisa waktu.
- [ ] Timer tidak melewati batas akhir jam kerja.
- [ ] Aplikasi muncul otomatis saat istirahat.
- [ ] Always on Top aktif saat istirahat.
- [ ] Always on Top nonaktif saat fokus.
- [ ] Aplikasi dapat disembunyikan ke System Tray.
- [ ] Timer tetap berjalan ketika jendela disembunyikan.
- [ ] Timer tetap akurat setelah komputer sleep.
- [ ] Pengaturan dapat diubah.
- [ ] Aplikasi dapat di-build menjadi installer `.exe`.

## 16. Instruksi untuk AI Agent

Implementasikan proyek secara bertahap berdasarkan dokumen ini.

Prioritas pengembangan:

1. Ketepatan algoritma pembagian waktu.
2. Ketepatan timer dan batas akhir jam kerja.
3. Perilaku Focus Mode dan Break Mode.
4. Integrasi System Tray dan Always on Top.
5. Tampilan antarmuka.
6. Statistik dan fitur tambahan.

Jangan langsung membuat seluruh aplikasi tanpa menguji algoritma pembagian waktu terlebih dahulu.

Buat unit test untuk:

- Sisa waktu 220 menit.
- Sisa waktu sesi pagi.
- Sisa waktu sesi siang.
- Sisa waktu yang tidak memungkinkan pembagian.
- Batas waktu awal dan akhir jam kerja.
- Total durasi seluruh interval.
- Validasi durasi setiap interval.

Pastikan tidak ada jadwal yang melanggar durasi minimum atau maksimum dan tidak ada timer yang melewati akhir jam kerja.

Setelah implementasi selesai, sertakan panduan instalasi, menjalankan aplikasi dalam mode development, dan membangun installer Windows.
