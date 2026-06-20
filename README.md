# layarbola21 – Template Live Match + Live Chat

Template halaman nonton bola (`template.html`). Setiap match dibuat dengan cara
menyalin file ini dan menamainya sesuai pertandingan, contoh:

```
liverpool-vs-manchester-city.html
real-madrid-vs-barcelona.html
```

Nama tim, skor, statistik, dan odds otomatis diambil dari nama file via
API-Football.

## Fitur Live Room Chat (baru)

Live Room Chat custom yang menyatu dengan tema halaman (tampil di bawah tombol
Download APK), ditenagai **Firebase Realtime Database** (gratis). Yang penting:
**setiap match punya room chat sendiri** secara otomatis — `roomId` diambil dari nama file (slug
`team1-vs-team2`), jadi obrolan di `liverpool-vs-chelsea.html` terpisah dari
`real-madrid-vs-barcelona.html`.

### Setup (cukup sekali, dipakai semua match)

1. Buat project gratis di <https://console.firebase.google.com>.
2. **Build → Realtime Database → Create Database** (mode *test* untuk awal).
3. **Project settings → Your apps → Web (`</>`)** lalu salin object
   `firebaseConfig`.
4. Tempel nilainya ke `FIREBASE_CONFIG` di bagian bawah `template.html`.

Setelah itu semua file match otomatis aktif chat-nya tanpa diubah lagi.
Selama `FIREBASE_CONFIG` belum diisi, panel chat menampilkan catatan setup dan
tidak error.

### Filter kata kasar otomatis

Kata kasar otomatis disensor jadi tanda bintang (mis. `anjing` → `******`),
baik saat dikirim maupun saat ditampilkan (pesan lama pun ikut tersensor).
Daftar katanya ada di konstanta `BAD_WORDS` di bagian atas script chat di
`template.html` — tinggal tambah/kurangi sendiri. Filter memakai batas kata
sehingga tidak salah menyensor kata wajar (mis. "analisis" aman).

### Catatan keamanan

- Pesan di-escape (anti-XSS) sebelum ditampilkan.
- Ada rate-limit sederhana (1 pesan / 1.2 detik) di sisi klien.
- Untuk produksi, perketat **Realtime Database Rules**. Sudah disediakan di
  [`database.rules.json`](database.rules.json): tulis hanya diizinkan ke path
  `chatrooms`, nama maks 20 karakter, pesan 1–300 karakter, dan field selain
  `name`/`text`/`ts` ditolak.

### Cara menerapkan rules

Firebase Console → **Realtime Database → Rules** → tempel isi
`database.rules.json` → **Publish**. (API key Firebase aman tampil di kode
klien — itu identitas project, bukan rahasia; yang melindungi data adalah
rules ini.)

## Moderasi: panel admin (hapus komentar)

Di header chat ada ikon **gembok 🔒**. Klik → login admin → muncul tombol
**hapus (×)** di tiap pesan dan tombol **"Bersihkan semua"** untuk mengosongkan
room. Pengunjung biasa tidak bisa menghapus (dijaga oleh rules).

Aktifkan sekali seperti ini:

1. **Authentication → Sign-in method → Email/Password → Enable.**
2. **Authentication → Users → Add user** → buat akun admin (email + password).
   Ini akun login moderasi kamu (bukan untuk pengunjung).
3. Salin **User UID** akun admin tadi.
4. **Realtime Database → Data** → buat node:
   `admins` → tambahkan child dengan **nama = UID admin** dan **nilai = `true`**.
   Jadi strukturnya: `admins/<UID_ADMIN> = true`.
5. Pastikan **rules sudah di-Publish** dari `database.rules.json` (rules versi
   ini hanya mengizinkan akun yang terdaftar di `/admins` untuk menghapus).

Setelah itu: buka halaman match mana pun → klik gembok → masuk dengan akun
admin → hapus pesan yang tidak diinginkan. Penghapusan langsung hilang di layar
semua pengunjung secara real-time.

> Alternatif tanpa panel: kamu juga tetap bisa menghapus manual lewat
> **Firebase Console → Realtime Database → Data** (hover pesan → tombol ✕).
