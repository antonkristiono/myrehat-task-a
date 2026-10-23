# Prompt log

Log ini merekam instruksi yang dipakai untuk mengerjakan Task A, dalam urutan
eksekusi. Disusun ulang dari sesi kerja (bukan transkrip mentah), supaya
langkah dan alasannya bisa diikuti.

Model: AI coding agent (OpenCode) + eksekusi langsung terhadap server task.

---

## Prompt 0 — konteks tugas

```
Saya dapat soal seperti ini bisa bantu saya

Halo Anton Kristiono, dari MyRehat — lamaran Junior SE kamu lolos seleksi awal 🎉

TASK A — WordPress (di server kami, ±60-90 mnt)
1. Situs kamu: http://task12.34-21-153-205.nip.io
2. Login WP (/wp-login.php): user candidate_task12 pass Fa9IAzOTYMgIjIPo
3. SSH (edit file, wp-cli, git): ssh candidate_task12@34.21.153.205 pass JeHb4uunBZi3WhRp
   — langsung masuk ke folder situs kamu
4. Perbaiki 12 bug ini: A1..A12 (lihat brief)
5. PHP (file functions.php theme): B1 translation tanpa text-domain → perbaiki;
   B2 input form dipakai mentah tanpa nonce/sanitasi → amankan;
   B3 hook counter argumen-nya salah → ID selalu null → perbaiki
6. Elementor: rebuild hero section pakai Elementor section, export JSON template, lampirkan
Kirim: link repo GitHub (boleh public) + video demo ≤5 mnt + prompt log AI + catatan verifikasi 3 baris.
```

**Tujuan yang saya tetapkan dari prompt itu:**
1. Inventaris dulu, jangan ubah apa pun sebelum tahu struktur theme.
2. Tiap bug dipetakan ke file + baris penyebab, bukan tambal di level gejala.
3. Verifikasi harus otomatis dan bisa diulang (bukan "sudah saya cek, aman").

---

## Prompt 1 — inventaris server

```
Cek akses: HTTP status situs, lalu SSH. Kalau exec non-interaktif tidak
mengembalikan output, pakai PTY (-tt). Laporkan: theme aktif, parent theme,
plugin aktif, wp-cli, isi folder theme, dan apakah ada git repo.
```

Hasil: theme aktif `myrehat-test` (child dari `hello-elementor`), 4 file
(`functions.php`, `page-trails.php`, `style.css`, `trails.js`), WP-CLI 2.12,
Elementor 4.3.4 aktif, bukan git repo.

Temuan proses: perintah non-interaktif di server ini selalu `exit 0` tanpa
output — server hanya memberi shell interaktif. Solusi: wrapper `rsh` yang
mengirim skrip lewat stdin dengan `stty -echo` + marker output.

---

## Prompt 2 — baca kode dan petakan penyebab

```
Baca keempat file theme. Untuk setiap bug A1–A12 dan B1–B3, sebutkan baris
penyebabnya dan jelaskan kenapa gejalanya seperti itu. Jangan langsung menulis
kode.
```

Temuan kunci yang menentukan arah perbaikan:
- `trails.js` baris 2: `getElementById('searchInput')` → `null` →
  `input.addEventListener` melempar `TypeError` → **semua** kode setelahnya
  tidak dieksekusi, termasuk submit handler booking.
- `#no-results` vs `#trails-no-results` — salah id kedua.
- `style.css` `@media (max-width: 600px) { .trails-promo { display: none } }`
  → inilah "section yang hilang" di 390px; dan `.trail-card { min-width: 320px }`
  di dalam `.trails-cards { display: flex }` → overflow horizontal.
- `functions.php`: `add_action( ..., 10, 1 )` padahal callback
  `myrehat_test_count_view( $trail_id, $count = 1 )` → `$trail_id` selalu `null`.
- Booking: `$_POST['date']` langsung disimpan, tanpa nonce.

---

## Prompt 3 — tulis ulang theme

```
Tulis ulang functions.php, page-trails.php, style.css, trails.js.
Batasan:
- jangan ubah nama fungsi publik yang sudah dipakai (myrehat_test_*),
- harga (350 / 30 / 0.8) hanya boleh didefinisikan sekali di PHP lalu
  dikirim ke JS lewat data-* attribute,
- form booking harus tetap berfungsi tanpa JS (POST biasa + redirect),
- semua output di-escape, semua string translatable punya text-domain.
```

Keputusan desain:
- **Harga**: konstanta `MYREHAT_DAILY_RATE` / `MONTHLY_DAYS` / `MONTHLY_DISCOUNT`
  → dicetak sebagai `data-daily` / `data-monthly-days` / `data-monthly-discount`
  pada `<form>`. JS tidak menyimpan angka sendiri, jadi tidak mungkin beda
  dengan perhitungan server.
- **Confirmation (A12)**: pola POST → Redirect → GET dengan token acak
  (`wp_generate_password`) + transient 1 jam. Data pelanggan tidak pernah
  masuk query string / URL.
- **Filter (A1/A2/A10)**: satu fungsi `applyFilters()`; kedua input pencarian
  saling sinkron supaya tidak ada dua state berbeda.

---

## Prompt 4 — deploy + cek sintaks

```
Backup file asli ke .original/, upload hasil perbaikan, verifikasi md5
identik, lalu php -l kedua file PHP. Set site title ke "Tropic Hiking Trails".
```

Hasil: 4/4 file md5 identik, `php -l` bersih, blogname & `<title>` berubah.

---

## Prompt 5 — Elementor hero

```
Rebuild hero sebagai Elementor section (heading h1 + text-editor + html widget
berisi input #main-search), simpan sebagai template tipe section di Elementor
Library, render di front page, dan export JSON.
```

Kesalahan yang muncul dan cara memperbaikinya (ini bagian yang paling makan
waktu): saya menyimpan seluruh objek export (`{content, page_settings, version,
title, type}`) ke meta `_elementor_data`. Elementor 4.3 memanggil
`Elements_Interactions::extract_element_id()` untuk setiap item di array itu,
menerima string `"0.4"` (nilai `version`), dan melempar `TypeError` → halaman
500. Perbaikan: `_elementor_data` diisi `wp_json_encode( $export['content'] )`
saja (array elemen), sementara objek lengkap tetap dipakai sebagai file import.

---

## Prompt 6 — verifikasi otomatis

```
Tulis skrip Playwright yang menguji A1–A12 di browser sungguhan
(1280x800 dan 390x844): console error, jumlah kartu setelah search/filter,
kombinasi search+kategori, header search, sticky+fixed+bold, isi footer,
5 ikon sosial, total 350 → 8400, field wajib, submit → konfirmasi,
scrollWidth == clientWidth di 390px.
```

Hasil: 21 assertion, semua PASS. Dua kegagalan awal bukan bug layout:
URL uji memakai `?m=...` yang bertabrakan dengan query var WordPress untuk
bulan (`m`), sehingga halaman menjadi 404 — parameter diganti `?mobile=`.

---

## Prompt 7 — artefak pengumpulan

```
Rekam video demo (desktop → search → booking → resize 390px → footer),
screenshot per langkah, konversi ke mp4, lalu tulis README, prompt log,
catatan verifikasi 3 baris, dan siapkan repo git.
```

---

## Yang *tidak* saya minta ke AI

- Nomor WhatsApp/LINE asli dan URL sosial — masih placeholder, harus diganti.
- Narasi video — direkam sendiri oleh kandidat (script ada di `demo/narration.md`).
