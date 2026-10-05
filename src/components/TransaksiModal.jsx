import { useState } from "react";
import Modal from "./Modal";
import Input from "./Input";
import Button from "./Button";
import { useTransaksi } from "../context/TransaksiContext";
import { getUserFacingError, logApiError } from "../utils/userFacingError";
import "./TransaksiModal.css";

const judul = {
  verifikasi: "Verifikasi transaksi",
  masuk: "Transaksi pemasukan",
  keluar: "Transaksi pengeluaran",
};

const TIPE = [
  { value: "masuk", label: "Pemasukan" },
  { value: "keluar", label: "Pengeluaran" },
];
const KATEGORI_BARU = "__kategori_baru__";
const KATEGORI_BAWAAN = ["bahan baku", "kemasan", "operasional"];

// mode: 'verifikasi' (hasil suara) | 'masuk' | 'keluar' (input manual)
function TransaksiModal({ mode, initial, onClose, onSave }) {
  const { list } = useTransaksi();
  const [form, setForm] = useState({
    tipe: mode === "keluar" ? "keluar" : "masuk",
    keterangan: "",
    jumlah: "",
    kategori: "",
    ...initial,
  });
  const [kategoriBaru, setKategoriBaru] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isVerif = mode === "verifikasi";
  const locked = isVerif && !editing;
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const title = isVerif && editing ? "Edit transaksi" : judul[mode];
  const kategoriTersedia = Array.from(
    new Map(
      [...KATEGORI_BAWAAN, ...list.map((transaksi) => transaksi.kategori)]
        .concat(form.kategori)
        .filter(Boolean)
        .map((kategori) => [kategori.trim().toLocaleLowerCase("id-ID"), kategori.trim()]),
    ).values(),
  );
  const kategoriOptions = [
    { value: "", label: "Pilih kategori" },
    ...kategoriTersedia.map((kategori) => ({ value: kategori, label: kategori })),
    { value: KATEGORI_BARU, label: "+ Tambah kategori baru" },
  ];
  const tambahKategori = form.kategori === KATEGORI_BARU;

  const submit = async (e) => {
    e.preventDefault();
    const kategori = tambahKategori ? kategoriBaru.trim() : form.kategori;
    if (!kategori) {
      setError("Pilih kategori transaksi terlebih dahulu.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({ ...form, kategori, jumlah: Number(form.jumlah) || 0 });
    } catch (saveError) {
      logApiError("Penyimpanan transaksi gagal", saveError);
      setError(getUserFacingError(saveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit}>
        <Input
          label="Keterangan"
          placeholder="Input"
          value={form.keterangan}
          onChange={set("keterangan")}
          disabled={locked}
          required
        />
        <Input
          label="Kategori"
          options={kategoriOptions}
          value={form.kategori}
          onChange={set("kategori")}
          disabled={locked}
          required
        />
        {tambahKategori && (
          <Input
            label="Nama kategori baru"
            placeholder="Contoh: transportasi"
            value={kategoriBaru}
            onChange={(e) => setKategoriBaru(e.target.value)}
            disabled={locked}
            maxLength={40}
            required
          />
        )}
        <Input
          label="Tipe"
          value={form.tipe}
          onChange={set("tipe")}
          disabled={locked || !isVerif}
          options={TIPE}
        />
        <Input
          label="Jumlah (Rp)"
          type="number"
          min="0"
          placeholder="Input"
          value={form.jumlah}
          onChange={set("jumlah")}
          disabled={locked}
          required
        />

        {error && <p className="error transaction-save-error" role="alert">{error}</p>}
        <div className="row">
          <Button type="submit" variant="mint" disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
          {isVerif && !editing && (
            <Button variant="orange" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}

export default TransaksiModal;
