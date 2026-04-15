import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import SyncButton from './SyncButton'
import { Building2 } from 'lucide-react'

export default async function CompaniesPage() {
  const supabase = await createClient()
  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .order('name')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Empresas</h1>
          <p className="text-xs text-gray-400 mt-0.5">{companies?.length ?? 0} empresas · sincronizado do Google Drive</p>
        </div>
        <SyncButton />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {!companies?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
            <Building2 size={36} className="opacity-30" />
            <p className="text-sm">Nenhuma empresa ainda.</p>
            <p className="text-xs text-gray-400">Clique em <strong className="text-[#C9A84C]">Sincronizar do Drive</strong> para importar.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Código</th>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {companies.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-mono text-gray-400 text-xs">{c.code ?? '—'}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.active ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/companies/${c.id}`}
                      className="text-[#C9A84C] hover:underline text-xs font-semibold">
                      Abrir →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
