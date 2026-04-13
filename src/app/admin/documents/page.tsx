import { createClient } from '@/lib/supabase/server'
import { ExternalLink } from 'lucide-react'

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { data: documents } = await supabase
    .from('documents')
    .select('*, companies(name, code)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Todos os Documentos</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Empresa</th>
              <th className="px-4 py-3 text-left">Documento</th>
              <th className="px-4 py-3 text-left">Categoria</th>
              <th className="px-4 py-3 text-left">Período</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {documents?.map(d => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600">{(d.companies as { name: string } | null)?.name ?? '—'}</td>
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
            {!documents?.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Nenhum documento.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
