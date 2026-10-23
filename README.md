# Tropic Hiking Trails — MyRehat Junior SE Task A

Perbaikan 12 bug front-end (A1–A12) + 3 bug PHP (B1–B3) pada child theme
`myrehat-test` (parent: Hello Elementor), plus rebuild hero sebagai Elementor
section dan export JSON-nya.

Situs: <http://task12.34-21-153-205.nip.io>

---

## 1. Ringkasan perbaikan

| ID | Masalah | Perbaikan | File |
|----|---------|-----------|------|
| A1 | Pencarian listing mati, error di console | `trails.js` mencari `#searchInput` dan `#no-results` yang tidak ada; `addEventListener` pada `null` melempar error sehingga **semua** handler setelahnya (termasuk submit booking) tidak pernah terpasang. ID diganti ke `#search-box` / `#trails-no-results`, handler dibungkus guard. | `trails.js` |
| A2 | Dropdown kategori tidak berfungsi | Satu fungsi `applyFilters()` menerapkan teks **dan** kategori sekaligus; event `change` pada `#category`. | `trails.js` |
| A3 | Belum ada tombol WhatsApp/LINE | Bar floating `position: fixed`, `font-weight: 700`, ikon SVG inline, link `wa.me` + `line.me`. | `functions.php`, `style.css` |
| A4 | Footer berantakan | Nav footer hanya menyisakan **FAQ, Contact Us, PDPA, Privacy Policy**. Blog/Careers/ToS/Sitemap/Twitter dihapus. | `page-trails.php` |
| A5 | Judul salah | `<h1>` menjadi **Tropic Hiking Trails** (site title & `<title>` juga diset). | Elementor hero, `wp option blogname` |
| A6 | Tidak ada pilihan Digital Nomad | Radio **Yes / No**, `required`, divalidasi ulang di server. | `page-trails.php`, `functions.php` |
| A7 | 390px: section hilang + geser kanan-kiri | Penyebab hilang: `.trails-promo { display: none }` di `@media (max-width: 600px)`. Penyebab geser: `.trail-card { min-width: 320px }` di dalam flex row. Diganti CSS grid `minmax(min(100%, 300px), 1fr)` + `min-width: 0`. | `style.css` |
| A8 | Belum ada ikon sosial | Facebook, LinkedIn, Instagram, TikTok, YouTube (SVG inline, `aria-label`, `rel="noopener noreferrer"`). | `page-trails.php`, `functions.php` |
| A9 | Tidak ada "I agree to the Host Terms" | Checkbox `required` + dicek di server. | `page-trails.php`, `functions.php` |
| A10 | Search di header mati | Input `#main-search` (di hero) memakai filter yang sama; kedua input saling sinkron. | `trails.js` |
| A11 | Tidak ada Daily/Monthly + total | Radio `plan`; total dihitung live: Daily `350`, Monthly `350 × 30 × 0.8 = 8.400`. Angka harian/bulan/diskon berasal dari konstanta PHP dan dikirim ke JS lewat `data-*` di form (satu sumber kebenaran). | `page-trails.php`, `trails.js`, `functions.php` |
| A12 | Tidak ada konfirmasi otomatis | POST → `admin-post.php` → redirect (PRG) dengan token acak → blok konfirmasi server-side berisi nama, tanggal, plan, total, Digital Nomad. | `functions.php`, `page-trails.php` |
| B1 | `__()` tanpa text-domain | `__( 'Book a guided hike', 'myrehat-test' )`, plus `load_child_theme_textdomain()`. | `functions.php` |
| B2 | `$_POST` mentah, tanpa nonce | `wp_verify_nonce()` + `sanitize_text_field` / `sanitize_email` / `sanitize_key` + validasi tanggal + `wp_safe_redirect()` + token transient (data user tidak masuk URL). | `functions.php` |
| B3 | Hook counter argumen salah | `add_action( 'myrehat_trail_viewed', ..., 10, 2 )` sehingga `$trail_id` tidak lagi `null`; callback juga menolak ID 0. | `functions.php` |

---

## 2. Struktur repo

```
wp-content/themes/myrehat-test/    # child theme hasil perbaikan
  functions.php                    # B1, B2, B3 + tombol sticky + hero helper
  page-trails.php                  # template front page
  style.css                        # layout + responsive 390px
  trails.js                        # A1, A2, A10, A11
elementor/
  tropic-hiking-trails-hero.json   # export JSON hero (Elementor section)
demo/
  video/tropic-hiking-trails-demo.mp4   # 2:27, voice-over Bahasa Indonesia
  shots/                           # screenshot bukti (desktop + 390px)
  test.cjs                         # 21 assertion otomatis (Playwright)
  narration.json                   # teks voice-over per segmen
  build/
    tts.sh                         # edge-tts -> mp3 + durations.json
    record.cjs                     # rekam layar, pacing ikut durasi audio
    cards.cjs                      # kartu intro/outro
    make-video.cjs                 # caption + audio + mux -> mp4
PROMPT-LOG.md
VERIFICATION.md
```

---

## 3. Hero sebagai Elementor section

Hero dibangun sebagai **section Elementor** (bukan HTML hard-coded): 1 section,
1 column, 3 widget — `heading` (h1 *Tropic Hiking Trails*), `text-editor`
(subtitle), `html` (input pencarian `#main-search`).

- Template tersimpan di Elementor Library dengan tipe `section`
  (`elementor_library` post + meta `_elementor_data`).
- File export: `elementor/tropic-hiking-trails-hero.json`
  (format import Elementor: `{ content, page_settings, version, title, type }`).
- Dirender di front page lewat
  `Elementor\Plugin::$instance->frontend->get_builder_content_for_display()`
  dan **fallback ke hero PHP** bila template belum diimport.

Cara import ulang:

```
Elementor → Templates → Saved Templates → Import Templates
pilih elementor/tropic-hiking-trails-hero.json
```

> Catatan teknis: `_elementor_data` harus berisi **array elemen** saja —
> kalau seluruh objek export (yang punya key `content`, `version`, …)
> dimasukkan apa adanya, Elementor 4.3 melempar
> `extract_element_id(): Argument #1 must be of type array, string given`
> dan halaman jadi 500.

---

## 4. Menjalankan verifikasi

```bash
# 21 assertion UI (desktop 1280px + mobile 390px)
NODE_PATH=<path ke node_modules playwright> node demo/test.cjs
```

Hasil terakhir: **21 passed, 0 failed**.

---

## 5. Video demo

`demo/video/tropic-hiking-trails-demo.mp4` — 2 menit 27 detik, 1280×800, H.264 + AAC,
**voice-over Bahasa Indonesia** dan caption per langkah.

| Bagian | Isi |
|--------|-----|
| 0:00–0:03 | Kartu intro |
| 0:03–0:21 | Overview halaman + A1 pencarian listing |
| 0:21–0:39 | A2 kategori digabung dengan pencarian |
| 0:39–0:56 | A10 pencarian di header |
| 0:56–1:04 | A6 + A9 Digital Nomad & Host Terms |
| 1:04–1:12 | A11 Daily / Monthly, total RM 350 ↔ RM 8.400 |
| 1:12–1:27 | A12 submit → konfirmasi otomatis |
| 1:27–1:47 | A7 mobile 390px (di-pillarbox agar terbaca) |
| 1:47–2:22 | Penjelasan 2 perbaikan tersulit |
| 2:22–2:27 | Kartu penutup + link repo |

Voice-over dibuat dengan `edge-tts` (`id-ID-ArdiNeural`) dari `demo/narration.json`.
Kalau mau pakai suara sendiri, ganti segmen di `demo/narration.json` lalu jalankan
tiga langkah ini — durasi video otomatis ikut panjang audio:

```bash
EDGE_TTS=<path edge-tts> ./demo/build/tts.sh      # 1. audio + durations.json
node demo/build/cards.cjs                          # 2. kartu intro/outro
node demo/build/record.cjs                         # 3. rekam (pacing = durasi audio)
node demo/build/make-video.cjs                     # 4. caption + mux -> mp4
```

Untuk mengganti dengan rekaman suara sendiri: taruh mp3 per segmen di
`demo/build/audio/` (nama `00.mp3` … `08.mp3`), lalu jalankan langkah 2–4.

---

## 6. Catatan

- Tidak ada plugin cache aktif; kalau browser menampilkan versi lama, hard-refresh.
- Nomor WhatsApp/LINE dan URL sosial memakai placeholder — ganti di
  `myrehat_test_quick_contact()` (`functions.php`) dan array `$myrehat_socials`
  (`page-trails.php`).
- Field **Email** ditambahkan pada form booking supaya konfirmasi punya kanal
  balasan; bukan bagian dari 12 bug, tapi dibutuhkan alur booking yang utuh.
