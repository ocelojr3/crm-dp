import { createClient } from '@/lib/supabase/server'

const STATUS_LABEL: Record<string, string> = { pending: 'Pendente', done: 'Concluída', overdue: 'Vencida' }
const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  done: 'bg-green-50 text-green-700',
  overdue: 'bg-red-50 text-red-700',
}

export default async function PortalTasks() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) return <p className="text-gray-400 text-sm">Empresa não associada.</p>

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .or(`company_id.eq.${profile.company_id},company_id.is.null`)
    .order('due_date')

  const pending = tasks?.filter(t => t.status !== 'done') ?? []
  const done = tasks?.filter(t => t.status === 'done') ?? []

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Tarefas e Prazos</h1>

      {pending.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Pendentes ({pending.length})</h2>
          {pending.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">{t.title}</p>
                {t.description && <p className="text-xs text-gray-400">{t.description}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {t.due_date && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    {new Date(t.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[t.status]}`}>
                  {STATUS_LABEL[t.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Concluídas ({done.length})</h2>
          {done.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between opacity-60">
              <p className="text-sm text-gray-500 line-through">{t.title}</p>
              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Concluída</span>
            </div>
          ))}
        </div>
      )}

      {!tasks?.length && <p className="text-center text-sm text-gray-400 py-8">Nenhuma tarefa no momento.</p>}
    </div>
  )
}
