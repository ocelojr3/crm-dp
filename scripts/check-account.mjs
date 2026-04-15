/**
 * Verifica qual conta Google está autorizada
 * Execute: node scripts/check-account.mjs
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

async function main() {
  // Descobre qual e-mail está autorizado
  const oauth2 = google.oauth2({ version: 'v2', auth })
  const info = await oauth2.userinfo.get()
  console.log('\n👤 Conta autorizada:', info.data.email)
  console.log('   Nome:', info.data.name)
  console.log('\n⚠️  Esta conta precisa ser a DONA ou ter EDITOR da pasta Empresas.')
  console.log('   Se não for, faça logout e authorize com a conta correta.')
}

main().catch(e => console.error('❌', e.message))
