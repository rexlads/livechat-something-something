# Analisa `index.html` (Homepage LAYARBOLA21)

Dokumen ini berisi (1) hasil pemeriksaan bug/masalah, (2) perubahan yang sudah
diterapkan ke `index.html`, dan (3) ide lanjutan untuk mempercepat loading.

> Catatan: `style.css` dan `script.js` **tidak ikut diunggah**, jadi logika
> utama (fetch API skor, render jadwal, pencarian, dll) belum bisa diaudit.
> Analisa di bawah fokus pada HTML + CSS inline + script inline pada file ini.

---

## 1. Bug / masalah yang ditemukan

### 🔴 A. Media query CSS hilang (sudah diperbaiki)
Pada bagian `.banner-overlay` (komentar "TABLET" dan "DESKTOP"), pembungkus
`@media { ... }`-nya **hilang**. Akibatnya aturan yang seharusnya hanya untuk
layar besar (mis. `font-size: 1.5rem`, `padding: 18px`) **bocor ke semua
ukuran layar** dan saling menimpa. Sudah diperbaiki dengan mengembalikan
pembungkus `@media (min-width: 768px)` (tablet) dan `@media (min-width: 1024px)`
(desktop).

### 🟠 B. Kode mati (dead code) dalam komentar (sudah dihapus)
Ada blok `<!--script> ... </script-->` sepanjang **±232 baris / 8.7 KB** berisi
logika slider + image popup yang **dinonaktifkan**. Lebih buruk lagi, kode itu
merujuk elemen yang **sudah tidak ada** di HTML (`#image-popup`, `#popup-image`,
`.slider-track`, dll) — jadi kalaupun diaktifkan akan error. Sudah dihapus
supaya HTML lebih ringan dan tidak membingungkan. CSS milik slider/popup
(`.slider-*`, `.image-popup`, `#popup-*`) sebenarnya juga sudah tidak terpakai
dan bisa dibersihkan dari `style.css`/`<style>` (lihat ide #8).

### 🟠 C. Elemen HTML usang (deprecated)
- `<marquee>` (running text) — sudah obsolete, dukungan browser tidak dijamin
  ke depan. Sebaiknya diganti animasi CSS (lihat ide #7).
- `<center>` di sekitar Histats — usang, sebaiknya pakai CSS.

### 🟡 D. `target="_blank"` tanpa `rel="noopener"` (sudah diperbaiki)
Semua banner/iklan membuka tab baru tanpa `rel="noopener"` — ini celah
keamanan/performa kecil (tab baru bisa mengakses `window.opener`). Sudah
ditambahkan `rel="noopener"` pada banner.

### 🟡 E. Fallback `via.placeholder.com`
`onerror` gambar banner mengarah ke `via.placeholder.com` yang sering
lambat/down belakangan ini — kalau gambar utama gagal, fallback-nya pun bisa
gagal. Sebaiknya pakai placeholder lokal (lihat ide #9).

### 🟢 F. Hal kecil lain
- `current-date` di-hardcode `29-08-2025` (kemungkinan ditimpa `script.js`).
- Dua `vertical-banner` memuat GIF yang sama dua kali (`banner.gif`).
- Banyak elemen kosong yang baru diisi oleh `script.js` — wajar, bukan bug.

**Tidak ada bug pada JavaScript yang aktif di file ini** (Histats, email-decode,
beacon Cloudflare semua normal). Bug yang mungkin ada kemungkinan besar berada
di `script.js` yang tidak disertakan.

---

## 2. Perubahan yang sudah diterapkan (untuk loading lebih cepat)

| # | Perubahan | Manfaat |
|---|-----------|---------|
| 1 | `preconnect` + `dns-prefetch` ke origin pihak ketiga (cdnjs, layarbola21.org, api-sports, chatango, histats, cloudflare) | Handshake DNS/TLS dimulai lebih awal → resource pihak ketiga datang lebih cepat |
| 2 | Font Awesome dimuat **non-render-blocking** (`preload` + `onload` swap, dengan fallback `<noscript>`) | CSS ikon tidak lagi menahan tampilan pertama (First Paint lebih cepat) |
| 3 | `loading="lazy"` + `decoding="async"` pada 6 gambar banner (di bawah layar) | Gambar iklan tidak diunduh sampai mendekati viewport → byte awal jauh lebih kecil |
| 4 | Logo diberi `fetchpriority="high"` + `decoding="async"` | Logo (kemungkinan LCP) diprioritaskan |
| 5 | `script.js` diberi `defer` | Parsing HTML tidak tertahan, eksekusi rapi setelah DOM siap |
| 6 | Widget **Chatango di-lazy-load** (saat idle / scroll / interaksi pertama) | Menunda ±beberapa ratus KB + kerja JS pihak ketiga sampai halaman utama siap |
| 7 | Hapus 232 baris kode mati dalam komentar | HTML lebih kecil & bersih |
| 8 | `rel="noopener"` pada link banner | Keamanan + sedikit performa |

> ⚠️ Perlu dites di server asli: pastikan widget **Chatango tetap muncul**
> setelah di-lazy-load (pola injeksi dinamis ini umumnya bekerja, tapi wajib
> dicek langsung), dan pastikan **`style.css`** tidak bergantung pada urutan
> sebelum Font Awesome.

---

## 3. Ide lanjutan (butuh akses server / `style.css` / `script.js`)

1. **Ganti GIF iklan dengan WebP animasi atau `<video>`/MP4.**
   Ini kemungkinan **penghematan terbesar** — GIF iklan sering 1–5 MB per file,
   sedangkan WebP/MP4 bisa 80–90% lebih kecil dengan kualitas sama.

2. **Subset Font Awesome.** Halaman hanya memakai ~20 ikon, tapi memuat seluruh
   pustaka (CSS + font ratusan KB). Pilih salah satu:
   - Self-host hanya ikon yang dipakai, atau
   - Ganti ikon dengan **inline SVG** (hilangkan FA sepenuhnya).

3. **Minify + kompres** `style.css` dan `script.js`, aktifkan **Brotli/Gzip**
   dan **cache-control** panjang (file statis) di server/CDN.

4. **Pisahkan critical CSS.** Inline-kan CSS untuk bagian atas layar (header,
   banner, running text) di `<head>`, lalu muat sisa `style.css` secara async —
   mempercepat First Contentful Paint.

5. **`content-visibility: auto`** + `contain-intrinsic-size` pada section berat
   di bawah layar (Player, Berita, Klasemen) agar browser melewati render
   bagian yang belum terlihat. (Perlu set ukuran perkiraan agar scroll tidak
   melompat.)

6. **Tambahkan `width`/`height` (atau `aspect-ratio`)** pada gambar yang masih
   responsif penuh, untuk menekan **CLS** (layout shift).

7. **Ganti `<marquee>` dengan animasi CSS** (`@keyframes` + `transform`) — lebih
   ringan, modern, dan tidak deprecated.

8. **Bersihkan CSS tak terpakai** milik slider & popup (`.slider-*`,
   `.image-popup`, `#popup-*`, `.dot`, dll) karena fiturnya sudah dihapus.

9. **Hindari `via.placeholder.com`** pada `onerror`; pakai gambar placeholder
   lokal atau data-URI agar tidak ada request gagal beruntun.

10. **Tunda Histats** sampai `window.load`/idle (sekarang async, tapi tetap bisa
    dijadwalkan saat idle bersama Chatango).

11. **Lighthouse / PageSpeed Insights.** Jalankan di halaman asli untuk
    mengukur LCP, CLS, TBT — agar optimasi berikutnya berbasis data nyata.

---

### Ringkasan
File aman dari bug serius pada bagian yang terlihat; satu bug CSS nyata (media
query hilang) sudah diperbaiki, kode mati dibersihkan, dan beberapa optimasi
loading yang aman sudah diterapkan langsung. Peningkatan terbesar berikutnya ada
di sisi aset: **GIF iklan → WebP/MP4** dan **subset Font Awesome**.
