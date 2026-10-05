# NOKA

Frontend untuk pencatatan transaksi usaha, dengan login backend dan pencatatan suara.

## Menjalankan frontend

```sh
npm install
npm run dev
```

Vite meneruskan request `/api` ke backend dari `VITE_API_TARGET`. Nilai default
mengarahkan ke endpoint ngrok tim backend. Untuk menggantinya, salin `.env.example`
menjadi `.env.local` lalu atur:

```env
VITE_API_BASE_URL=/api
VITE_API_TARGET=https://alamat-backend
```

Sesudah mengubah konfigurasi, mulai ulang dev server. Untuk deployment produksi,
atur `VITE_API_BASE_URL` ke URL backend dan pastikan backend mengizinkan origin
frontend melalui CORS.

## Deploy frontend ke Vercel

1. Push project ini ke repository GitHub, lalu impor repository tersebut di
   Vercel.
2. Gunakan framework preset Vite, build command `npm run build`, dan output
   directory `dist`.
3. Tambahkan environment variable `VITE_API_BASE_URL` pada konfigurasi project
   Vercel dengan URL HTTPS backend yang stabil. Jangan gunakan `/api` atau URL
   tunnel sementara untuk deployment.
4. Deploy ulang setelah mengubah environment variable. `vercel.json` mengarahkan
   route React kembali ke `index.html`, sehingga URL seperti `/login` dapat
   dimuat langsung.
5. Pastikan backend tetap di-host pada layanan publik dan CORS mengizinkan domain
   Vercel. Deploy frontend saja tidak membuat API backend selalu aktif.

## Integrasi yang tersedia

- Login mengirim email dan kata sandi ke `POST /login`, lalu menyimpan token
  sementara di `sessionStorage`.
- Pendaftaran, verifikasi OTP, lupa kata sandi, verifikasi OTP reset, dan ubah
  kata sandi terhubung ke endpoint backend masing-masing.
- Tombol mikrofon merekam audio di browser dan mengirimkannya sebagai multipart
  `file` ke `POST /proses-suara`. Pengguna tetap dapat meninjau hasil sebelum
  menyimpan transaksi. Browser mengaktifkan noise suppression, echo cancellation,
  dan auto gain control bila tersedia.
- Kategori suara dari backend dipetakan ke kategori bawaan; jika backend tidak
  memberi kategori, frontend mencoba mengenali kata umum seperti bahan baku,
  kemasan, dan operasional. Kualitas transkripsi dan ekstraksi jumlah tetap
  bergantung pada pemrosesan suara di backend.
- Transaksi yang dikonfirmasi dikirim ke `POST /transaksi`; daftar transaksi
  dan saldo dimuat dari `GET /transaksi` serta `GET /saldo`. Ketiga endpoint
  mengirim access token sebagai Bearer JWT; transaksi baru dikirim sebagai JSON
  tanpa `user_id`, yang ditentukan backend dari token.
- Perekaman mikrofon membutuhkan izin pengguna dan secure context (HTTPS; atau
  `localhost` untuk pengembangan lokal). Untuk menguji dari ponsel, frontend
  perlu dibuka melalui HTTPS.

## Catatan keamanan sebelum produksi

- Backend saat ini mengirim kredensial dan beberapa parameter sensitif lewat
  query string. Pindahkan password ke request body agar tidak terekspos di URL,
  browser history, atau access log.
- Backend perlu memvalidasi signature JWT dan mengambil identitas pengguna dari
  token pada endpoint terlindungi sebelum aplikasi digunakan dengan data nyata.
- Endpoint OTP mengembalikan kode OTP di response. Jangan kembalikan OTP ke
  frontend pada produksi; kirimkan lewat kanal verifikasi yang dipilih.
