import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Input from '../components/Input'
import Button from '../components/Button'
import Footer from '../components/Footer'
import { requestPasswordReset, resetPassword } from '../services/backendApi'
import { getUserFacingError, logApiError } from '../utils/userFacingError'
import './AuthPages.css'

function ResetPassword() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const step = state?.verified ? 2 : 1
  const [email, setEmail] = useState(state?.email || '')
  const [sandi, setSandi] = useState({ baru: '', konfirmasi: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const kirimOtp = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await requestPasswordReset(email.trim())
      navigate('/otp', {
        state: {
          email: result.email || email.trim(),
          from: 'reset',
          ...(import.meta.env.DEV && result.otp ? { developmentOtp: String(result.otp) } : {}),
        },
      })
    } catch (requestError) {
      logApiError('Permintaan reset kata sandi gagal', requestError)
      setError(getUserFacingError(requestError))
    } finally {
      setLoading(false)
    }
  }

  const ubah = async (event) => {
    event.preventDefault()
    if (sandi.baru !== sandi.konfirmasi) {
      setError('Konfirmasi kata sandi tidak sama.')
      return
    }

    setError('')
    setLoading(true)
    try {
      await resetPassword({
        email: state.email,
        password: sandi.baru,
        confirmation: sandi.konfirmasi,
      })
      navigate('/login', { state: { passwordReset: true } })
    } catch (resetError) {
      logApiError('Reset kata sandi gagal', resetError)
      setError(getUserFacingError(resetError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {step === 1 ? (
        <form className="content center-v" onSubmit={kirimOtp}>
          <div className="box">
            <h1 className="reset-title">Lupa kata sandi?</h1>
            <p className="reset-description">Kami akan mengirim kode verifikasi ke email terdaftar.</p>
            <Input
              label="Email"
              type="email"
              placeholder="nama@contoh.com"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            {error && <p className="error" role="alert">{error}</p>}
            <div className="row reset-actions">
              <Button variant="outline" size="sm" onClick={() => navigate('/login')}>Batal</Button>
              <Button type="submit" variant="black" size="sm" disabled={loading}>
                {loading ? 'Mengirim...' : 'Kirim OTP'}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <form className="content reset-new-password" onSubmit={ubah}>
          <h1 className="reset-title">Buat kata sandi baru</h1>
          <p className="reset-description">Akun: {state.email}</p>
          <Input
            label="Kata sandi baru"
            placeholder="Masukkan kata sandi baru"
            type="password"
            autoComplete="new-password"
            value={sandi.baru}
            onChange={(event) => setSandi({ ...sandi, baru: event.target.value })}
            required
            minLength={6}
          />
          <Input
            label="Konfirmasi kata sandi"
            placeholder="Ulangi kata sandi baru"
            type="password"
            autoComplete="new-password"
            value={sandi.konfirmasi}
            onChange={(event) => setSandi({ ...sandi, konfirmasi: event.target.value })}
            required
          />
          {error && <p className="error" role="alert">{error}</p>}
          <Button type="submit" variant="dark" className="reset-submit" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Ubah kata sandi'}
          </Button>
        </form>
      )}
      <Footer />
    </>
  )
}

export default ResetPassword
