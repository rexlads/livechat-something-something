# Analisa `script.js` + `style.css`

Pemeriksaan menyeluruh untuk logika aplikasi (`script.js`, 3256 baris) dan
stylesheet (`style.css`, 3110 baris). Bagian (1) bug yang **sudah diperbaiki**,
(2) masalah yang **direkomendasikan** (belum diubah otomatis karena butuh
verifikasi langsung / keputusan kamu), dengan cuplikan kodenya.

---

## 1. Bug yang sudah diperbaiki (langsung di `script.js`)

### 🔴 A. Favorit tidak konsisten & hilang saat refresh
Dua bug sekaligus:
1. **Tipe data tidak cocok.** Saat disimpan, ID match diambil via
   `getAttribute('data-match-id')` → **string**, tapi saat render bintang
   dicek dengan `favoriteMatches.includes(match.id)` di mana `match.id` adalah
   **number**. Karena `includes` memakai perbandingan ketat, bintang favorit
   **tidak pernah tampil aktif** setelah re-render.
2. **Tidak disimpan.** `favoriteMatches` tidak pernah ditulis ke localStorage
   (padahal komentar disimpan), jadi favorit **hilang tiap reload**.

**Perbaikan:** favorit dimuat & disimpan ke localStorage, dan ID selalu
dinormalisasi ke string (`String(match.id)`), plus `saveFavorites()` saat
toggle.

### 🔴 B. Musim API salah → banyak data "belum tersedia"
Kode memakai `new Date().getFullYear()` sebagai parameter `season`. Padahal
musim liga Eropa = **tahun mulai** musim (musim 2025/26 = `2025`). Di paruh
pertama tahun, `getFullYear()` mengembalikan tahun yang musimnya belum dimulai
→ klasemen, statistik tim/pemain, dan top skor sering kosong.

**Perbaikan:** ditambah helper `getApiSeason()` (sebelum Juli → tahun−1) dan
dipakai di semua 6 titik pemanggilan musim.

### 🟠 C. Dropdown liga: hanya panah yang bisa diklik + rotasi panah rusak
Handler lama hanya menangkap klik tepat di ikon `.league-toggle`, dan kelas
`collapsed` di-toggle pada **ikon**, padahal CSS rotasi memakai
`.league-header:not(.collapsed) .league-toggle` (mengharap `collapsed` di
**header**). Akibatnya: badan header tidak bisa diklik, animasi panah tidak
sinkron, dan **keadaan awal tidak konsisten** (panah menghadap "terbuka" padahal
daftar tersembunyi).

**Perbaikan:** seluruh `.league-header` kini dapat diklik, kelas `collapsed`
di-toggle di header, dan header dimulai dengan kelas `collapsed` agar konsisten.

### 🟡 D. Tag `</h3>` nyasar
Pesan kosong di `renderMatchesForDate` punya `</h3>` tanpa pembuka. Sudah
dibersihkan.

---

## 2. Optimasi loading yang sudah diterapkan (`script.js`)

Aplikasi ini banyak melakukan `await` **berurutan** padahal request-nya
independen — ini penyebab utama lambatnya halaman.

| Fungsi | Sebelum | Sesudah |
|--------|---------|---------|
| `renderTopLeagues` (sidebar, jalan tiap buka beranda) | **13 request berurutan** | 1 putaran paralel (`Promise.all`) |
| `showMatchDetail` | 5 request berurutan (statistik, H2H, odds, lineup, events) | paralel `Promise.all` |
| `showTeamDetail` | 5 request berurutan | paralel `Promise.all` |

Efeknya besar: detail match yang tadinya ~2–3 detik bisa turun mendekati durasi
1 request, dan sidebar beranda tidak lagi menunggu 13 request beruntun.

---

## 3. Rekomendasi (belum diubah — butuh keputusan/verifikasi kamu)

### 🔐 A. API key terekspos di kode klien
`RAPIDAPI_KEY` ada di `script.js` sehingga **terlihat publik** dan bisa
dicuri/disalahgunakan (menghabiskan kuota kamu). Tidak bisa diamankan murni di
sisi klien. Rekomendasi: buat **proxy kecil** (Cloudflare Worker / serverless)
yang menyimpan key di server dan diakses halaman lewat proxy itu.

### ⏳ B. Kuota & jumlah request saat load awal
Plan gratis API-Sports biasanya dibatasi (mis. 100 req/hari, 10/menit). Saat
beranda dibuka, terjadi banyak request: top leagues (13), countries, fixtures,
news. Beberapa kali refresh bisa menghabiskan kuota → situs berhenti berfungsi.

Rekomendasi:
- **Cache metadata** (daftar liga populer, negara) di localStorage dengan masa
  berlaku (mis. 24 jam) — datanya jarang berubah.
- **Hindari render ganda:** saat load, `updateDateDisplay()` memanggil
  `renderMatches('all')`, lalu `handleRouteChange` → beranda memanggil
  `renderMatches` lagi → fixtures di-fetch **dua kali**. Cukup satu kali.

### ⚡ C. `await` berurutan lain yang sebaiknya diparalelkan
Pola sama seperti yang sudah diperbaiki, tinggal diterapkan:
- `showAllStandings` — loop 7 liga berurutan → `Promise.all`.
- `performSearch` — 6 endpoint berurutan → `Promise.all` (pencarian jadi
  jauh lebih cepat).
- `showPlayerPage` — 4 `renderTopPlayers` berurutan → `Promise.all`.

### 🧹 D. Kode & CSS mati
- **Slider** (`.slider-container/.slider-track/.slider-nav/.dot`) dan **popup
  gambar** (`#image-popup/#popup-image/#popup-link`) masih direferensikan di
  `script.js`, tapi markup-nya **tidak ada** di `index.html` → kode tidak
  pernah jalan (semua dijaga `if`), dan CSS-nya jadi beban mati. Pilih: hapus
  CSS+JS-nya, **atau** tambahkan markup-nya kalau fitur popup memang diinginkan.
- **Event page** (`.event-card { display:none !important }`, `#event-page`
  tidak ada) — fitur event praktis mati.

### 🟡 E. Lain-lain
- **Header klasemen duplikat:** ada dua `<th>M</th>` berdampingan (harusnya
  "Main" dan "Menang"). Bingungkan pembaca; beri label berbeda.
- **Komentar rawan XSS:** `renderComments` menyuntik `name`/`text` via
  `innerHTML` tanpa escape. Karena komentar hanya tersimpan di localStorage
  (per-browser), risikonya rendah, tapi sebaiknya tetap di-escape.
- **Tanggal UTC vs WIB:** `currentDate.toISOString()` memakai UTC; dekat tengah
  malam, "pertandingan hari ini" bisa meleset 1 hari untuk pengguna WIB.
- **Domain WordPress beda:** `WORDPRESS_API_BASE_URL` memakai
  `layarbola21.net`, sedangkan aset/gambar memakai `layarbola21.org`. Pastikan
  ini memang disengaja.
- **`renderMatches` menarik SEMUA fixtures dunia** untuk satu tanggal lalu
  difilter di klien — payload besar. Kalau bisa, batasi per liga prioritas.

---

## 4. Catatan `style.css`
- Banyak selector mati (slider, popup, event) seperti di atas — aman dihapus.
- Tema gelap diterapkan konsisten (banyak komentar `/* DIUBAH */`). Tidak ada
  error sintaks yang ditemukan.
- Saran ringan: minify + gabungkan dengan optimasi di `ANALISA-index.md`
  (Brotli/Gzip, cache header).

---

### Ringkasan
Empat bug nyata diperbaiki (favorit, musim API, dropdown liga, tag nyasar) dan
tiga jalur paling lambat diparalelkan. Sisanya (keamanan API key, caching
kuota, paralelisasi lanjutan, pembersihan kode mati) didokumentasikan di sini
dengan langkah konkret. Semua perubahan `script.js` lolos `node --check`.
