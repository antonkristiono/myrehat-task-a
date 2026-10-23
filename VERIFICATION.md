# Catatan verifikasi (3 baris)

1. **Fungsional** — `node demo/test.cjs` di Chromium sungguhan: 21/21 assertion lolos (search listing, kategori gabungan, header search, total RM 350 ↔ RM 8.400, submit booking → konfirmasi, 390px tanpa scroll horizontal, section promo tetap tampil).
2. **PHP/keamanan** — `php -l` bersih; `do_action('myrehat_trail_viewed', 42, 1)` menaikkan `trail_views_42` dari kosong ke `1` (B3); POST tanpa nonce ditolak `302 → ?booking=invalid` dan tidak membuat transient apa pun (B2); `grep` tidak menemukan `__()`/`_e()` tanpa text-domain (B1).
3. **Server & UI** — `md5sum` 4 file theme identik antara repo dan server, `wp option get blogname` = `Tropic Hiking Trails`, hero ter-render oleh Elementor (`h1.elementor-heading-title`), dan screenshot desktop 1280px + mobile 390px tersimpan di `demo/shots/`.
