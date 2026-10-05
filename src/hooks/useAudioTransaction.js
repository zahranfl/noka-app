import { useEffect, useRef, useState } from 'react'
import { processVoiceAudio } from '../services/backendApi'
import { getUserFacingError, logApiError } from '../utils/userFacingError'

const MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/ogg;codecs=opus',
  'audio/mp4',
  'audio/webm',
  'audio/ogg',
]

function extensionFromMimeType(mimeType) {
  if (mimeType.includes('ogg')) return 'ogg'
  if (mimeType.includes('mp4')) return 'm4a'
  if (mimeType.includes('webm')) return 'webm'
  return 'audio'
}

function useAudioTransaction() {
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const onCompleteRef = useRef(null)

  const secureContext = window.isSecureContext
  const supported = Boolean(
    navigator.mediaDevices?.getUserMedia && window.MediaRecorder,
  )

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  const start = async (onComplete) => {
    if (!secureContext) {
      setError('Perekaman suara perlu koneksi HTTPS. Alamat IP lokal yang dibuka lewat HTTP belum mengizinkan akses mikrofon.')
      return
    }

    if (!supported) {
      setError('Browser ini belum mendukung perekaman suara. Coba browser versi terbaru.')
      return
    }

    setError('')
    setTranscript('')
    onCompleteRef.current = onComplete

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      streamRef.current = stream
      chunksRef.current = []

      const mimeType = MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type))
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      recorder.onerror = () => {
        stopTracks()
        setRecording(false)
        setError('Perekaman suara gagal. Coba rekam lagi.')
      }

      recorder.onstop = async () => {
        stopTracks()
        setRecording(false)
        const audio = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'application/octet-stream',
        })
        chunksRef.current = []

        if (!audio.size) {
          setError('Suara belum terekam. Coba tekan mikrofon lalu bicara.')
          return
        }

        setProcessing(true)
        try {
          const result = await processVoiceAudio(
            audio,
            `noka-recording.${extensionFromMimeType(audio.type)}`,
          )
          setTranscript(result.transcript)
          onCompleteRef.current?.(result)
        } catch (requestError) {
          logApiError('Pemrosesan suara gagal', requestError)
          setError(getUserFacingError(requestError))
        } finally {
          setProcessing(false)
        }
      }

      recorderRef.current = recorder
      recorder.start()
      setRecording(true)
    } catch (recordingError) {
      stopTracks()
      if (recordingError.name === 'NotAllowedError' || recordingError.name === 'SecurityError') {
        setError('Izin mikrofon ditolak. Izinkan akses mikrofon dan pastikan halaman dibuka lewat HTTPS.')
      } else {
        setError('Mikrofon tidak dapat digunakan. Periksa izin dan perangkat audio.')
      }
    }
  }

  const stop = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }

  useEffect(() => () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    stopTracks()
  }, [])

  return { recording, processing, transcript, error, supported, start, stop }
}

export default useAudioTransaction
