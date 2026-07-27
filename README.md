# Extractor Template Journal (Sinta ke Scopus)

Aplikasi web satu halaman untuk mencari jurnal ilmiah lalu langsung membuka panduan penulis dan berkas template artikelnya. Cakupan sumber: Sinta, DOAJ, OpenAlex, dan Scopus.

## Fitur

- Pencarian kata kunci bebas dengan filter 15 bidang ilmu, termasuk opsi semua bidang.
- Hasil dari beberapa sumber digabung dan dideduplikasi berdasarkan ISSN, jurnal Scopus dan Sinta muncul lebih dulu.
- Setiap kartu jurnal memberi enam pintu masuk: panduan penulis resmi, situs jurnal, halaman submission, pencarian berkas template docx, profil Sinta, dan halaman sumber Scopus.
- Ekspor hasil ke CSV.
- Mode terang dan gelap otomatis, responsif sampai lebar 390 piksel.

## Sumber data

| Sumber | Cara akses | Kunci API |
| --- | --- | --- |
| DOAJ | API v4 langsung dari browser | tidak perlu |
| OpenAlex | API sources langsung dari browser | tidak perlu |
| Scopus | `api/scopus.js` (Elsevier Serial Title), jatuh balik ke penanda indeksasi OpenAlex | opsional |
| Sinta | `api/sinta.js` mengambil dan mengurai halaman Sinta di sisi server | tidak perlu |

Sinta tidak menyediakan API publik dan memblokir permintaan lintas domain, karena itu pengambilannya harus lewat fungsi serverless. Saat berkas `index.html` dibuka langsung dari disk, sumber Sinta diganti tautan pencarian.

## Struktur

```
.
|- index.html        antarmuka dan seluruh logika sisi klien
|- api/sinta.js      fungsi serverless: pengambil dan pengurai Sinta
|- api/scopus.js     fungsi serverless: pembungkus Elsevier Serial Title API
|- vercel.json       konfigurasi fungsi dan header
|- package.json
```

## Menjalankan secara lokal

```bash
npm i -g vercel
vercel dev
```

Buka `http://localhost:3000`. Tanpa `vercel dev`, buka `index.html` langsung di browser: DOAJ dan OpenAlex tetap jalan, Sinta berubah menjadi tautan.

## Deploy ke Vercel

1. Buka [vercel.com/new](https://vercel.com/new), pilih **Import Git Repository**, lalu pilih repositori ini.
2. Framework Preset: **Other**. Build Command dan Output Directory dibiarkan kosong.
3. Klik **Deploy**. Tidak ada proses build, jadi selesai dalam hitungan detik.

### Kunci Scopus (opsional)

Di Vercel: **Settings, Environment Variables**, tambahkan

| Name | Value |
| --- | --- |
| `SCOPUS_API_KEY` | kunci dari dev.elsevier.com |

Lakukan redeploy setelah menambahkannya. Tanpa kunci, status indeksasi Scopus tetap terbaca dari metadata OpenAlex.

## Catatan teknis

- Pengambilan berkas template `.docx` tidak dilakukan otomatis. Situs jurnal umumnya menolak pembacaan lintas domain, jadi aplikasi mengarahkan ke halaman panduan resmi dan pencarian berkas.
- Respons fungsi serverless disimpan sementara oleh CDN Vercel selama satu jam untuk mengurangi beban ke Sinta.
- Parser Sinta bergantung pada struktur HTML situs Sinta. Bila tampilan Sinta berubah, sesuaikan pola pada `api/sinta.js`.

## Lisensi

MIT.
