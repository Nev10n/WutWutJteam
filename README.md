# BRAIN BATTLE

Prototype game competitive individual berbasis **HTML + CSS + JavaScript**.

> Catatan: untuk website, bahasa pemrograman yang dipakai adalah **JavaScript**, bukan Java. File `script.js` adalah logic gameplay.

## File

- `index.html` — seluruh struktur halaman.
- `style.css` — tampilan futuristik biru/ungu seperti referensi.
- `script.js` — gameplay, bot, timer, skor, XP, rank, profil, Team Battle, dan Class Mode.
- `multiplayer.js` — **BARU**: mode ONLINE (Casual & Ranked) melawan pemain sungguhan lewat Firebase Realtime Database. Lihat bagian "Setup Multiplayer (Firebase)" di bawah — wajib diisi dulu sebelum mode ini aktif.
- `README.md` — dokumentasi singkat.

## Alur

1. Intro → Membuka Rank → daftar rank → Lobby.
2. Lobby:
   - **PLAY** → Classic / Rank (lawan bot lokal).
   - **ONLINE** → **BARU**: Casual / Ranked, lawan pemain sungguhan dari perangkat lain secara real-time (lihat bagian "Multiplayer Online" & "Setup Multiplayer (Firebase)").
   - **TEAM** → 10 pemain dibagi 5 tim.
   - **CLASS** → Memory Cards + Letter Logic.
   - **RANK** → melihat daftar rank.
3. Classic:
   - 1 mapel.
   - 10 soal.
   - rebutan.
   - setelah merebut, tunggu 3 detik.
   - waktu jawab 15 detik.
   - tidak memberi XP Rank.
4. Rank:
   - 1 mapel.
   - 10 soal.
   - rebutan.
   - juara 1 = +10 XP, juara 2 = +7 XP, juara 3 = +5 XP, posisi lain = +0 XP.
5. Chaos:
   - mapel campuran MTK, FSK, KIM, BIO, BID, BEN, PUM, GEO, SOS.
   - XP aktif.
6. Team:
   - 10 pemain, 5 tim, 2 pemain per tim.
   - rebutan dan skor tim.
7. Class:
   - 5 pemain.
   - Memory Cards dengan waktu hafalan 15 detik.
   - Letter Logic.
   - menampilkan progress pemain.
   - tidak memberi XP Rank.

## Multiplayer Online (Casual & Ranked)

Berbeda dari mode PLAY/RANK/TEAM/CLASS (yang semuanya lawan bot lokal di satu
browser yang sama), mode **ONLINE** benar-benar mempertemukan pemain dari
perangkat berbeda lewat internet, real-time, memakai Firebase Realtime
Database sebagai "server" (murni sisi klien — tetap cocok untuk hosting
statis seperti Netlify, tidak perlu bikin backend sendiri).

Alur mode ONLINE:

1. Lobby → **ONLINE** → pilih **CASUAL** (santai, tanpa XP Rank) atau
   **RANKED** (kompetitif, dapat XP Rank sama seperti mode Rank biasa) →
   pilih 1 mapel → **CARI LAWAN**.
2. Kamu masuk antrean khusus mode+mapel tersebut. Selama menunggu, kamu
   melihat siapa saja yang sudah antre.
3. Begitu antrean mencapai 5 pemain **atau** sudah menunggu 15 detik, match
   langsung dimulai — sisa slot yang belum terisi pemain sungguhan otomatis
   diisi bot (jadi kamu tidak akan menunggu lama meski sedang sepi).
4. Aturan pertandingan sama persis seperti mode Rank: 10 soal, sistem
   rebutan, 15 detik untuk merebut, jeda 3 detik, lalu 15 detik untuk
   menjawab. XP: 🥇 +10, 🥈 +7, 🥉 +5, posisi lain +0 (Casual selalu +0 XP).
5. Semua pemain sungguhan di dalam satu match melihat soal, status rebutan,
   dan skor yang sama secara real-time.

**Keterbatasan versi ini** (wajar untuk prototype, bisa dikembangkan lagi):
- Belum ada fitur "📖 PEMBAHASAN" untuk match online.
- Timer disinkronkan lewat jam masing-masing perangkat (bukan jam server),
  jadi bisa meleset beberapa saat jika jam perangkat pemain tidak akurat.
- Kalau seorang pemain menutup tab di tengah match, skornya berhenti
  bertambah tapi match tetap lanjut untuk pemain lain — belum ada sistem
  "reconnect".
- Antrean & data match masih bisa dibaca/ditulis siapa saja yang tahu
  konfigurasi Firebase-mu (lihat catatan keamanan di bawah) — cukup untuk
  prototype/demo, sebaiknya diperketat sebelum dipakai serius.

## Setup Multiplayer (Firebase)

Mode ONLINE butuh sebuah database realtime gratis dari Firebase supaya
pemain-pemain di perangkat berbeda bisa saling menemukan. Tanpa langkah ini,
tombol ONLINE tetap muncul tapi akan memberi tahu pemain bahwa server belum
disetel — mode lain (Classic/Rank/Team/Class) tetap berjalan normal.

1. Buka https://console.firebase.google.com, login dengan akun Google,
   lalu buat proyek baru (gratis, tidak perlu kartu kredit untuk paket Spark).
2. Di sidebar kiri: **Build → Realtime Database → Create Database**. Pilih
   lokasi server terdekat, lalu untuk prototype pilih mode **test** (semua
   orang bisa baca/tulis — lihat catatan keamanan di bawah).
3. Buka **Project settings** (ikon gerigi) → tab **General** → scroll ke
   "Your apps" → klik ikon web `</>` → daftarkan app (tidak perlu Firebase
   Hosting) → Firebase akan menampilkan objek `firebaseConfig`.
4. Buka `multiplayer.js`, cari blok `FIREBASE_CONFIG` di bagian paling atas,
   lalu ganti nilai `apiKey`, `authDomain`, `databaseURL`, `projectId`, dan
   `appId` dengan nilai dari `firebaseConfig` milikmu.
5. Upload ulang folder ini ke Netlify (drag-and-drop atau `git push` kalau
   sudah terhubung ke repo) — tombol ONLINE otomatis aktif begitu deploy
   selesai, tidak perlu ubah kode lain.

Catatan keamanan: mode **test** pada Realtime Database berarti siapa pun
yang tahu URL database-mu bisa baca/tulis datanya. Untuk prototype/demo ini
biasanya tidak masalah (tidak ada data pribadi sensitif yang disimpan di
sana, hanya nama pemain & skor pertandingan), tapi kalau situs mulai dipakai
publik secara serius, ubah rule-nya di tab **Rules** minimal jadi:

```json
{
  "rules": {
    "queue": { ".read": true, ".write": true },
    "queueAssignment": { ".read": true, ".write": true },
    "matches": { ".read": true, ".write": true }
  }
}
```

(Rule di atas masih terbuka tapi membatasi akses hanya ke tiga node yang
dipakai game ini. Untuk keamanan lebih serius, tambahkan Firebase
Authentication + rule berbasis `auth.uid` — di luar cakupan prototype ini.)

## Rank

Urutan:
Novice → Scholar → Expert → Elite → Master → Grand Scholar → Academic Legend.

Sub-rank dapat ditambahkan kemudian (mis. Master III → Master II → Master I → Grand Scholar I).

## Menjalankan

Cara paling sederhana:

1. Ekstrak folder.
2. Buka `index.html` di browser.

Untuk pengembangan di VS Code, disarankan memakai extension **Live Server**.

## Pembaruan (v2)

- **Soal ditambah**: setiap mapel kini punya 10 soal (total 90 soal), jadi Classic/Rank (10 soal/match) jarang terasa berulang, dan Chaos punya pool ±90 soal.
- **Bug timer diperbaiki**: sebelumnya timer 15 detik yang sama terus berjalan dari fase "rebutan" sampai fase "jawab", jadi kadang waktu jawab tiba-tiba habis padahal baru mulai. Sekarang setiap fase (rebutan → tunggu 3 detik → jawab) punya timer sendiri yang selalu direset lewat helper `startPhaseTimer()`.
- **Suara di lobby**: musik latar otomatis diputar begitu masuk Lobby (dan tetap mengikuti toggle Audio di Pengaturan).
- **Pembahasan soal (Classic)**: setelah match Classic selesai, tombol "📖 PEMBAHASAN" di layar hasil menampilkan seluruh 10 soal beserta jawaban benar dan jawabanmu.
- **Sistem akun**: SIGN IN untuk membuat akun baru, LOGIN untuk masuk akun lama. Progres (XP, rank, statistik) disimpan otomatis ke `localStorage` di perangkat, jadi tetap ada saat dibuka lagi. Ada juga tombol "Keluar Akun" di Pengaturan.
- **Reveal rank NOVICE cuma sekali**: animasi "Membuka Rank" hanya muncul sesaat setelah SIGN IN (akun baru). Kalau LOGIN pakai akun lama, langsung masuk Lobby.
- **Animasi naik rank**: begitu XP membawamu ke rank/sub-level baru (mis. NOVICE II → NOVICE I, atau EXPERT I → ELITE III), muncul overlay animasi rank baru di layar hasil.
- **Lobby Rank baru**: menekan mode RANK kini masuk ke "Lobby Rank" dulu — pilih MAIN SOLO (lawan 4 bot acak) atau UNDANG TEMAN (pilih maks 4 teman dari daftar; teman yang diundang jadi lawan, bukan rekan satu tim; sisa slot dari 5 pemain otomatis diisi bot).

> Sistem akun ini murni sisi klien (localStorage), password tidak di-hash — cocok untuk prototype/demo lokal, tapi untuk produksi sungguhan perlu backend + database + hashing password yang benar.

## Pembaruan (v3)

- **Mode ONLINE (Casual & Ranked)**: tombol baru di Lobby. Lawan pemain
  sungguhan dari perangkat lain lewat matchmaking real-time (Firebase
  Realtime Database), dengan sisa slot otomatis diisi bot kalau lawan
  manusia belum cukup dalam 15 detik. Aturan, timing, dan XP identik dengan
  mode Rank yang sudah ada. Lihat "Multiplayer Online" dan "Setup
  Multiplayer (Firebase)" di atas — perlu isi konfigurasi Firebase-mu
  sendiri di `multiplayer.js` sebelum mode ini aktif.

## Catatan pengembangan berikutnya

Mode Classic/Rank/Team/Class masih murni frontend/lokal (lawan bot). Mode
ONLINE sudah punya matchmaking & sinkronisasi realtime dasar lewat Firebase
(lihat "Multiplayer Online" di atas untuk keterbatasannya). Pengembangan
lanjutan yang masih terbuka: leaderboard online lintas pemain, sistem akun
terpusat (bukan localStorage per perangkat), anti-cheat (validasi jawaban
di sisi server, bukan sisi klien), sinkronisasi timer berbasis jam server
(`firebase.database.ServerValue.TIMESTAMP`), reconnect saat koneksi putus
di tengah match, dan fitur pembahasan soal untuk match online.
