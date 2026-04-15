/**
 * POST /api/drive/sync
 * Lê todas as pastas de empresa do Google Drive e sincroniza com o Supabase.
 * Apenas admins. Upsert por nome (nome = nome exato da pasta no Drive).
 */

import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { listCompaniesInDrive } from '@/lib/google-drive'
import { NextResponse } from 'next/server'

function parseFolder(folderName: string): { name: string; code: string | null } {
  // Padrão: "NOME DA EMPRESA - 0123" ou só "NOME DA EMPRESA"
  const match = folderName.match(/^(.+?)\s*-\s*(\d{3,6})\s*$/)
  if (match) {
    return { name: folderName, code: match[2] }
  }
  return { name: folderName, code: null }
}

export async function POST() {
  const supabase = await createServerSupabase()

  // Verifica admin
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admins.' }, { status: 403 })

  // Busca pastas do Drive
  let folderNames: string[]
  try {
    folderNames = await listCompaniesInDrive()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erro ao acessar o Drive'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  if (!folderNames.length) {
    return NextResponse.json({ synced: 0, message: 'Nenhuma empresa encontrada no Drive.' })
  }

  // Upsert no Supabase
  const rows = folderNames.map(f => {
    const { name, code } = parseFolder(f)
    return {
      name,           // nome exato da pasta = chave de busca no Drive
      code,
      active: true,
    }
  })

  const { error: upsertError } = await supabase
    .from('companies')
    .upsert(rows, {
      onConflict: 'name',
      ignoreDuplicates: false,
    })

  if (upsertError) {
    console.error('Upsert error:', upsertError)
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  return NextResponse.json({
    synced: folderNames.length,
    message: `${folderNames.length} empresas sincronizadas do Drive.`,
  })
}
