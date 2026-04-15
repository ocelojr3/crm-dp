import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Admin client com service_role (server-side only, nunca exposto ao browser)
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: NextRequest) {
  // 1. Verificar se o chamador é um admin autenticado
  const supabase = await createServerSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Apenas administradores podem enviar convites.' }, { status: 403 })
  }

  // 2. Validar body
  const body = await request.json()
  const { email, companyId } = body as { email?: string; companyId?: string }

  if (!email || !companyId) {
    return NextResponse.json({ error: 'E-mail e empresa são obrigatórios.' }, { status: 400 })
  }

  // 3. Enviar convite via admin client
  const admin = createAdminClient()

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: 'https://portal.pspcontabil.com.br/reset-password',
    data: { company_id: companyId, role: 'client' },
  })

  if (inviteError) {
    // Se o usuário já existe, envia reset de senha em vez de convite
    if (inviteError.message.toLowerCase().includes('already')) {
      await admin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo: 'https://portal.pspcontabil.com.br/reset-password' },
      })
    } else {
      return NextResponse.json({ error: 'Erro ao enviar convite. Verifique o e-mail.' }, { status: 500 })
    }
  }

  // 4. Garantir que o perfil existe com a empresa correta
  await admin.from('profiles').upsert(
    { email, company_id: companyId, role: 'client' },
    { onConflict: 'email', ignoreDuplicates: false }
  )

  return NextResponse.json({ success: true, message: 'Convite enviado com sucesso.' })
}
