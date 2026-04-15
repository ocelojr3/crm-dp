/**
 * Google Drive — PSP Contabilidade
 * Integração restrita a: Departamento Pessoal → Folha de Pagamento
 *
 * Estrutura real no Drive:
 *   Empresas/
 *     └── NOME DA EMPRESA - XXXX/
 *         ├── FOLHA DE PAGAMENTO/   ← pasta que nos interessa
 *         │   ├── holerite_joao.pdf
 *         │   └── DARF_inss.pdf
 *         ├── FÉRIAS/
 *         ├── PRO LABORE/
 *         └── ...
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

const EMPRESAS_FOLDER_ID = process.env.GOOGLE_DRIVE_EMPRESAS_FOLDER_ID ?? ''

/** Nome exato da subpasta que contém os arquivos de folha */
const FOLHA_FOLDER_NAME = 'FOLHA DE PAGAMENTO'

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
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
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
    supportsAllDrives: true,
  })
  return res.data.id!
}

/**
 * Resolve a pasta FOLHA DE PAGAMENTO de uma empresa.
 * Se a subpasta não existir, retorna a pasta da empresa (fallback).
 * Se competencia fornecida, retorna a subpasta de data dentro de FOLHA DE PAGAMENTO.
 */
async function resolvePayrollFolder(
  companyName: string,
  competencia?: string
): Promise<string | null> {
  if (!EMPRESAS_FOLDER_ID) {
    throw new Error('GOOGLE_DRIVE_EMPRESAS_FOLDER_ID não configurado')
  }
  const drive = getDrive()

  // Pasta da empresa (busca exata — não cria automaticamente)
  const companyId = await findFolder(drive, companyName, EMPRESAS_FOLDER_ID)
  if (!companyId) return null

  // Pasta "FOLHA DE PAGAMENTO" dentro da empresa
  const folhaId = await findFolder(drive, FOLHA_FOLDER_NAME, companyId)
  const targetId = folhaId ?? companyId // fallback: usa pasta da empresa

  if (!competencia) return targetId

  // Subpasta de competência (cria se não existir)
  const compId = await findOrCreateFolder(drive, competencia, targetId)
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
 * Caso contrário → lista subpastas e arquivos dentro de FOLHA DE PAGAMENTO.
 */
export async function listPayrollFiles(
  companyName: string,
  competencia?: string
): Promise<{ files: DriveFile[]; folders: string[] }> {
  const drive = getDrive()

  const targetId = await resolvePayrollFolder(companyName, competencia)
  if (!targetId) return { files: [], folders: [] }

  // Lista tudo dentro da pasta alvo
  const res = await drive.files.list({
    q: `'${targetId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, size, createdTime, webViewLink, webContentLink)',
    orderBy: 'name',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  })

  const all = res.data.files ?? []
  const folders = all
    .filter(f => f.mimeType === 'application/vnd.google-apps.folder')
    .map(f => f.name ?? '')
    .filter(Boolean)

  const files = all.filter(
    f => f.mimeType !== 'application/vnd.google-apps.folder'
  ) as DriveFile[]

  return { files, folders }
}

/**
 * Faz upload de arquivo para a pasta FOLHA DE PAGAMENTO da empresa.
 * Se competencia fornecida, cria subpasta de data.
 * Cria pastas que não existirem automaticamente.
 */
export async function uploadPayrollFile(
  companyName: string,
  competencia: string,       // ex: "2025-04" ou "ABRIL 2025"
  fileName: string,
  mimeType: string,
  fileBuffer: Buffer
): Promise<DriveFile> {
  if (!EMPRESAS_FOLDER_ID) throw new Error('GOOGLE_DRIVE_EMPRESAS_FOLDER_ID não configurado')
  const drive = getDrive()

  // Cria empresa → FOLHA DE PAGAMENTO → competencia
  const companyId = await findOrCreateFolder(drive, companyName, EMPRESAS_FOLDER_ID)
  const folhaId = await findOrCreateFolder(drive, FOLHA_FOLDER_NAME, companyId)
  const folderId = await findOrCreateFolder(drive, competencia, folhaId)

  const { Readable } = await import('stream')
  const stream = Readable.from(fileBuffer)

  const res = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType, body: stream },
    fields: 'id, name, mimeType, size, createdTime, webViewLink, webContentLink',
    supportsAllDrives: true,
  })

  // Torna acessível por link (leitura via link)
  await drive.permissions.create({
    fileId: res.data.id!,
    requestBody: { role: 'reader', type: 'anyone' },
    supportsAllDrives: true,
  })

  return res.data as DriveFile
}

/** Deleta arquivo do Drive */
export async function deletePayrollFile(fileId: string): Promise<void> {
  await getDrive().files.delete({
    fileId,
    supportsAllDrives: true,
  })
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
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  })
  return (res.data.files ?? []).map(f => f.name ?? '').filter(Boolean)
}
