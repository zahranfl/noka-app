import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createTransaction, getBalance, getTransactions } from '../services/backendApi'
import { getAuthSession, subscribeToAuthSession } from '../utils/authSession'
import { getUserFacingError, logApiError } from '../utils/userFacingError'

export const MODAL_AWAL = 0

const Ctx = createContext(null)

function todayIso() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

export function TransaksiProvider({ children }) {
  const [userId, setUserId] = useState(() => getAuthSession()?.user_id ?? null)
  const userIdRef = useRef(userId)
  const [list, setList] = useState([])
  const [saldoBackend, setSaldoBackend] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(getAuthSession()))
  const [error, setError] = useState('')

  useEffect(
    () => subscribeToAuthSession(() => {
      const nextUserId = getAuthSession()?.user_id ?? null
      if (userIdRef.current !== nextUserId) {
        userIdRef.current = nextUserId
        setList([])
        setSaldoBackend(null)
        setError('')
        setLoading(Boolean(nextUserId))
        setUserId(nextUserId)
      }
    }),
    [],
  )

  const refresh = useCallback(async (requestedUserId = userId) => {
    if (!requestedUserId) return
    setLoading(true)
    setError('')

    try {
      const [transactions, balance] = await Promise.all([
        getTransactions(),
        getBalance(),
      ])
      setList(transactions)
      setSaldoBackend(balance)
    } catch (requestError) {
      logApiError('Memuat transaksi dan saldo gagal', requestError)
      setError(getUserFacingError(requestError))
      throw requestError
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return undefined

    let active = true

    Promise.all([getTransactions(), getBalance()])
      .then(([transactions, balance]) => {
        if (!active) return
        setList(transactions)
        setSaldoBackend(balance)
      })
      .catch((requestError) => {
        if (active) {
          logApiError('Memuat transaksi dan saldo gagal', requestError)
          setError(getUserFacingError(requestError))
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [userId])

  const tambah = useCallback(async (transaction) => {
    if (!userId) throw new Error('Sesi pengguna tidak ditemukan. Silakan login kembali.')

    const toSave = { ...transaction, tanggal: transaction.tanggal || todayIso() }
    await createTransaction(toSave)

    const optimisticTransaction = { ...toSave, id: Date.now() }
    setList((current) => [optimisticTransaction, ...current])

    try {
      await refresh(userId)
    } catch (refreshError) {
      logApiError('Menyegarkan transaksi setelah menyimpan gagal', refreshError)
      setError(getUserFacingError(refreshError))
    }
  }, [refresh, userId])

  return (
    <Ctx.Provider value={{ list, tambah, saldoBackend, loading, error, refresh }}>
      {children}
    </Ctx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTransaksi = () => useContext(Ctx)
