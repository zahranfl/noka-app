import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import Input from '../components/Input'
import Button from '../components/Button'
import Footer from '../components/Footer'
import Logo from '../components/Logo'
import { loginToBackend } from '../services/backendApi'
import { saveAuthSession } from '../utils/authSession'
import { getUserFacingError, logApiError } from '../utils/userFacingError'
import './AuthPages.css'

function Login() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const session = await loginToBackend(email.trim(), password)
      saveAuthSession(session)
      navigate('/dashboard')
    } catch (loginError) {
      if (loginError.code === 'INVALID_CREDENTIALS') {
        setError(getUserFacingError(loginError))
      } else if (loginError.code === 'ACCOUNT_NOT_VERIFIED') {
        setError(getUserFacingError(loginError))
      } else {
        logApiError('Login gagal', loginError)
        setError(getUserFacingError(loginError))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form className="content" onSubmit={submit}>
        <Logo />
        <div className="auth-heading">
          <span className="section-kicker">SELAMAT DATANG KEMBALI</span>
          <h1>Masuk ke NOKA</h1>
        </div>
        {(state?.registered || state?.passwordReset) && (
          <p className="auth-success" role="status">
            {state.registered
              ? 'Akun berhasil diverifikasi. Silakan masuk.'
              : 'Kata sandi berhasil diubah. Silakan masuk.'}
          </p>
        )}
        <Input
          label="Email"
          placeholder="nama@contoh.com"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Kata sandi"
          placeholder="Masukkan kata sandi"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="error login-error" role="alert">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? 'Memeriksa...' : 'Masuk'}
        </Button>
        <p className="center login-reset-link">
          Lupa kata sandi? <Link to="/reset-password">klik disini</Link>
        </p>
        <p className="center login-signup-prompt">Belum punya akun?</p>
        <Button variant="orange" onClick={() => navigate('/daftar')}>Daftar</Button>
      </form>
      <Footer />
    </>
  )
}

export default Login
