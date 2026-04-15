import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DriveDocumentsList from '@/components/DriveDocumentsList'

export default async function PortalDocuments({
  searchParams,
}: {
  searchParams: Promise<{ competencia?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) {
    return (
      <div className="text-center py-16 text-gray-500 text-sm">
        Empresa não associada. Entre em contato com o escritório.
      </div>
    )
  }

  const { data: company } = await supabase
    .from('companies')
    .select('id, name')
    .eq('id', profile.company_id)
    .single()

  if (!company) redirect('/portal')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Folha de Pagamento</h1>
        <p className="text-sm text-gray-500 mt-1">
          Holerites, FGTS, DARF e demais documentos de {company.name}
        </p>
      </div>

      <DriveDocumentsList
        companyName={company.name}
        competencia={params.competencia}
      />
    </div>
  )
}
