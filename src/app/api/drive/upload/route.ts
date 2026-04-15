/**
 * POST /api/drive/upload
 * Admin faz upload de documento de folha para a pasta da empresa no Drive.
 * Body: FormData { file, companyName, competencia, companyId }
 * competencia formato: "AAAA-MM" ex: "2025-04"
 */

import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { uploadPayrollFile } from '@/lib/google-drive'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // 1. Verifica admin
  const supabase = await createServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admins.' }, { status: 403 })

  // 2. Extrai FormData
  const form = await request.formData()
  const file = form.get('file') as File | null
  const companyName = form.get('companyName') as string | null
  const competencia = form.get('competencia') as string | null  // "2025-04"
  const companyId = form.get('companyId') as string | null

  if (!file || !companyName || !competencia || !companyId) {
    return NextResponse.json(
      { error: 'Campos obrigatórios: file, companyName, competencia, companyId' },
      { status: 400 }
    )
  }

  // 3. Upload para o Drive
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const driveFile = await uploadPayrollFile(
    companyName,
    competencia,
    file.name,
    file.type || 'application/octet-stream',
    buffer
  )

  // 4. Salva referência no Supabase
  const [yearStr, monthStr] = competencia.split('-')
  const year = parseInt(yearStr)
  const month = parseInt(monthStr)

  const { error: dbError } = await supabase.from('documents').insert({
    company_id: companyId,
    name: file.name,
    category: 'folha',
    drive_url: driveFile.webViewLink,
    drive_file_id: driveFile.id,
    drive_folder_path: `${companyName}/${competencia}`,
    year,
    month,
    uploaded_by: user.id,
  })

  if (dbError) {
    console.error('Supabase insert error:', dbError)
    // Arquivo já subiu ao Drive, retorna sucesso mesmo assim
  }

  return NextResponse.json({ success: true, file: driveFile })
}
