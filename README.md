# LLP Kedungneng Website

Website company profile untuk Koperasi Pertanian Langgeng Lumbung Pangan Kedungneng.

## Stack

- React + Vite
- Supabase
- Cloudflare Pages
- Lucide React

## Supabase

Project yang digunakan:

https://uuzwlckavtkspgsjcysh.supabase.co

Frontend membutuhkan:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Salin `.env.example` menjadi `.env.local` saat development.

## Cloudflare Pages

Build command:

```
npm run build
```

Build output:

```
dist
```

Tambahkan environment variables di Cloudflare Pages:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Cloudflare Pages akan otomatis build ulang saat ada push ke repository.

## Data

Konten publik dibaca dari tabel Supabase:

- `site_settings`
- `site_stats`
- `activities`
- `products`
- `gallery`

Semua tabel menggunakan RLS dan hanya menyediakan SELECT publik untuk konten yang dipublikasikan.
