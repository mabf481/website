-- SETUP ADMIN DASHBOARD LLP KEDUNGNENG
-- 1. Buat user admin terlebih dahulu di Supabase Dashboard:
--    Authentication > Users > Add user.
-- 2. Salin UUID user tersebut.
-- 3. Ganti UUID di bawah lalu jalankan SQL ini.

insert into public.admin_users (user_id)
values ('GANTI-DENGAN-UUID-USER-ADMIN')
on conflict (user_id) do nothing;

-- Untuk melihat user yang tersedia:
-- select id, email, created_at from auth.users order by created_at desc;
