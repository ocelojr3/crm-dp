import { createClient } from '@/lib/supabase/server'
import MessagesClient from './MessagesClient'

export default async function PortalMessages() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('company_id, full_name').eq('id', user.id).single()
  if (!profile?.company_id) return <p className="text-gray-400 text-sm">Empresa não associada.</p>

  // Marca mensagens não lidas como lidas
  await supabase.from('messages')
    .update({ is_read: true })
    .eq('company_id', profile.company_id)
    .eq('is_read', false)
    .neq('sender_id', user.id)

  const { data: messages } = await supabase
    .from('messages')
    .select('*, profiles(full_name, role)')
    .eq('company_id', profile.company_id)
    .order('created_at')

  return (
    <MessagesClient
      messages={messages ?? []}
      companyId={profile.company_id}
      userId={user.id}
    />
  )
}
