import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText, MessageSquare, CheckSquare } from 'lucide-react'

export default async function PortalHome() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('company_id, full_name').eq('id', user.id).single()
  const cid = profile?.company_id

  const [docs, msgs, tasks] = await Promise.all([
    cid ? supabase.from('documents').select('id', { count: 'exact', head: true }).eq('company_id', cid) : { count: 0 },
    cid ? supabase.from('messages').select('id', { count: 'exact', head: true }).eq('company_id', cid).eq('is_read', false) : { count: 0 },
    cid ? supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('company_id', cid).eq('status', 'pending') : { count: 0 },
  ])

  const cards = [
    { href: '/portal/documents', label: 'Documentos', count: docs.count ?? 0, icon: FileText, desc: 'Folhas, guias e certificados', color: 'text-blue-600 bg-blue-50' },
    { href: '/portal/messages', label: 'Mensagens não lidas', count: msgs.count ?? 0, icon: MessageSquare, desc: 'Comunicados do escritório', color: 'text-[#C9A84C] bg-[#FBF7EE]' },
    { href: '/portal/tasks', label: 'Tarefas pendentes', count: tasks.count ?? 0, icon: CheckSquare, desc: 'Prazos e obrigações', color: 'text-amber-600 bg-amber-50' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Olá, {profile?.full_name?.split(' ')[0] ?? 'bem-vindo'}!</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(({ href, label, count, icon: Icon, desc, color }) => (
          <Link key={href} href={href}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition flex flex-col gap-3">
            <div className={`inline-flex w-10 h-10 rounded-lg items-center justify-center ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{count}</p>
              <p className="text-sm font-medium text-gray-700">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
