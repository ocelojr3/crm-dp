import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Building2, FileText, MessageSquare, CheckSquare } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [companies, documents, messages, tasks] = await Promise.all([
    supabase.from('companies').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('documents').select('id', { count: 'exact', head: true }),
    supabase.from('messages').select('id', { count: 'exact', head: true }).eq('is_read', false),
    supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const stats = [
    { label: 'Empresas ativas', value: companies.count ?? 0, icon: Building2, href: '/admin/companies', color: 'bg-indigo-50 text-indigo-700' },
    { label: 'Documentos', value: documents.count ?? 0, icon: FileText, href: '/admin/documents', color: 'bg-blue-50 text-blue-700' },
    { label: 'Mensagens não lidas', value: messages.count ?? 0, icon: MessageSquare, href: '/admin/messages', color: 'bg-amber-50 text-amber-700' },
    { label: 'Tarefas pendentes', value: tasks.count ?? 0, icon: CheckSquare, href: '/admin/tasks', color: 'bg-green-50 text-green-700' },
  ]

  // Tarefas vencendo nos próximos 7 dias
  const today = new Date().toISOString().split('T')[0]
  const next7 = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  const { data: upcoming } = await supabase
    .from('tasks')
    .select('*, companies(name)')
    .eq('status', 'pending')
    .gte('due_date', today)
    .lte('due_date', next7)
    .order('due_date')
    .limit(10)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, href, color }) => (
          <Link key={label} href={href} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition flex flex-col gap-3">
            <div className={`inline-flex w-10 h-10 rounded-lg items-center justify-center ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-700 mb-4">Prazos nos próximos 7 dias</h2>
        {!upcoming?.length ? (
          <p className="text-sm text-gray-400">Nenhum prazo nos próximos 7 dias.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map(task => (
              <div key={task.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-700">{task.title}</p>
                  {task.companies && (
                    <p className="text-xs text-gray-400">{(task.companies as { name: string }).name}</p>
                  )}
                </div>
                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  {new Date(task.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
