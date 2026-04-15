'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, X, Send } from 'lucide-react'

interface Props {
  companyId: string
}

export default function InviteClientButton({ companyId }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.access_token) {
      setMessage({ type: 'error', text: 'Sessão expirada. Faça login novamente.' })
      setLoading(false)
      return
    }

    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ email, companyId }),
    })

    const data = await res.json()

    if (!res.ok) {
      setMessage({ type: 'error', text: data.error || 'Erro ao enviar convite.' })
    } else {
      setMessage({ type: 'success', text: 'Convite enviado! O cliente receberá um e-mail para criar a senha.' })
      setEmail('')
    }

    setLoading(false)
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-[#0A1628] font-semibold text-sm rounded-lg hover:bg-[#D4B96A] transition"
      >
        <Mail size={15} />
        Enviar convite de acesso
      </button>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 max-w-sm shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">Convidar cliente</p>
        <button onClick={() => { setShowForm(false); setMessage(null); setEmail('') }}
          className="text-gray-400 hover:text-gray-600 transition">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleInvite} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          placeholder="E-mail do cliente"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A84C] text-sm"
        />

        {message && (
          <p className={`text-xs px-3 py-2 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-600'
          }`}>
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2 bg-[#0A1628] text-white text-sm font-medium rounded-lg hover:bg-[#060E1A] transition disabled:opacity-50"
        >
          <Send size={14} />
          {loading ? 'Enviando...' : 'Enviar convite'}
        </button>
      </form>
    </div>
  )
}
