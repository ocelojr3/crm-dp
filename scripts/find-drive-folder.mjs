/**
 * Encontra o ID da pasta "Empresas" no Google Drive
 * Execute: node scripts/find-drive-folder.mjs
 */

import { readFileSync } from 'fs'
import { google } from 'googleapis'

const CREDENTIALS_PATH = 'G:/Meu Drive/KEY/client_secret_2_643560548265-fk0fj8d0jjsa1bs42b7j83be8np7tn8v.apps.googleusercontent.com.json'
const TOKEN_PATH = './google-token.json'

const creds = JSON.parse(readFileSync(CREDENTIALS_PATH, 'utf8'))
const tokens = JSON.parse(readFileSync(TOKEN_PATH, 'utf8'))

const auth = new google.auth.OAuth2(
  creds.installed.client_id,
  creds.installed.client_secret,
  'http://localhost:3333/callback'
)
auth.setCredentials(tokens)

const drive = google.drive({ version: 'v3', auth })

async function listFolder(parentId, label) {
  const res = await drive.files.list({
    q: `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    orderBy: 'name',
    pageSize: 50,
  })
  console.log(`\n📁 Pastas em "${label}":`)
  if (!res.data.files?.length) {
    console.log('   (nenhuma pasta encontrada)')
  } else {
    res.data.files.forEach(f => console.log(`   📁 ${f.name.padEnd(40)} ID: ${f.id}`))
  }
  return res.data.files ?? []
}

async function findByName(parentId, name) {
  const safe = name.replace(/'/g, "\\'")
  const res = await drive.files.list({
    q: `'${parentId}' in parents and name = '${safe}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    pageSize: 5,
  })
  return res.data.files?.[0] ?? null
}

async function searchAnywhere(name) {
  const safe = name.replace(/'/g, "\\'")
  const res = await drive.files.list({
    q: `name = '${safe}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name, parents)',
    pageSize: 10,
  })
  return res.data.files ?? []
}

async function main() {
  console.log('\n🔍 Explorando seu Google Drive...\n')

  // 1. Lista raiz do Drive
  const rootFolders = await listFolder('root', 'Meu Drive (raiz)')

  // 2. Busca "Empresas" em qualquer lugar do Drive
  console.log('\n\n🔎 Buscando pasta "Empresas" em todo o Drive...')
  const empresasResults = await searchAnywhere('Empresas')
  if (empresasResults.length > 0) {
    console.log(`✅ Encontrado(s):`)
    empresasResults.forEach(f => console.log(`   📁 ${f.name}  ID: ${f.id}  Pai: ${f.parents?.[0]}`))
  } else {
    console.log('❌ Pasta "Empresas" não encontrada')
  }

  // 3. Busca "Departamento Pessoal"
  console.log('\n\n🔎 Buscando "Departamento Pessoal"...')
  const dpResults = await searchAnywhere('Departamento Pessoal')
  if (dpResults.length > 0) {
    dpResults.forEach(f => console.log(`   📁 ${f.name}  ID: ${f.id}`))
    // Lista conteúdo do primeiro resultado
    for (const dp of dpResults) {
      await listFolder(dp.id, dp.name)
    }
  } else {
    console.log('❌ Não encontrado')
  }

  // 4. Tenta navegar por cada pasta da raiz até 2 níveis
  console.log('\n\n🔎 Navegando 2 níveis a partir da raiz...')
  for (const folder of rootFolders.slice(0, 15)) {
    const sub = await drive.files.list({
      q: `'${folder.id}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
      orderBy: 'name',
      pageSize: 20,
    })
    if (sub.data.files?.length) {
      console.log(`\n  📁 ${folder.name}/`)
      sub.data.files.forEach(f => console.log(`    📁 ${f.name.padEnd(38)} ID: ${f.id}`))
    }
  }

  console.log('\n\n💡 Copie o ID da pasta "Empresas" e adicione ao Vercel como:')
  console.log('   GOOGLE_DRIVE_EMPRESAS_FOLDER_ID=<id>\n')
}

main().catch(e => {
  console.error('\n❌ Erro:', e.message)
  process.exit(1)
})
