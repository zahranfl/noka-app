import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Input from '../components/Input'
import Button from '../components/Button'
import Footer from '../components/Footer'
import Logo from '../components/Logo'
import { registerWithBackend } from '../services/backendApi'
import { getUserFacingError, logApiError } from '../utils/userFacingError'
import './AuthPages.css'

function SignUp() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nama: '', email: '', sandi: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await registerWithBackend({
        nama: form.nama.trim(),
        email: form.email.trim(),
        password: form.sandi,
      })
      navigate('/otp', {
        state: {
          email: result.email || form.email.trim(),
          from: 'register',
          ...(result.otp ? { developmentOtp: String(result.otp) } : {}),
        },
      })
    } catch (registrationError) {
      logApiError('Pendaftaran gagal', registrationError)
      setError(getUserFacingError(registrationError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form className="content" onSubmit={submit}>
        <Logo />
        <Input label="Nama usaha" placeholder="Nama usaha" value={form.nama} onChange={set('nama')} autoComplete="organization" required />
        <Input label="Email" placeholder="nama@contoh.com" type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
        <Input label="Kata sandi" placeholder="Kata sandi" type="password" value={form.sandi} onChange={set('sandi')} autoComplete="new-password" required minLength={6} />
        {error && <p className="error" role="alert">{error}</p>}
        <Button type="submit" className="signup-submit" disabled={loading}>
          {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
        </Button>

        <div className="spacer" />
        <p className="center small">Sudah punya akun?</p>
        <Button variant="orange" className="mt" onClick={() => navigate('/login')}>Masuk</Button>
      </form>
      <Footer />
    </>
  )
}

export default SignUp
