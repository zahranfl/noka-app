import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Button from '../components/Button'
import Input from '../components/Input'
import TransaksiModal from '../components/TransaksiModal'
import { MicIcon } from '../components/Icons'
import useAudioTransaction from '../hooks/useAudioTransaction'
import { getAuthSession } from '../utils/authSession'
import { useTransaksi, MODAL_AWAL } from '../context/TransaksiContext'
import './Dashboard.css'

const FILTER = [
  { value: 'Harian', label: 'Harian', hari: 1 },
  { value: 'Mingguan', label: 'Mingguan', hari: 7 },
  { value: 'Bulanan', label: 'Bulanan', hari: 30 },
]
const rupiah = (n) => 'Rp ' + Number(n).toLocaleString('id-ID')

function Dashboard() {
  const navigate = useNavigate()
  const { list, tambah, saldoBackend, loading: transactionsLoading, error: transactionsError, refresh } = useTransaksi()
  const [filter, setFilter] = useState('Mingguan')
  const [modal, setModal] = useState(null) // { mode, initial } | null
  const {
    recording,
    processing,
    transcript,
    error,
    start,
    stop,
  } = useAudioTransaction()
  const session = getAuthSession()

  // Sisa kas = modal awal + semua pemasukan - semua pengeluaran
  const sisaKas = useMemo(
    () => saldoBackend
      ? MODAL_AWAL + saldoBackend.saldo
      : list.reduce((s, t) => s + (t.tipe === 'masuk' ? t.jumlah : -t.jumlah), MODAL_AWAL),
    [list, saldoBackend],
  )

  // Total sesuai filter periode
  const { masuk, keluar } = useMemo(() => {
    const hari = FILTER.find((f) => f.value === filter).hari
    const batas = new Date()
    batas.setHours(0, 0, 0, 0)
    batas.setDate(batas.getDate() - (hari - 1))
    return list
      .filter((t) => new Date(t.tanggal) >= batas)
      .reduce((acc, t) => ({ ...acc, [t.tipe]: acc[t.tipe] + t.jumlah }), { masuk: 0, keluar: 0 })
  }, [list, filter])

  const total = masuk + keluar
  const chart = total
    ? [{ name: 'masuk', value: masuk }, { name: 'keluar', value: keluar }]
    : [{ name: 'kosong', value: 1 }]
  const persen = (n) => (total ? Math.round((n / total) * 100) : 0)
  const aman = masuk >= keluar

  const handleMic = () => {
    if (recording) return stop()
    if (processing) return
    start(({ transaction }) => setModal({ mode: 'verifikasi', initial: transaction }))
  }

  const handleSave = async (data) => {
    await tambah(data)
    setModal(null)
  }

  return (
    <>
      <Header title="Dashboard" tag={`Hi, ${session?.nama || 'Pengguna'}`} />
      <div className="content">
        <div className="card">
          <div className="small">Sisa kas modal</div>
          <div className="big">{rupiah(sisaKas)}</div>
          <div className={`small cash-status ${aman ? 'is-safe' : 'is-unsafe'}`}>
            {aman ? 'Modal belanja aman' : 'Modal belanja belum aman'}
          </div>
          {transactionsLoading && <p className="small transactions-notice" role="status">Memuat transaksi...</p>}
          {transactionsError && (
            <div className="transactions-error" role="alert">
              <p>{transactionsError}</p>
              <Button variant="outline" size="sm" onClick={() => refresh().catch(() => {})}>Coba lagi</Button>
            </div>
          )}
        </div>

        <div className="row stat-row">
          <div className="stat in">Uang masuk ({filter.toLowerCase()})<b>{rupiah(masuk)}</b></div>
          <div className="stat out">Uang keluar ({filter.toLowerCase()})<b>{rupiah(keluar)}</b></div>
        </div>

        <div className="card">
          <div className="card-title">Rangkuman kas</div>
          <div className="filter">
            <span>Filter</span>
            <div className="filter-control">
              <Input value={filter} onChange={(e) => setFilter(e.target.value)} options={FILTER} />
            </div>
          </div>

          <div className="chart-row">
            <div className="chart-container">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={chart} dataKey="value" innerRadius={48} outerRadius={78} startAngle={90} endAngle={-270} stroke="none">
                    {chart.map((c) => <Cell key={c.name} className={`chart-segment-${c.name}`} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {!total && <span className="chart-empty-label">Belum ada transaksi</span>}
            </div>
            <ul className="legend">
              <li className="legend-in"><i /><div>Pemasukan<small>{persen(masuk)}%</small></div></li>
              <li className="legend-out"><i /><div>Pengeluaran<small>{persen(keluar)}%</small></div></li>
            </ul>
          </div>

          <Button variant="green" className="mt" onClick={() => navigate('/rincian')}>Lihat rincian kas</Button>
        </div>

        <div className="mic-area">
          <button
            className={`mic ${recording ? 'active' : ''}`}
            onClick={handleMic}
            disabled={processing}
            aria-label="Catat dengan suara"
          >
            <MicIcon size={34} />
            {processing ? 'Memproses...' : recording ? 'Selesai bicara' : 'Tekan dan bicara'}
          </button>
          {!recording && !processing && (
            <p className="mic-hint">Bicara jelas di tempat tenang, sebutkan transaksi dan jumlahnya.</p>
          )}
          {transcript && <p className="transcript">&ldquo;{transcript}&rdquo;</p>}
          {error && <p className="error">{error}</p>}
        </div>

        <div className="row">
          <Button variant="dark" onClick={() => setModal({ mode: 'masuk' })}>Catat pemasukan</Button>
          <Button variant="orange" onClick={() => setModal({ mode: 'keluar' })}>Catat pengeluaran</Button>
        </div>
      </div>

      {modal && (
        <TransaksiModal
          mode={modal.mode}
          initial={modal.initial}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      <Footer />
    </>
  )
}

export default Dashboard
