# Menjalankan Task A secara lokal

Stack lokal memakai Docker: WordPress + MariaDB. Tema di repo di-mount langsung,
jadi setiap perubahan `functions.php`, `page-trails.php`, `style.css`, atau
`trails.js` langsung terlihat setelah refresh.

## Prasyarat

- Docker + Docker Compose
- Akses socket Docker (`sudo usermod -aG docker "$USER"` lalu login ulang, atau
  jalankan lewat `sudo -u "$USER" docker ...`)

## Pertama kali (sudah dilakukan di laptop ini)

```bash
cd myrehat-task-a
docker compose -f docker-compose.local.yml up -d

# Instal WordPress core
docker compose -f docker-compose.local.yml run --rm wpcli core install \
  --url=http://localhost:8080 \
  --title='Tropic Hiking Trails' \
  --admin_user=admin \
  --admin_password='AdminLocal123!' \
  --admin_email=admin@example.com \
  --skip-email

# Parent theme + plugin Elementor
docker compose -f docker-compose.local.yml run --rm wpcli theme install hello-elementor --activate
docker compose -f docker-compose.local.yml run --rm wpcli theme activate myrehat-test
docker compose -f docker-compose.local.yml run --rm wpcli plugin install elementor --activate

# Import hero Elementor + jadikan front page
docker compose -f docker-compose.local.yml run --rm \
  -v "$PWD/scripts:/scripts:ro" \
  -v "$PWD/elementor:/elementor:ro" \
  wpcli eval-file /scripts/setup-content.php
```

## Sehari-hari

```bash
cd myrehat-task-a
docker compose -f docker-compose.local.yml up -d
```

| Halaman | URL |
| --- | --- |
| Situs | <http://localhost:8080> |
| WP Admin | <http://localhost:8080/wp-admin> |

Login admin lokal: `admin` / `AdminLocal123!` (ganti kalau perlu).

## Verifikasi

```bash
# butuh paket playwright (contoh: npm i playwright)
BASE_URL=http://localhost:8080/ NODE_PATH=/path/ke/node_modules node demo/test.cjs
```

Hasil di laptop ini: **21 passed, 0 failed**.

## Reset total

```bash
docker compose -f docker-compose.local.yml down -v
```

lalu ulangi langkah "Pertama kali".
