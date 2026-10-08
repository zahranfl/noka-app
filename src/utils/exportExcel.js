import * as XLSX from "xlsx";

/**
 * Helper to format ISO date string (YYYY-MM-DD) to ID locale string (DD/MM/YYYY)
 */
const formatTgl = (iso) => {
  if (!iso) return "-";
  const [tahun, bulan, hari] = iso.split("-").map(Number);
  if (!tahun || !bulan || !hari) return iso;
  return new Date(tahun, bulan - 1, hari).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Ekspor data rincian kas ke file Excel (.xlsx)
 * @param {Array} transactions - List transaksi dengan running balance
 * @param {string} userName - Nama pengguna untuk penamaan file & header
 */
export function exportRincianKasToExcel(transactions = [], userName = "Pengguna") {
  // Susun data untuk tabel Excel
  const data = transactions.map((t, index) => ({
    No: index + 1,
    Tanggal: formatTgl(t.tanggal),
    Keterangan: t.keterangan || "-",
    Kategori: t.kategori || "-",
    "Pemasukan (Rp)": t.tipe === "masuk" ? t.jumlah : 0,
    "Pengeluaran (Rp)": t.tipe === "keluar" ? t.jumlah : 0,
    "Saldo (Rp)": t.saldo ?? 0,
  }));

  // Buat worksheet dari JSON
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Atur lebar kolom agar rapi dan tidak terpotong
  worksheet["!cols"] = [
    { wch: 6 },  // No
    { wch: 14 }, // Tanggal
    { wch: 28 }, // Keterangan
    { wch: 18 }, // Kategori
    { wch: 18 }, // Pemasukan
    { wch: 18 }, // Pengeluaran
    { wch: 18 }, // Saldo
  ];

  // Buat workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Rincian Kas");

  // Format nama file: Rincian_Kas_YYYY-MM-DD.xlsx
  const today = new Date().toISOString().slice(0, 10);
  const cleanName = userName ? userName.replace(/[^a-zA-Z0-9]/g, "_") : "NOKA";
  const fileName = `Rincian_Kas_${cleanName}_${today}.xlsx`;

  // Download file
  XLSX.writeFile(workbook, fileName);
}

