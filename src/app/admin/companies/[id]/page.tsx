import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CompanyDetail from './CompanyDetail'

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: company }, { data: tasks }, { data: messages }] = await Promise.all([
    supabase.from('companies').select('*').eq('id', id).single(),
    supabase.from('tasks').select('*').eq('company_id', id).order('due_date'),
    supabase.from('messages').select('*, profiles(full_name, role)').eq('company_id', id).order('created_at'),
  ])

  if (!company) notFound()

  return <CompanyDetail company={company} tasks={tasks ?? []} messages={messages ?? []} />
}
