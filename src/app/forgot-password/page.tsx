'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

function PspLogo() {
  return (
    <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="100" height="100" rx="16" fill="#0A1628"/>
      <text y="76" fontSize="68" fontFamily="Georgia,serif" fill="#C9A84C" x="10" fontWeight="bold">P</text>
      <rect x="58" y="30" width="24" height="4" rx="2" fill="#C9A84C"/>
      <rect x="58" y="42" width="18" height="4" rx="2" fill="#C9A84C" opacity="0.6"/>
      <rect x="58" y="54" width="20" height="4" rx="2" fill="#C9A84C" opacity="0.4"/>
    </svg>
  )
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://portal.pspcontabil.com.br/reset-password',
    })

    if (error) {
      setError('Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-[#EDE8D8] px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#0A1628] mb-4">
            <PspLogo />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Recuperar acesso</h1>
          <p className="text-sm text-gray-500 mt-1">PSP Contabilidade — Área do Cliente</p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">
              Link enviado para <strong>{email}</strong>. Verifique sua caixa de entrada e spam.
            </p>
            <Link href="/login" className="block text-sm text-[#C9A84C] hover:underline font-medium">
              Voltar ao login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail cadastrado</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A84C] text-sm"
                placeholder="seu@email.com"
              />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#0A1628] text-white rounded-lg font-medium hover:bg-[#060E1A] transition disabled:opacity-50 text-sm"
            >
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
            <div className="text-center">
              <Link href="/login" className="text-sm text-[#C9A84C] hover:underline font-medium">
                Voltar ao login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
