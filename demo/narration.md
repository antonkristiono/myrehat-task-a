# Narasi video demo (≤ 5 menit)

Rekaman ada di `demo/video/tropic-hiking-trails-demo.mp4` (±35 detik, tanpa
suara). Rekam ulang dengan suara memakai script ini, atau tambahkan voice-over
ke video yang sama. Kalau mau lebih panjang, jeda antar bagian bisa
diperpanjang di `demo/record.cjs`.

| Waktu | Yang tampil | Yang dikatakan |
|-------|-------------|----------------|
| 0:00–0:06 | Home desktop: header, hero Elementor, promo, 6 kartu trail | "Ini halaman Trails setelah perbaikan. Hero-nya sekarang section Elementor, judulnya Tropic Hiking Trails, dan tombol WhatsApp/LINE mengambang tetap di atas saat discroll." |
| 0:06–0:10 | Ketik `kinabalu` di search listing | "Pencarian listing sebelumnya mati karena JS-nya mencari id `searchInput` yang tidak ada, jadi error pertama menghentikan semua handler. Sekarang filter jalan dan pesan 'No trails found' muncul saat kosong." |
| 0:10–0:16 | Pilih kategori Forest, lalu tambah kata `mount` | "Dropdown kategori digabung dengan pencarian dalam satu fungsi filter: Forest + 'mount' hasilnya nol, dan itu benar." |
| 0:16–0:20 | Ketik `belum` di search header | "Search di header memakai filter yang sama, jadi dua kotak pencarian tidak pernah beda hasil." |
| 0:20–0:24 | Isi form, klik Monthly → total berubah `RM 8,400`, balik ke Daily `RM 350` | "Daily flat RM 350. Monthly dihitung 350 kali 30 hari kali 0,8 = RM 8.400, berubah langsung saat radio diganti. Angkanya didefinisikan sekali di PHP lalu dikirim ke JS lewat data attribute." |
| 0:24–0:29 | Centang Digital Nomad + Host Terms, submit, muncul konfirmasi | "Digital Nomad dan Host Terms wajib. Setelah submit, halaman redirect dan menampilkan konfirmasi berisi nama, tanggal, plan, dan total." |
| 0:29–0:35 | Resize ke 390px, scroll ke promo dan footer | "Di 390px tidak ada geser horizontal lagi — penyebabnya `min-width: 320px` di kartu flex, sekarang CSS grid. Section promo juga muncul kembali karena aturan `display:none` di media query sudah dihapus." |

## Dua perbaikan tersulit (1–2 kalimat, sesuai brief)

1. **B2 + A12 — alur booking yang aman sekaligus memberi konfirmasi.**
   Saya ubah dari `$_POST` mentah menjadi POST ke `admin-post.php` dengan
   `wp_verify_nonce` + sanitasi per field, lalu redirect (POST–Redirect–GET)
   membawa token acak ke transient satu jam — jadi data pelanggan tidak pernah
   masuk URL, tapi konfirmasi tetap bisa dirender server-side.

2. **A1 + A2 + A10 — satu sumber state untuk pencarian.**
   Akar masalahnya bukan cuma id yang salah, tapi error `null.addEventListener`
   yang membunuh seluruh file JS; setelah itu saya satukan pencarian listing,
   kategori, dan pencarian header ke satu `applyFilters()` supaya ketiganya
   mustahil menghasilkan daftar yang berbeda.
