import { useState, useRef } from 'react'

// Hook STT pakai Web Speech API bawaan browser (Chrome/Edge)
function useSpeech() {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')
  const recRef = useRef(null)

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  const supported = Boolean(SR)

  // onDone dipanggil sekali, setelah ucapan selesai, bawa teks hasil
  const start = (onDone) => {
    if (!SR) {
      setError('Browser belum mendukung suara. Pakai Chrome atau Edge ya.')
      return
    }
    setError('')
    setTranscript('')

    const rec = new SR()
    rec.lang = 'id-ID'
    rec.interimResults = true
    rec.continuous = false

    rec.onstart = () => setListening(true)
    rec.onresult = (e) => {
      const teks = Array.from(e.results).map((r) => r[0].transcript).join('')
      setTranscript(teks)
      if (e.results[e.results.length - 1].isFinal && onDone) onDone(teks)
    }
    rec.onerror = (e) => {
      setError(e.error === 'not-allowed' ? 'Izin mikrofon ditolak.' : 'Suara gak kedengeran, coba lagi.')
      setListening(false)
    }
    rec.onend = () => setListening(false)

    recRef.current = rec
    rec.start()
  }

  const stop = () => recRef.current?.stop()

  return { listening, transcript, error, supported, start, stop }
}

export default useSpeech
