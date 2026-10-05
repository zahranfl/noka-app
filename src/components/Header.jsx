import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearAuthSession } from '../utils/authSession'
import './Header.css'

function Header({ title, tag }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return undefined

    const closeOnOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [menuOpen])

  const logout = () => {
    setMenuOpen(false)
    clearAuthSession()
    navigate('/login')
  }

  return (
    <header className="header">
      <h2>{title}</h2>
      {tag && (
        <div className="header-account" ref={menuRef}>
          <button
            type="button"
            className="tag header-account-trigger"
            aria-expanded={menuOpen}
            aria-haspopup="true"
            aria-controls="header-account-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {tag}
          </button>
          {menuOpen && (
            <div className="header-account-menu" id="header-account-menu">
              <button type="button" onClick={logout}>
                Keluar
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}

export default Header
