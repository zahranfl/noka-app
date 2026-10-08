import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Button from "../components/Button";
import { ChevronLeft, DownloadIcon } from "../components/Icons";
import { MODAL_AWAL, useTransaksi } from "../context/TransaksiContext";
import { getAuthSession } from "../utils/authSession";
import { exportRincianKasToExcel } from "../utils/exportExcel";
import "./RincianKas.css";

const formatTgl = (iso) => {
  const [tahun, bulan, hari] = iso.split("-").map(Number);
  return new Date(tahun, bulan - 1, hari).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatJumlah = (jumlah) => Number(jumlah).toLocaleString("id-ID");

function RincianKas() {
  const navigate = useNavigate();
  const { list, loading, error, refresh } = useTransaksi();
  const session = getAuthSession();
  const saldoTransaksi = [...list]
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.id - b.id)
    .reduce(
      (hasil, transaksi) => {
        const saldoSebelumnya = hasil.length
          ? hasil[hasil.length - 1].saldo
          : MODAL_AWAL;
        const perubahan =
          transaksi.tipe === "masuk" ? transaksi.jumlah : -transaksi.jumlah;
        hasil.push({ ...transaksi, saldo: saldoSebelumnya + perubahan });
        return hasil;
      },
      [],
    );
  const urut = saldoTransaksi.reverse();

  const handleExport = () => {
    if (!urut.length) return;
    exportRincianKasToExcel(urut, session?.nama);
  };

  return (
    <>
      <Header title="Dashboard" tag={`Hi, ${session?.nama || "Pengguna"}`} />
      <div className="content">
        <div className="rincian-header-bar">
          <div className="back-pill">
            <button onClick={() => navigate("/dashboard")} aria-label="Kembali">
              <ChevronLeft size={18} />
            </button>
            Rincian kas
          </div>

          <Button
            variant="outline"
            size="sm"
            className="btn-export"
            onClick={handleExport}
            disabled={loading || urut.length === 0}
            title={urut.length === 0 ? "Belum ada transaksi untuk diekspor" : "Ekspor data ke Excel"}
          >
            <DownloadIcon size={16} />
            <span>Ekspor Excel</span>
          </Button>
        </div>


        {loading && <p className="small transactions-notice" role="status">Memuat rincian kas...</p>}
        {error && (
          <div className="transactions-error" role="alert">
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={() => refresh().catch(() => {})}>Coba lagi</Button>
          </div>
        )}

        <p className="table-scroll-hint" id="table-scroll-hint">
          Geser tabel ke samping untuk melihat semua kolom.
        </p>
        <div
          className="table-wrap"
          role="region"
          aria-label="Rincian transaksi kas"
          aria-describedby="table-scroll-hint"
          tabIndex={0}
        >
          <table className="cash-table">
            <caption className="visually-hidden">Rincian transaksi dan saldo kas</caption>
            <colgroup>
              <col className="cash-column-date" />
              <col className="cash-column-description" />
              <col className="cash-column-category" />
              <col className="cash-column-amount" />
              <col className="cash-column-amount" />
              <col className="cash-column-balance" />
            </colgroup>
            <thead>
              <tr>
                <th className="pinned-date" scope="col">Tanggal</th>
                <th className="pinned-description" scope="col">Keterangan</th>
                <th scope="col">Kategori</th>
                <th scope="col">Pemasukan</th>
                <th scope="col">Pengeluaran</th>
                <th scope="col">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {urut.length === 0 && (
                <tr>
                  <td colSpan={6} className="center muted">
                    Belum ada transaksi
                  </td>
                </tr>
              )}
              {urut.map((t) => (
                <tr key={t.id}>
                  <td className="pinned-date">{formatTgl(t.tanggal)}</td>
                  <td className="pinned-description transaction-description">
                    {t.keterangan}
                  </td>
                  <td>{t.kategori || "-"}</td>
                  <td className={t.tipe === "masuk" ? "in amount-cell" : "amount-cell"}>
                    {t.tipe === "masuk" ? formatJumlah(t.jumlah) : "-"}
                  </td>
                  <td className={t.tipe === "keluar" ? "out amount-cell" : "amount-cell"}>
                    {t.tipe === "keluar" ? formatJumlah(t.jumlah) : "-"}
                  </td>
                  <td className="balance-cell">
                    {formatJumlah(t.saldo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default RincianKas;
