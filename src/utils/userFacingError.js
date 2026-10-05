export const SYSTEM_ERROR_MESSAGE = 'Maaf, sedang ada kesalahan sistem. Silakan coba lagi.'

const TECHNICAL_MESSAGE = /https?:\/\/|ngrok|cloudflare|err_[a-z0-9_]+|traceback|stack trace|sql|database|exception|internal server error|failed to fetch|fetch failed|networkerror|http\s*\d{3}/i

export function getUserFacingError(error, fallback = SYSTEM_ERROR_MESSAGE) {
  if (error?.code === 'INVALID_CREDENTIALS') {
    return 'Email atau kata sandi salah. Periksa kembali lalu coba lagi.'
  }
  if (error?.code === 'ACCOUNT_NOT_VERIFIED') {
    return 'Akun belum terverifikasi. Selesaikan verifikasi OTP terlebih dahulu.'
  }

  const message = typeof error?.message === 'string' ? error.message.trim() : ''
  const status = Number(error?.status)

  if (
    error instanceof TypeError ||
    /failed to fetch|fetch failed|networkerror|backend sedang tidak tersedia/i.test(message)
  ) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi internet atau coba lagi.'
  }
  if (status === 401 || status === 403) {
    return 'Sesi login tidak valid atau telah berakhir. Silakan login kembali.'
  }
  if (status === 422 || /field required|input should|validation error|body ->/i.test(message)) {
    return 'Data yang dikirim belum sesuai. Periksa kembali isian.'
  }

  return message || fallback
}

export function logApiError(context, error) {
  console.error(`[NOKA] ${context}`, error)
}
