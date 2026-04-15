'use client'

import { useEffect, useState, useCallback } from 'react'
import { FileText, Download, ExternalLink, FolderOpen, ChevronLeft, Loader2, AlertCircle } from 'lucide-react'

interface DriveFile {
  id: string
  name: string
  mimeType: string
  size: string
  createdTime: string
  webViewLink: string
  webContentLink: string
}

interface Props {
  companyName: string
  competencia?: string
}

function formatSize(bytes: string | undefined) {
  const n = parseInt(bytes ?? '0')
  if (!n) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(mimeType: string) {
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  return '📁'
}

export default function DriveDocumentsList({ companyName, competencia: initialCompetencia }: Props) {
  const [competencia, setCompetencia] = useState(initialCompetencia ?? '')
  const [folders, setFolders] = useState<string[]>([])
  const [files, setFiles] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (comp?: string) => {
    setLoading(true)
    setError('')
    try {
      const url = `/api/drive/files?companyName=${encodeURIComponent(companyName)}${comp ? `&competencia=${comp}` : ''}`
      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao carregar')
      setFolders(data.folders ?? [])
      setFiles(data.files ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar documentos')
    } finally {
      setLoading(false)
    }
  }, [companyName])

  useEffect(() => {
    load(initialCompetencia)
  }, [initialCompetencia, load])

  function openFolder(folder: string) {
    setCompetencia(folder)
    setFolders([])
    load(folder)
  }

  function goBack() {
    setCompetencia('')
    setFiles([])
    load(undefined)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Carregando documentos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl px-4 py-3 text-sm">
        <AlertCircle size={16} />
        {error}
      </div>
    )
  }

  // Navegação por competências
  if (!competencia && folders.length > 0) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Selecione a competência</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {folders.map(folder => (
            <button
              key={folder}
              onClick={() => openFolder(folder)}
              className="flex flex-col items-center gap-2 bg-white border border-gray-200 rounded-xl p-4 hover:border-[#C9A84C] hover:shadow-sm transition text-center"
            >
              <FolderOpen size={28} className="text-[#C9A84C]" />
              <span className="text-sm font-medium text-gray-700">{folder}</span>
            </button>
          ))}
        </div>
        {folders.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">
            Nenhum documento disponível ainda.
          </p>
        )}
      </div>
    )
  }

  // Lista de arquivos de uma competência
  return (
    <div className="space-y-3">
      {/* Breadcrumb */}
      {competencia && (
        <div className="flex items-center gap-2">
          <button
            onClick={goBack}
            className="flex items-center gap-1 text-sm text-[#C9A84C] hover:underline"
          >
            <ChevronLeft size={14} />
            Todas as competências
          </button>
          <span className="text-gray-300">›</span>
          <span className="text-sm font-semibold text-gray-700">{competencia}</span>
        </div>
      )}

      {files.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-8">
          Nenhum arquivo nesta competência.
        </p>
      ) : (
        <div className="space-y-2">
          {files.map(file => (
            <div
              key={file.id}
              className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3 hover:shadow-sm transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl shrink-0">{fileIcon(file.mimeType)}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatSize(file.size)}
                    {file.createdTime && (
                      <> · {new Date(file.createdTime).toLocaleDateString('pt-BR')}</>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-3">
                <a
                  href={file.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Visualizar"
                  className="p-2 text-gray-500 hover:text-[#0A1628] hover:bg-gray-100 rounded-lg transition"
                >
                  <ExternalLink size={15} />
                </a>
                <a
                  href={file.webContentLink}
                  download
                  title="Baixar"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A1628] text-white text-xs font-medium rounded-lg hover:bg-[#060E1A] transition"
                >
                  <Download size={13} />
                  Baixar
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
