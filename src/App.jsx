import { Routes, Route, Navigate } from 'react-router-dom'
import { TransaksiProvider } from './context/TransaksiContext'
import Home from './pages/Home'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import ResetPassword from './pages/ResetPassword'
import Otp from './pages/Otp'
import Dashboard from './pages/Dashboard'
import RincianKas from './pages/RincianKas'
import { getAuthSession } from './utils/authSession'

function ProtectedRoute({ children }) {
  return getAuthSession() ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <TransaksiProvider>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/daftar" element={<SignUp />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/otp" element={<Otp />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/rincian" element={<ProtectedRoute><RincianKas /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </TransaksiProvider>
  )
}

export default App