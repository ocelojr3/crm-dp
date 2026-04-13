'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function NewCompanyPage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    code: '', name: '', cnpj: '', email: '', phone: '',
    contact_name: '', drive_folder_url: '', notes: '',
  })

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('companies').insert({
      ...form,
      code: form.code || null,
      cnpj: form.cnpj || null,
      email: form.email || null,
      phone: form.phone || null,
      contact_name: form.contact_name || null,
      drive_folder_url: form.drive_folder_url || null,
      notes: form.notes || null,
    })
    router.push('/admin/companies')
  }

  const field = (label: string, key: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={form[key as keyof typeof form]}
        onChange={e => set(key, e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
      />
    </div>
  )

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Nova Empresa</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {field('Código', 'code', 'text', 'ex: 0153')}
          {field('Nome *', 'name', 'text', 'ex: ITABAR')}
          {field('CNPJ', 'cnpj', 'text', '00.000.000/0001-00')}
          {field('E-mail', 'email', 'email')}
          {field('Telefone', 'phone', 'tel')}
          {field('Nome do contato', 'contact_name')}
        </div>
        {field('URL pasta Google Drive', 'drive_folder_url', 'url', 'https://drive.google.com/...')}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || !form.name}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-gray-600 px-5 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
