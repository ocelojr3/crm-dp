/**
 * Script de autorização única do Google Drive
 * Execute: node scripts/authorize-google.mjs
 * Isso gera o REFRESH_TOKEN que você vai colocar no Vercel.
 */

import { createServer } from 'http'
import { google } from 'googleapis'
import open from 'open'
import { readFileSync, writeFileSync } from 'fs'

const CREDENTIALS_PATH = 'G:/Meu Drive/KEY/client_secret_2_643560548265-fk0fj8d0jjsa1bs42b7j83be8np7tn8v.apps.googleusercontent.com.json'
const TOKEN_OUTPUT = './google-token.json'

const creds = JSON.parse(readFileSync(CREDENTIALS_PATH, 'utf8'))
const { client_id, client_secret } = creds.installed

const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  'http://localhost:3333/callback'
)

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata',
]

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent',
})

console.log('\n📂 Abrindo navegador para autorização Google Drive...')
console.log('Se não abrir automaticamente, acesse:\n', authUrl)

// Servidor local para capturar o callback
const server = createServer(async (req, res) => {
  if (!req.url.startsWith('/callback')) return

  const url = new URL(req.url, 'http://localhost:3333')
  const code = url.searchParams.get('code')

  if (!code) {
    res.end('<h1>Erro: código não encontrado</h1>')
    return
  }

  const { tokens } = await oauth2Client.getToken(code)

  writeFileSync(TOKEN_OUTPUT, JSON.stringify(tokens, null, 2))

  console.log('\n✅ AUTORIZAÇÃO CONCLUÍDA!\n')
  console.log('Adicione estas variáveis no Vercel:')
  console.log('─────────────────────────────────────────')
  console.log('GOOGLE_CLIENT_ID =', client_id)
  console.log('GOOGLE_CLIENT_SECRET =', client_secret)
  console.log('GOOGLE_REFRESH_TOKEN =', tokens.refresh_token)
  console.log('─────────────────────────────────────────')
  console.log('\nArquivo salvo em:', TOKEN_OUTPUT)

  res.end(`
    <html><body style="font-family:sans-serif;padding:40px;background:#0A1628;color:#C9A84C">
      <h1>✅ Google Drive autorizado!</h1>
      <p style="color:white">Volte ao terminal para ver as variáveis de ambiente.</p>
      <p style="color:white">Pode fechar esta janela.</p>
    </body></html>
  `)

  server.close()
  process.exit(0)
})

server.listen(3333, () => {
  open(authUrl)
})
