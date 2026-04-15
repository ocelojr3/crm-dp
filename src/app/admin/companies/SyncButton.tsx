'use client'

import { useState } from 'react'
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SyncButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  async function handleSync() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/drive/sync', { method: 'POST' })
      const data = await res.json()
      setResult({ ok: res.ok, message: data.message ?? data.error ?? 'Erro desconhecido' })
      if (res.ok) router.refresh()
    } catch {
      setResult({ ok: false, message: 'Falha na conexão com o servidor.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {result && (
        <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium ${result.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {result.ok ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
          {result.message}
        </span>
      )}
      <button
        onClick={handleSync}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-[#0A1628] font-semibold text-sm rounded-lg hover:bg-[#D4B96A] transition disabled:opacity-60"
      >
        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        {loading ? 'Sincronizando...' : 'Sincronizar do Drive'}
      </button>
    </div>
  )
}
