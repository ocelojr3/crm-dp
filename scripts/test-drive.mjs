/**
 * Testa acesso à pasta Empresas no Google Drive
 * Execute: node scripts/test-drive.mjs
 */

import { readFileSync } from 'fs'
import { google } from 'googleapis'

const CREDENTIALS_PATH = 'G:/Meu Drive/KEY/client_secret_2_643560548265-fk0fj8d0jjsa1bs42b7j83be8np7tn8v.apps.googleusercontent.com.json'
const TOKEN_PATH = './google-token.json'
const EMPRESAS_FOLDER_ID = '1nn1_Ms6lG2CjJqyqpxLb6nbzGbiTCri9'

const creds = JSON.parse(readFileSync(CREDENTIALS_PATH, 'utf8'))
const tokens = JSON.parse(readFileSync(TOKEN_PATH, 'utf8'))

const auth = new google.auth.OAuth2(
  creds.installed.client_id,
  creds.installed.client_secret,
  'http://localhost:3333/callback'
)
auth.setCredentials(tokens)
const drive = google.drive({ version: 'v3', auth })

async function main() {
  console.log('\n🔍 Testando acesso à pasta Empresas...\n')

  // Acessa a pasta diretamente pelo ID
  try {
    const folder = await drive.files.get({
      fileId: EMPRESAS_FOLDER_ID,
      fields: 'id, name, mimeType, capabilities',
      supportsAllDrives: true,
    })
    console.log(`✅ Pasta encontrada: "${folder.data.name}"`)
    console.log(`   Pode editar: ${folder.data.capabilities?.canEdit}`)
    console.log(`   Pode adicionar filhos: ${folder.data.capabilities?.canAddChildren}`)
  } catch (e) {
    console.error('❌ Sem acesso à pasta Empresas:', e.message)
    process.exit(1)
  }

  // Lista primeiras 10 empresas
  const res = await drive.files.list({
    q: `'${EMPRESAS_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    orderBy: 'name',
    pageSize: 10,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  })

  console.log(`\n📋 Primeiras empresas (${res.data.files?.length ?? 0}):`)
  res.data.files?.forEach(f => console.log(`   🏢 ${f.name}`))

  if (!res.data.files?.length) {
    console.log('   ⚠️ Nenhuma pasta de empresa encontrada.')
    console.log('   Isso pode indicar falta de permissão de leitura.')
  } else {
    // Testa uma empresa — lista competências
    const empresa = res.data.files[0]
    const comps = await drive.files.list({
      q: `'${empresa.id}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
      orderBy: 'name desc',
      pageSize: 5,
    })
    console.log(`\n   📁 Competências de "${empresa.name}":`)
    comps.data.files?.forEach(f => console.log(`      📅 ${f.name}`))
  }

  console.log('\n' + '='.repeat(50))
  console.log('✅ CONFIGURAÇÃO PRONTA!')
  console.log('='.repeat(50))
  console.log('\nAdicione no Vercel (Settings → Environment Variables):')
  console.log(`\nGOOGLE_CLIENT_ID=${creds.installed.client_id}`)
  console.log(`GOOGLE_CLIENT_SECRET=${creds.installed.client_secret}`)
  console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`)
  console.log(`GOOGLE_DRIVE_EMPRESAS_FOLDER_ID=${EMPRESAS_FOLDER_ID}`)
  console.log()
}

main().catch(e => {
  console.error('\n❌', e.message)
  process.exit(1)
})
