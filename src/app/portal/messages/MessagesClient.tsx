'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Message } from '@/lib/supabase/types'
import { Send } from 'lucide-react'

interface Props {
  messages: Message[]
  companyId: string
  userId: string
}

export default function MessagesClient({ messages, companyId, userId }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  async function send() {
    if (!text.trim()) return
    setSending(true)
    await supabase.from('messages').insert({
      company_id: companyId,
      sender_id: userId,
      content: text.trim(),
    })
    setText('')
    setSending(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Mensagens</h1>
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3 min-h-64 max-h-[60vh] overflow-y-auto">
        {!messages.length && <p className="text-sm text-gray-400 text-center py-8">Nenhuma mensagem ainda.</p>}
        {messages.map(m => {
          const mine = m.sender_id === userId
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs md:max-w-sm rounded-2xl px-4 py-2 text-sm ${mine ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                <p>{m.content}</p>
                <p className={`text-xs mt-1 ${mine ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {mine ? 'Você' : (m.profiles as { full_name: string | null } | undefined)?.full_name ?? 'Escritório'}
                  {' · '}
                  {new Date(m.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          placeholder="Escreva uma mensagem..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
        />
        <button disabled={sending || !text.trim()} onClick={send}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
