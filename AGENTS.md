# Instruksi Proyek (Smart POS)

Aplikasi ini adalah sistem Point of Sale (POS) Pintar yang dibangun menggunakan React, Vite, Tailwind CSS, dan TypeScript, secara spesifik disesuaikan untuk kebutuhan pengguna di Indonesia.

## Konvensi Penamaan dan Struktur File
- **File Root**: File-file utama di luar folder `components` **HARUS** menggunakan nama umum/standar berbahasa Inggris, yaitu:
  - `App.tsx`
  - `index.tsx`
  - `types.ts`
  - `constants.tsx`
  - `supabase.ts`
  *(Tolong jangan ubah atau terjemahkan nama kelima file di atas)*
- **Komponen**: Komponen-komponen UI ditempatkan di dalam folder `components/` menggunakan PascalCase (contoh: `AdminDashboard.tsx`, `Keranjang.tsx`, `LoginPin.tsx`). Layout dan penamaan variabel/state disesuaikan dengan bahasa Indonesia.
- Jangan sembarangan mengubah atau merapikan nama folder/file yang sudah ada menjadi bahasa Indonesia jika itu adalah standar framework (seperti file root di atas).

## Database & Backend (Supabase)
- Aplikasi terhubung dengan **Supabase**. File koneksinya ada di `supabase.ts`.
- **Autentikasi Kustom**: Autentikasi pengguna menggunakan sistem **Login PIN kustom**, BUKAN menggunakan fitur Supabase Auth standar. Di dalam tabel `users`, telah tersimpan data pengguna beserta `pin` dan `role` mereka (misalnya Admin atau Staf).
- **Row Level Security (RLS)**: Karena tidak memakai Supabase Auth, maka semua table utama (`users`, `products`, `customers`, `orders`) saat ini memiliki RLS policy yang mengizinkan akses `public` (Select, Insert, Update, Delete). Script SQL untuk membuat tabel dan policy ini terdapat pada file `schema.sql`.

## Arsitektur Fitur Utama
- **Login Pin**: Akses masuk berbasis PIN yang membedakan Role (Admin vs Kasir/Staf).
- **Admin Dashboard**: Mengelola sistem (telah dimodularisasi menjadi `AdminProduk`, `AdminStaf`, `AdminMember`, dan `AdminLaporan`).
- **Kasir (POS)**: Katalog produk (`Katalog.tsx`) dan daftar belanja (`Keranjang.tsx`).
- **Transaksi**: Mencatat order (`Riwayat.tsx`) dan generate bukti bayar (`Struk.tsx`).

## Catatan untuk AI Selanjutnya
Jika Anda berinteraksi dengan proyek ini karena hasil **Remix** atau sesi obrolan baru, ingatlah struktur dan konfigurasi Supabase kustom ini supaya fitur yang telah dibuat sebelumnya tetap berjalan lancar dan tidak rusak ketika Anda menambahkan fitur baru.
