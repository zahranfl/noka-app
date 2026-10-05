// Ubah kalimat hasil STT jadi data transaksi.
// Contoh: "jual nasi goreng 25 porsi 375 ribu" -> masuk, 375000
// Ini versi sederhana. Nanti bisa diganti parsing di backend.
const KATA_KELUAR = ['beli', 'bayar', 'belanja', 'keluar', 'ongkos', 'gaji', 'sewa']

export function parseTransaksi(teks) {
  const t = teks.toLowerCase()
  const tipe = KATA_KELUAR.some((k) => t.includes(k)) ? 'keluar' : 'masuk'

  const hasil = [...t.matchAll(/(\d+(?:[.,]\d+)*)\s*(ribu|rb|juta|jt)?/g)].map((m) => {
    const [, angka, satuan] = m
    let nilai
    if (/^\d{1,3}(\.\d{3})+$/.test(angka)) nilai = Number(angka.replace(/\./g, ''))
    else nilai = parseFloat(angka.replace(',', '.'))
    if (satuan === 'ribu' || satuan === 'rb') nilai *= 1000
    if (satuan === 'juta' || satuan === 'jt') nilai *= 1000000
    return { nilai, adaSatuan: Boolean(satuan) }
  })

  // Utamakan angka yang ada "ribu/juta"-nya, kalau gak ada ambil yang terbesar
  const kandidat = hasil.filter((h) => h.adaSatuan)
  const pool = kandidat.length ? kandidat : hasil
  const jumlah = pool.length ? Math.max(...pool.map((h) => h.nilai)) : 0

  return {
    tipe,
    keterangan: teks,
    jumlah,
    kategori: tipe === 'masuk' ? 'penjualan' : 'operasional',
  }
}
