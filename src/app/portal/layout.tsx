import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ClientNav from '@/components/ClientNav'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, companies(name)')
    .eq('id', user.id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const company = (profile?.companies as any)?.name ?? (profile?.companies as any)?.[0]?.name ?? ''

  return (
    <div className="min-h-screen flex flex-col">
      <ClientNav userName={profile?.full_name ?? ''} companyName={company} />
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">{children}</main>
    </div>
  )
}
