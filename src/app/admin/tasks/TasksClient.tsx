'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Task } from '@/lib/supabase/types'
import { Plus } from 'lucide-react'

interface Props {
  tasks: (Task & { companies: { name: string } | null })[]
  companies: { id: string; name: string }[]
}

const STATUS_LABEL: Record<string, string> = { pending: 'Pendente', done: 'Concluída', overdue: 'Vencida' }
const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  done: 'bg-green-50 text-green-700',
  overdue: 'bg-red-50 text-red-700',
}

export default function TasksClient({ tasks, companies }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [filter, setFilter] = useState<'all'|'pending'|'done'>('pending')
  const [form, setForm] = useState({ title: '', description: '', due_date: '', company_id: '' })
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const filtered = tasks.filter(t => filter === 'all' || t.status === filter)

  async function save() {
    setSaving(true)
    await supabase.from('tasks').insert({
      title: form.title,
      description: form.description || null,
      due_date: form.due_date || null,
      company_id: form.company_id || null,
      status: 'pending',
    })
    setForm({ title: '', description: '', due_date: '', company_id: '' })
    setShowForm(false)
    setSaving(false)
    router.refresh()
  }

  async function toggle(id: string, status: Task['status']) {
    await supabase.from('tasks').update({ status: status === 'done' ? 'pending' : 'done' }).eq('id', id)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Tarefas / Prazos</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
          <Plus size={16} /> Nova tarefa
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input className="input col-span-2" placeholder="Título *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            <select className="input" value={form.company_id} onChange={e => setForm(p => ({ ...p, company_id: e.target.value }))}>
              <option value="">Todas as empresas</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input className="input" type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
            <input className="input col-span-2" placeholder="Descrição (opcional)" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <button disabled={saving || !form.title} onClick={save}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      )}

      <div className="flex gap-2">
        {(['pending','done','all'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === s ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {s === 'all' ? 'Todas' : s === 'pending' ? 'Pendentes' : 'Concluídas'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(t => (
          <div key={t.id} className={`flex items-center gap-3 bg-white rounded-xl border p-4 ${t.status === 'done' ? 'opacity-60' : ''}`}>
            <input type="checkbox" checked={t.status === 'done'} onChange={() => toggle(t.id, t.status)} className="w-4 h-4 rounded text-indigo-600 cursor-pointer" />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${t.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>{t.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {t.companies && <span className="text-xs text-gray-400">{t.companies.name}</span>}
                {t.description && <span className="text-xs text-gray-400">· {t.description}</span>}
              </div>
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
        {!filtered.length && <p className="text-center text-sm text-gray-400 py-6">Nenhuma tarefa.</p>}
      </div>
    </div>
  )
}
