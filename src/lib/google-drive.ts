/**
 * Google Drive — PSP Contabilidade
 * Integração restrita a: Departamento Pessoal → Folha de Pagamento
 *
 * Estrutura no Drive:
 *   <ROOT_ID>/Contabil/Escrito/Departamento Pessoal/Empresas
 *     └── NOME DA EMPRESA/
 *         └── AAAA-MM/        ← competência
 *             ├── holerite_joao.pdf
 *             ├── FGTS_abril.pdf
 *             └── DARF_inss.pdf
 */

import { google, drive_v3 } from 'googleapis'

// ── Auth ──────────────────────────────────────────────────────
function getOAuth2Client() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3333/callback'
  )
  client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })
  return client
}

function getDrive(): drive_v3.Drive {
  return google.drive({ version: 'v3', auth: getOAuth2Client() })
}

// ── ID raiz navegável (shortcut target já é o ID direto no Drive) ──
// Caminho: <ROOT_SHORTCUT>/Contabil/Escrito/Departamento Pessoal/Empresas
// O env GOOGLE_DRIVE_ROOT_ID deve ser o ID da pasta logo acima de "Contabil"
// ou diretamente o ID da pasta "Empresas".
// Execute node scripts/find-drive-folder.mjs para descobrir automaticamente.
const EMPRESAS_FOLDER_ID = process.env.GOOGLE_DRIVE_EMPRESAS_FOLDER_ID ?? ''

// ── Helpers internos ──────────────────────────────────────────

/** Busca a primeira pasta com o nome dado dentro de um pai */
async function findFolder(
  drive: drive_v3.Drive,
  name: string,
  parentId: string
): Promise<string | null> {
  const safe = name.trim().replace(/'/g, "\\'")
  const res = await drive.files.list({
    q: `'${parentId}' in parents and name = '${safe}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    spaces: 'drive',
    pageSize: 5,
  })
  return res.data.files?.[0]?.id ?? null
}

/** Encontra ou cria uma subpasta dentro de um pai */
async function findOrCreateFolder(
  drive: drive_v3.Drive,
  name: string,
  parentId: string
): Promise<string> {
  const existing = await findFolder(drive, name, parentId)
  if (existing) return existing

  const res = await drive.files.create({
    requestBody: {
      name: name.trim(),
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
  })
  return res.data.id!
}

/**
 * Resolve a pasta de uma empresa e competência:
 *   Empresas/ → <companyName>/ → <competencia>/
 * Se competencia não fornecida, retorna a pasta da empresa.
 */
async function resolveFolder(companyName: string, competencia?: string): Promise<string | null> {
  if (!EMPRESAS_FOLDER_ID) throw new Error('GOOGLE_DRIVE_EMPRESAS_FOLDER_ID não configurado. Execute scripts/find-drive-folder.mjs')
  const drive = getDrive()

  // Pasta da empresa (busca exata — NÃO cria automaticamente para evitar duplicatas)
  const companyId = await findFolder(drive, companyName, EMPRESAS_FOLDER_ID)
  if (!companyId) return null

  if (!competencia) return companyId

  // Pasta de competência (cria se não existir)
  const compId = await findOrCreateFolder(drive, competencia, companyId)
  return compId
}

// ── Tipos públicos ────────────────────────────────────────────

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  size: string
  createdTime: string
  webViewLink: string
  webContentLink: string
}

// ── API pública ───────────────────────────────────────────────

/**
 * Lista arquivos de folha de uma empresa.
 * Se competencia fornecida → lista arquivos daquela competência.
 * Caso contrário → lista todas as subpastas (competências).
 */
export async function listPayrollFiles(
  companyName: string,
  competencia?: string
): Promise<{ files: DriveFile[]; folders: string[] }> {
  const drive = getDrive()

  const targetId = await resolveFolder(companyName, competencia)
  if (!targetId) return { files: [], folders: [] }

  if (competencia) {
    // Lista arquivos da competência
    const res = await drive.files.list({
      q: `'${targetId}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'`,
      fields: 'files(id, name, mimeType, size, createdTime, webViewLink, webContentLink)',
      orderBy: 'name',
    })
    return { files: (res.data.files ?? []) as DriveFile[], folders: [] }
  }

  // Lista subpastas (competências)
  const res = await drive.files.list({
    q: `'${targetId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(name)',
    orderBy: 'name desc',
  })
  return {
    files: [],
    folders: (res.data.files ?? []).map(f => f.name ?? '').filter(Boolean),
  }
}

/**
 * Faz upload de arquivo de folha para a pasta correta no Drive.
 * Cria a pasta da empresa SE não existir (admin faz primeiro upload).
 */
export async function uploadPayrollFile(
  companyName: string,
  competencia: string,       // ex: "2025-04"
  fileName: string,
  mimeType: string,
  fileBuffer: Buffer
): Promise<DriveFile> {
  if (!EMPRESAS_FOLDER_ID) throw new Error('GOOGLE_DRIVE_EMPRESAS_FOLDER_ID não configurado')
  const drive = getDrive()

  // Para upload, cria empresa e competência se não existir
  const companyId = await findOrCreateFolder(drive, companyName, EMPRESAS_FOLDER_ID)
  const folderId = await findOrCreateFolder(drive, competencia, companyId)

  const { Readable } = await import('stream')
  const stream = Readable.from(fileBuffer)

  const res = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType, body: stream },
    fields: 'id, name, mimeType, size, createdTime, webViewLink, webContentLink',
  })

  // Torna acessível por link (leitura pública via link)
  await drive.permissions.create({
    fileId: res.data.id!,
    requestBody: { role: 'reader', type: 'anyone' },
  })

  return res.data as DriveFile
}

/** Deleta arquivo do Drive */
export async function deletePayrollFile(fileId: string): Promise<void> {
  await getDrive().files.delete({ fileId })
}

/** Lista empresas (subpastas da pasta Empresas) */
export async function listCompaniesInDrive(): Promise<string[]> {
  if (!EMPRESAS_FOLDER_ID) return []
  const drive = getDrive()
  const res = await drive.files.list({
    q: `'${EMPRESAS_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(name)',
    orderBy: 'name',
    pageSize: 500,
  })
  return (res.data.files ?? []).map(f => f.name ?? '').filter(Boolean)
}
