import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MessageSquare } from 'lucide-react'

export default async function MessagesPage() {
  const supabase = await createClient()

  // Agrupa última mensagem por empresa
  const { data: messages } = await supabase
    .from('messages')
    .select('*, companies(id, name), profiles(full_name, role)')
    .order('created_at', { ascending: false })

  // Agrupar por empresa (última mensagem)
  const byCompany = new Map<string, typeof messages extends (infer T)[] | null ? T : never>()
  if (messages) {
    for (const m of messages) {
      const cid = m.company_id
      if (!byCompany.has(cid)) byCompany.set(cid, m)
    }
  }

  const threads = Array.from(byCompany.values())

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Mensagens</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        {threads.map(m => {
          const company = m.companies as { id: string; name: string } | null
          const unread = !m.is_read && (m.profiles as { role: string } | null)?.role === 'client'
          return (
            <Link key={m.company_id} href={`/admin/companies/${company?.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition">
              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {company?.name?.charAt(0) ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium text-gray-800 ${unread ? 'font-bold' : ''}`}>{company?.name}</p>
                  <span className="text-xs text-gray-400">
                    {new Date(m.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{m.content}</p>
              </div>
              {unread && <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />}
            </Link>
          )
        })}
        {!threads.length && (
          <div className="flex flex-col items-center py-12 text-gray-400">
            <MessageSquare size={32} className="mb-2" />
            <p className="text-sm">Nenhuma mensagem.</p>
          </div>
        )}
      </div>
    </div>
  )
}
