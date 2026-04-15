/**
 * Encontra o ID da pasta "Empresas" no Google Drive
 * Caminho: Contabil > Escrito > Departamento Pessoal > Empresas
 *
 * Execute APÓS rodar authorize-google.mjs:
 *   node scripts/find-drive-folder.mjs
 */

import { readFileSync } from 'fs'
import { google } from 'googleapis'

const CREDENTIALS_PATH = 'G:/Meu Drive/KEY/client_secret_2_643560548265-fk0fj8d0jjsa1bs42b7j83be8np7tn8v.apps.googleusercontent.com.json'
const TOKEN_PATH = './google-token.json'

// Shortcut target ID (da estrutura de caminho do Google Drive local)
// G:\.shortcut-targets-by-id\1w8QGTvolY3YHFNxEOVLeT2iNDBYLQa24\Contabil\...
const SHORTCUT_TARGET_ID = '1w8QGTvolY3YHFNxEOVLeT2iNDBYLQa24'

const creds = JSON.parse(readFileSync(CREDENTIALS_PATH, 'utf8'))
const tokens = JSON.parse(readFileSync(TOKEN_PATH, 'utf8'))

const auth = new google.auth.OAuth2(
  creds.installed.client_id,
  creds.installed.client_secret,
  'http://localhost:3333/callback'
)
auth.setCredentials(tokens)

const drive = google.drive({ version: 'v3', auth })

async function findFolder(name, parentId) {
  const safe = name.replace(/'/g, "\\'")
  const res = await drive.files.list({
    q: `'${parentId}' in parents and name = '${safe}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    pageSize: 10,
  })
  return res.data.files?.[0] ?? null
}

async function main() {
  console.log('\n🔍 Navegando pela estrutura do Google Drive...\n')
  console.log('Ponto de entrada (shortcut target):', SHORTCUT_TARGET_ID)

  // Verifica se a pasta raiz é acessível
  try {
    const root = await drive.files.get({
      fileId: SHORTCUT_TARGET_ID,
      fields: 'id, name, mimeType',
    })
    console.log(`✅ Pasta raiz encontrada: "${root.data.name}" (${root.data.mimeType})`)
  } catch (e) {
    console.error('❌ Não foi possível acessar o shortcut target:', e.message)
    console.log('\n💡 Tentando navegar pela raiz do Drive...')
  }

  // Navega pelo caminho
  const PATH = ['Contabil', 'Escrito', 'Departamento Pessoal', 'Empresas']
  let currentId = SHORTCUT_TARGET_ID
  let currentName = 'root'

  for (const folderName of PATH) {
    const found = await findFolder(folderName, currentId)
    if (!found) {
      console.error(`\n❌ Pasta "${folderName}" não encontrada dentro de "${currentName}"`)
      console.log('\n💡 Listando o que existe dentro da pasta atual:')
      const list = await drive.files.list({
        q: `'${currentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id, name)',
        pageSize: 30,
      })
      list.data.files?.forEach(f => console.log(`   📁 ${f.name} (${f.id})`))
      process.exit(1)
    }
    console.log(`  📁 ${folderName} → ${found.id}`)
    currentId = found.id
    currentName = folderName
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ PASTA "EMPRESAS" ENCONTRADA!')
  console.log('='.repeat(60))
  console.log('\nAdicione no Vercel e no .env.local:')
  console.log(`\nGOOGLE_DRIVE_EMPRESAS_FOLDER_ID=${currentId}\n`)
  console.log('='.repeat(60))

  // Lista algumas empresas para confirmar
  console.log('\n📋 Primeiras empresas encontradas:')
  const empresas = await drive.files.list({
    q: `'${currentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(name)',
    orderBy: 'name',
    pageSize: 10,
  })
  empresas.data.files?.forEach(f => console.log(`   🏢 ${f.name}`))
  if ((empresas.data.files?.length ?? 0) === 0) {
    console.log('   (nenhuma encontrada — verifique as permissões)')
  }
}

main().catch(e => {
  console.error('\n❌ Erro:', e.message)
  process.exit(1)
})
