'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Company, Task, Message } from '@/lib/supabase/types'
import { Send, FolderOpen } from 'lucide-react'
import DriveUpload from '@/components/DriveUpload'
import DriveDocumentsList from '@/components/DriveDocumentsList'
import InviteClientButton from '@/components/InviteClientButton'

interface Props {
  company: Company
  tasks: Task[]
  messages: Message[]
}

export default function CompanyDetail({ company, tasks, messages }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [tab, setTab] = useState<'docs' | 'tasks' | 'msgs'>('docs')

  // Tarefa
  const [taskForm, setTaskForm] = useState({ title: '', description: '', due_date: '' })
  const [addingTask, setAddingTask] = useState(false)

  // Mensagem
  const [msgText, setMsgText] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)

  async function saveTask() {
    if (!taskForm.title.trim()) return
    setAddingTask(true)
    await supabase.from('tasks').insert({
      company_id: company.id,
      title: taskForm.title,
      description: taskForm.description || null,
      due_date: taskForm.due_date || null,
      status: 'pending',
    })
    setTaskForm({ title: '', description: '', due_date: '' })
    setAddingTask(false)
    router.refresh()
  }

  async function sendMsg() {
    if (!msgText.trim()) return
    setSendingMsg(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('messages').insert({
        company_id: company.id,
        sender_id: user.id,
        content: msgText.trim(),
      })
    }
    setMsgText('')
    setSendingMsg(false)
    router.refresh()
  }

  async function toggleTask(taskId: string, current: Task['status']) {
    await supabase.from('tasks').update({ status: current === 'done' ? 'pending' : 'done' }).eq('id', taskId)
    router.refresh()
  }

  const tabs = [
    { key: 'docs', label: 'Documentos' },
    { key: 'tasks', label: `Tarefas (${tasks.length})` },
    { key: 'msgs', label: `Mensagens (${messages.length})` },
  ] as const

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{company.name}</h1>
          {company.code && (
            <span className="inline-block mt-1 text-xs font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">
              #{company.code}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`https://drive.google.com/drive/folders/${process.env.NEXT_PUBLIC_DRIVE_EMPRESAS_FOLDER_ID ?? ''}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
          >
            <FolderOpen size={13} /> Drive
          </a>
          <InviteClientButton companyId={company.id} />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-4">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-2 text-sm font-medium border-b-2 transition ${
              tab === t.key
                ? 'border-[#C9A84C] text-[#0A1628]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── DOCUMENTOS ── */}
      {tab === 'docs' && (
        <div className="space-y-5">
          <DriveUpload companyId={company.id} companyName={company.name} />
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              📁 Folha de Pagamento
            </p>
            <DriveDocumentsList companyName={company.name} />
          </div>
        </div>
      )}

      {/* ── TAREFAS ── */}
      {tab === 'tasks' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Nova tarefa</p>
            <div className="grid grid-cols-2 gap-3">
              <input
                className="input"
                placeholder="Título da tarefa"
                value={taskForm.title}
                onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))}
              />
              <input
                className="input"
                type="date"
                value={taskForm.due_date}
                onChange={e => setTaskForm(p => ({ ...p, due_date: e.target.value }))}
              />
              <input
                className="input col-span-2"
                placeholder="Descrição (opcional)"
                value={taskForm.description}
                onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))}
              />
              <button
                disabled={addingTask || !taskForm.title}
                onClick={saveTask}
                className="col-span-2 bg-[#0A1628] text-white rounded-lg text-sm font-medium hover:bg-[#060E1A] transition disabled:opacity-50 px-3 py-2"
              >
                {addingTask ? 'Salvando...' : '+ Adicionar tarefa'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {tasks.map(t => (
              <div
                key={t.id}
                className={`flex items-center gap-3 bg-white rounded-xl border p-4 ${t.status === 'done' ? 'opacity-50' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={t.status === 'done'}
                  onChange={() => toggleTask(t.id, t.status)}
                  className="w-4 h-4 rounded accent-[#C9A84C] cursor-pointer"
                />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${t.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {t.title}
                  </p>
                  {t.description && <p className="text-xs text-gray-400">{t.description}</p>}
                </div>
                {t.due_date && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {new Date(t.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            ))}
            {!tasks.length && (
              <p className="text-sm text-gray-400 text-center py-6">Nenhuma tarefa cadastrada.</p>
            )}
          </div>
        </div>
      )}

      {/* ── MENSAGENS ── */}
      {tab === 'msgs' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3 max-h-96 overflow-y-auto">
            {messages.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Nenhuma mensagem.</p>
            )}
            {messages.map(m => {
              const isAdmin = (m.profiles as { role: string } | undefined)?.role === 'admin'
              return (
                <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${isAdmin ? 'bg-[#0A1628] text-white' : 'bg-gray-100 text-gray-800'}`}>
                    <p>{m.content}</p>
                    <p className={`text-xs mt-1 ${isAdmin ? 'text-gray-400' : 'text-gray-400'}`}>
                      {(m.profiles as { full_name: string | null } | undefined)?.full_name ?? 'Escritório'}
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
              className="input flex-1"
              placeholder="Escreva uma mensagem..."
              value={msgText}
              onChange={e => setMsgText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg()}
            />
            <button
              disabled={sendingMsg || !msgText.trim()}
              onClick={sendMsg}
              className="bg-[#0A1628] text-white px-4 py-2 rounded-lg hover:bg-[#060E1A] transition disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
