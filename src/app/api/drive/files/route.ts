/**
 * GET /api/drive/files?companyName=X&competencia=2025-04
 * Lista arquivos de folha do Drive para uma empresa.
 * Clientes só veem a própria empresa.
 */

import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { listPayrollFiles } from '@/lib/google-drive'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const companyName = searchParams.get('companyName')
  const competencia = searchParams.get('competencia') ?? undefined

  if (!companyName) return NextResponse.json({ error: 'companyName obrigatório' }, { status: 400 })

  // Garante que cliente só vê própria empresa
  const { data: profile } = await supabase
    .from('profiles').select('role, company_id').eq('id', user.id).single()

  if (profile?.role === 'client') {
    const { data: company } = await supabase
      .from('companies').select('name').eq('id', profile.company_id).single()
    if (!company || company.name !== companyName) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }
  }

  const result = await listPayrollFiles(companyName, competencia)
  return NextResponse.json(result)
}
