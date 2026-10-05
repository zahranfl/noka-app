import { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Footer from '../components/Footer'
import { ChevronLeft } from '../components/Icons'
import { verifyPasswordResetOtp, verifyRegistrationOtp } from '../services/backendApi'
import { getUserFacingError, logApiError } from '../utils/userFacingError'
import './AuthPages.css'

function Otp() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [kode, setKode] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const refs = useRef([])
  const email = state?.email || ''
  const lengkap = kode.join('').length === 4
  const isReset = state?.from === 'reset'

  const ubah = (i, value) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...kode]
    next[i] = digit
    setKode(next)
    if (digit && i < 3) refs.current[i + 1]?.focus()
  }

  const keyDown = (i, event) => {
    if (event.key === 'Backspace' && !kode[i] && i > 0) refs.current[i - 1]?.focus()
  }

  const paste = (event) => {
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4).split('')
    if (digits.length) {
      event.preventDefault()
      setKode([...digits, '', '', '', ''].slice(0, 4))
    }
  }

  const verifikasi = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isReset) {
        await verifyPasswordResetOtp(email, kode.join(''))
        navigate('/reset-password', { state: { verified: true, email } })
      } else {
        await verifyRegistrationOtp(email, kode.join(''))
        navigate('/login', { state: { registered: true } })
      }
    } catch (verificationError) {
      logApiError('Verifikasi OTP gagal', verificationError)
      setError(getUserFacingError(verificationError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form className="content center otp-page" onSubmit={verifikasi}>
        <button type="button" className="back" onClick={() => navigate(-1)} aria-label="Kembali">
          <ChevronLeft size={26} />
        </button>
        <h1 className="page-title">Verifikasi</h1>
        <p className="small otp-instructions">
          Masukkan 4 digit kode OTP yang dikirim ke email Anda<br />
          <b>{email || 'Email tidak tersedia'}</b>
        </p>
        {state?.developmentOtp && (
          <p className="otp-development-code">
            Kode OTP: <b>{state.developmentOtp}</b>
          </p>
        )}
        <div className="otp" onPaste={paste}>
          {kode.map((digit, i) => (
            <input
              key={i}
              ref={(element) => { refs.current[i] = element }}
              value={digit}
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              onChange={(event) => ubah(i, event.target.value)}
              onKeyDown={(event) => keyDown(i, event)}
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <Button type="submit" disabled={!lengkap || loading} className="otp-submit">
          {loading ? 'Memverifikasi...' : isReset ? 'Verifikasi kode' : 'Verifikasi akun'}
        </Button>
      </form>
      <Footer />
    </>
  )
}

export default Otp
