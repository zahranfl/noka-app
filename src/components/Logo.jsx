import { useState } from 'react'

// Taruh file logo kamu di: public/logo-noka.png
// Kalau file belum ada, otomatis tampil logo teks "NK".
function Logo({ small = false }) {
  const [gagal, setGagal] = useState(false)

  return (
    <div className={`logo ${small ? 'small' : ''}`}>
      {!gagal ? (
        <img src="/logo-noka.png" alt="NOKA" onError={() => setGagal(true)} />
      ) : (
        <>
          <div className="logo-mark">N<span>K</span></div>
          {!small && <div className="logo-text">NOKA</div>}
        </>
      )}
    </div>
  )
}

export default Logo
