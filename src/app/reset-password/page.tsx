'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validSession, setValidSession] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Supabase injeta a sessão via hash na URL ao clicar no link do e-mail
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValidSession(true)
      }
      setChecking(false)
    })
    return () => subscription.unsubscribe()
  }, [supabase.auth])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('Não foi possível redefinir a senha. O link pode ter expirado.')
      setLoading(false)
      return
    }

    await supabase.auth.signOut()
    router.push('/login?reset=ok')
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-[#EDE8D8]">
        <p className="text-gray-500 text-sm">Verificando link...</p>
      </div>
    )
  }

  if (!validSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-[#EDE8D8] px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800">Link inválido ou expirado</h1>
          <p className="text-sm text-gray-500">Solicite um novo link de recuperação.</p>
          <Link href="/forgot-password"
            className="block w-full py-2.5 bg-[#0A1628] text-white rounded-lg font-medium hover:bg-[#060E1A] transition text-sm text-center">
            Solicitar novo link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-[#EDE8D8] px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#0A1628] mb-4">
            <PspLogo />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Nova senha</h1>
          <p className="text-sm text-gray-500 mt-1">Escolha uma senha segura</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A84C] text-sm"
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A84C] text-sm"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#0A1628] text-white rounded-lg font-medium hover:bg-[#060E1A] transition disabled:opacity-50 text-sm"
          >
            {loading ? 'Salvando...' : 'Redefinir senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
