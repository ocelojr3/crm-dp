/**
 * DELETE /api/drive/delete
 * Body: { fileId, documentId? }
 * Admin remove arquivo do Drive e referência do Supabase.
 */

import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { deletePayrollFile } from '@/lib/google-drive'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admins.' }, { status: 403 })

  const { fileId, documentId } = await request.json()
  if (!fileId) return NextResponse.json({ error: 'fileId obrigatório' }, { status: 400 })

  await deletePayrollFile(fileId)

  if (documentId) {
    await supabase.from('documents').delete().eq('id', documentId)
  }

  return NextResponse.json({ success: true })
}
