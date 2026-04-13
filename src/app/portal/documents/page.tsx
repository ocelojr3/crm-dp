import { createClient } from '@/lib/supabase/server'
import { ExternalLink } from 'lucide-react'

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const CATS = ['folha','imposto','prontuario','geral'] as const
const CAT_LABEL: Record<string, string> = { folha: 'Folha de Pagamento', imposto: 'Impostos', prontuario: 'Prontuário', geral: 'Geral' }

export default async function PortalDocuments({ searchParams }: { searchParams: Promise<{ cat?: string; year?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) return <p className="text-gray-400 text-sm">Empresa não associada. Contate o escritório.</p>

  let query = supabase.from('documents').select('*').eq('company_id', profile.company_id)
  if (params.cat) query = query.eq('category', params.cat)
  if (params.year) query = query.eq('year', parseInt(params.year))
  const { data: documents } = await query.order('year', { ascending: false }).order('month', { ascending: false })

  // Anos disponíveis
  const years = [...new Set(documents?.map(d => d.year).filter(Boolean))].sort((a, b) => (b ?? 0) - (a ?? 0))

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Documentos</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <a href="/portal/documents" className={`px-3 py-1 rounded-full text-sm font-medium border transition ${!params.cat ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          Todos
        </a>
        {CATS.map(c => (
          <a key={c} href={`/portal/documents?cat=${c}${params.year ? `&year=${params.year}` : ''}`}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition ${params.cat === c ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {CAT_LABEL[c]}
          </a>
        ))}
      </div>
      {years.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {years.map(y => (
            <a key={y} href={`/portal/documents?${params.cat ? `cat=${params.cat}&` : ''}year=${y}`}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition ${params.year === String(y) ? 'bg-gray-700 text-white border-gray-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
              {y}
            </a>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {documents?.map(d => (
          <div key={d.id} className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3 hover:shadow-sm transition">
            <div>
              <p className="text-sm font-medium text-gray-800">{d.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{CAT_LABEL[d.category]}</span>
                {(d.month || d.year) && (
                  <span className="text-xs text-gray-400">
                    {d.month ? `${MONTHS[d.month - 1]} ` : ''}{d.year}
                  </span>
                )}
              </div>
            </div>
            <a href={d.drive_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition">
              <ExternalLink size={13} /> Abrir
            </a>
          </div>
        ))}
        {!documents?.length && (
          <p className="text-center text-sm text-gray-400 py-8">Nenhum documento encontrado.</p>
        )}
      </div>
    </div>
  )
}
