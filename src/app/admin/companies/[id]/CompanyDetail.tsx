'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Company, ClientDocument, Task, Message } from '@/lib/supabase/types'
import { ExternalLink, Plus, Send, FolderOpen } from 'lucide-react'

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const CATS = ['folha','imposto','prontuario','geral'] as const

interface Props {
  company: Company
  documents: ClientDocument[]
  tasks: Task[]
  messages: Message[]
}

export default function CompanyDetail({ company, documents, tasks, messages }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [tab, setTab] = useState<'docs'|'tasks'|'msgs'>('docs')

  // Doc form
  const [docForm, setDocForm] = useState({ name: '', category: 'geral', drive_url: '', year: '', month: '' })
  const [addingDoc, setAddingDoc] = useState(false)

  // Task form
  const [taskForm, setTaskForm] = useState({ title: '', description: '', due_date: '' })
  const [addingTask, setAddingTask] = useState(false)

  // Message
  const [msgText, setMsgText] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)

  async function saveDoc() {
    setAddingDoc(true)
    await supabase.from('documents').insert({
      company_id: company.id,
      name: docForm.name,
      category: docForm.category as ClientDocument['category'],
      drive_url: docForm.drive_url,
      year: docForm.year ? parseInt(docForm.year) : null,
      month: docForm.month ? parseInt(docForm.month) : null,
    })
    setDocForm({ name: '', category: 'geral', drive_url: '', year: '', month: '' })
    setAddingDoc(false)
    router.refresh()
  }

  async function saveTask() {
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
    const next = current === 'done' ? 'pending' : 'done'
    await supabase.from('tasks').update({ status: next }).eq('id', taskId)
    router.refresh()
  }

  const tabs = [
    { key: 'docs', label: `Documentos (${documents.length})` },
    { key: 'tasks', label: `Tarefas (${tasks.length})` },
    { key: 'msgs', label: `Mensagens (${messages.length})` },
  ] as const

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{company.name}</h1>
          <p className="text-sm text-gray-500">{company.code && `#${company.code}`}{company.cnpj && ` · ${company.cnpj}`}</p>
        </div>
        {company.drive_folder_url && (
          <a href={company.drive_folder_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition">
            <FolderOpen size={14} /> Google Drive
          </a>
        )}
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        {[['E-mail', company.email], ['Telefone', company.phone], ['Contato', company.contact_name]].map(([l, v]) =>
          v ? <div key={l}><span className="text-gray-400">{l}: </span><span className="text-gray-700">{v}</span></div> : null
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-4">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-2 text-sm font-medium border-b-2 transition ${
              tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >{t.label}</button>
        ))}
      </div>

      {/* DOCUMENTOS */}
      {tab === 'docs' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1"><Plus size={14} />Adicionar documento</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <input className="input col-span-2" placeholder="Nome do documento" value={docForm.name} onChange={e => setDocForm(p => ({ ...p, name: e.target.value }))} />
              <select className="input" value={docForm.category} onChange={e => setDocForm(p => ({ ...p, category: e.target.value }))}>
                {CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
              <input className="input col-span-2 md:col-span-3" placeholder="Link do Google Drive" value={docForm.drive_url} onChange={e => setDocForm(p => ({ ...p, drive_url: e.target.value }))} />
              <input className="input" placeholder="Ano (ex: 2025)" value={docForm.year} onChange={e => setDocForm(p => ({ ...p, year: e.target.value }))} />
              <select className="input" value={docForm.month} onChange={e => setDocForm(p => ({ ...p, month: e.target.value }))}>
                <option value="">Mês (opcional)</option>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <button disabled={addingDoc || !docForm.name || !docForm.drive_url} onClick={saveDoc}
                className="bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 px-3">
                {addingDoc ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Nome</th>
                  <th className="px-4 py-3 text-left">Categoria</th>
                  <th className="px-4 py-3 text-left">Período</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {documents.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{d.name}</td>
                    <td className="px-4 py-3"><span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{d.category}</span></td>
                    <td className="px-4 py-3 text-gray-500">{d.month ? `${MONTHS[d.month - 1]} ` : ''}{d.year ?? ''}</td>
                    <td className="px-4 py-3 text-right">
                      <a href={d.drive_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                        <ExternalLink size={12} /> Abrir
                      </a>
                    </td>
                  </tr>
                ))}
                {!documents.length && <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">Nenhum documento.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAREFAS */}
      {tab === 'tasks' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1"><Plus size={14} />Nova tarefa</h3>
            <div className="grid grid-cols-2 gap-3">
              <input className="input" placeholder="Título da tarefa" value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} />
              <input className="input" type="date" value={taskForm.due_date} onChange={e => setTaskForm(p => ({ ...p, due_date: e.target.value }))} />
              <input className="input col-span-2" placeholder="Descrição (opcional)" value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} />
              <button disabled={addingTask || !taskForm.title} onClick={saveTask}
                className="bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 px-3 py-2">
                {addingTask ? 'Salvando...' : 'Adicionar'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {tasks.map(t => (
              <div key={t.id} className={`flex items-center gap-3 bg-white rounded-xl border p-4 ${t.status === 'done' ? 'opacity-60' : ''}`}>
                <input type="checkbox" checked={t.status === 'done'} onChange={() => toggleTask(t.id, t.status)}
                  className="w-4 h-4 rounded text-indigo-600 cursor-pointer" />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${t.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>{t.title}</p>
                  {t.description && <p className="text-xs text-gray-400">{t.description}</p>}
                </div>
                {t.due_date && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {new Date(t.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            ))}
            {!tasks.length && <p className="text-sm text-gray-400 text-center py-4">Nenhuma tarefa.</p>}
          </div>
        </div>
      )}

      {/* MENSAGENS */}
      {tab === 'msgs' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3 max-h-96 overflow-y-auto">
            {messages.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nenhuma mensagem.</p>}
            {messages.map(m => {
              const isAdmin = (m.profiles as { role: string } | undefined)?.role === 'admin'
              return (
                <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${isAdmin ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    <p>{m.content}</p>
                    <p className={`text-xs mt-1 ${isAdmin ? 'text-indigo-200' : 'text-gray-400'}`}>
                      {(m.profiles as { full_name: string | null } | undefined)?.full_name ?? 'Escritório'} · {new Date(m.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
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
            <button disabled={sendingMsg || !msgText.trim()} onClick={sendMsg}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
