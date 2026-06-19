# layarbola21 – Template Live Match + Live Chat

Template halaman nonton bola (`template.html`). Setiap match dibuat dengan cara
menyalin file ini dan menamainya sesuai pertandingan, contoh:

```
liverpool-vs-manchester-city.html
real-madrid-vs-barcelona.html
```

Nama tim, skor, statistik, dan odds otomatis diambil dari nama file via
API-Football.

## Fitur Live Chat (baru)

Live chat custom yang menyatu dengan tema halaman, ditenagai **Firebase
Realtime Database** (gratis). Yang penting: **setiap match punya room chat
sendiri** secara otomatis — `roomId` diambil dari nama file (slug
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

### Catatan keamanan

- Pesan di-escape (anti-XSS) sebelum ditampilkan.
- Ada rate-limit sederhana (1 pesan / 1.2 detik) di sisi klien.
- Untuk produksi, perketat **Realtime Database Rules** (mis. batasi panjang
  pesan & izinkan tulis hanya ke path `chatrooms`).
