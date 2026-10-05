import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Footer from "../components/Footer";
import Logo from "../components/Logo";
import { ZapIcon, ChartIcon, ShieldIcon, MicIcon } from "../components/Icons";
import "./Home.css";

const langkah = [
  "Daftar akun dengan nama usaha dan email.",
  'Tekan tombol mic lalu ucapkan transaksi, misal "jual nasi goreng 25 porsi 375 ribu".',
  "Cek hasilnya, edit bila perlu, lalu simpan.",
  "Pantau sisa kas dan rangkuman di dashboard.",
];

const keunggulan = [
  {
    ico: <MicIcon size={18} />,
    judul: "Catat pakai suara",
    isi: "Tanpa ngetik, cukup bicara.",
  },
  { ico: <ZapIcon />, judul: "Cepat", isi: "Transaksi tercatat dalam detik." },
  {
    ico: <ChartIcon />,
    judul: "Rangkuman jelas",
    isi: "Grafik harian s/d bulanan.",
  },
  { ico: <ShieldIcon />, judul: "Aman", isi: "Data usaha tersimpan rapi." },
];

function Home() {
  const navigate = useNavigate();
  return (
    <>
      <div className="home">
        <nav className="home-nav">
          <Logo small />
          <Button variant="orange" size="sm" onClick={() => navigate("/login")}>
            Masuk
          </Button>
        </nav>

        <main className="home-content">
          <section className="home-hero">
            <span className="eyebrow">Teman catat usaha</span>
            <h1>
              Catat transaksi lebih mudah, cukup lewat <span>suara.</span>
            </h1>
            <p className="lead">
              NOKA membantu pelaku usaha mengelola pemasukan dan pengeluaran
              tanpa repot mengetik.
            </p>
            <Button
              variant="dark"
              size="sm"
              className="hero-cta"
              onClick={() => navigate("/daftar")}
            >
              Coba Sekarang
            </Button>
          </section>

          <section className="glass">
            <div className="section-heading">
              <span className="section-kicker">MULAI DALAM 4 LANGKAH</span>
              <h3>Cara Penggunaan</h3>
            </div>
            <ol className="steps">
              {langkah.map((l, i) => (
                <li key={i}>
                  <span className="num">{i + 1}</span>
                  <span>{l}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="glass">
            <div className="section-heading">
              <span className="section-kicker">DIBUAT UNTUK USAHA KECIL</span>
              <h3>Keunggulan NOKA</h3>
            </div>
            <div className="features">
              {keunggulan.map((k) => (
                <div className="feature" key={k.judul}>
                  <span className="ico">{k.ico}</span>
                  <b>{k.judul}</b>
                  <span className="muted">{k.isi}</span>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
      <Footer />
    </>
  );
}

export default Home;
