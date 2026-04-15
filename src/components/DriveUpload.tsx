'use client'

import { useState, useRef } from 'react'
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface Props {
  companyId: string
  companyName: string
}

const CURRENT_YEAR = new Date().getFullYear()
const CURRENT_MONTH = new Date().getMonth() + 1

function buildCompetencias(): string[] {
  const list: string[] = []
  for (let y = CURRENT_YEAR; y >= CURRENT_YEAR - 2; y--) {
    const maxM = y === CURRENT_YEAR ? CURRENT_MONTH : 12
    for (let m = maxM; m >= 1; m--) {
      list.push(`${y}-${String(m).padStart(2, '0')}`)
    }
  }
  return list
}

export default function DriveUpload({ companyId, companyName }: Props) {
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [competencia, setCompetencia] = useState(
    `${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2, '0')}`
  )
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState<{ name: string; ok: boolean; msg?: string }[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) setFiles(Array.from(e.target.files))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setFiles(Array.from(e.dataTransfer.files))
  }

  async function handleUpload() {
    if (!files.length || !competencia) return
    setUploading(true)
    setResults([])

    const newResults: { name: string; ok: boolean; msg?: string }[] = []

    for (const file of files) {
      const form = new FormData()
      form.append('file', file)
      form.append('companyName', companyName)
      form.append('competencia', competencia)
      form.append('companyId', companyId)

      try {
        const res = await fetch('/api/drive/upload', { method: 'POST', body: form })
        const json = await res.json()
        if (res.ok) {
          newResults.push({ name: file.name, ok: true })
        } else {
          newResults.push({ name: file.name, ok: false, msg: json.error ?? 'Erro desconhecido' })
        }
      } catch {
        newResults.push({ name: file.name, ok: false, msg: 'Falha na conexão' })
      }
    }

    setResults(newResults)
    setUploading(false)
    setFiles([])
    if (inputRef.current) inputRef.current.value = ''
  }

  function reset() {
    setOpen(false)
    setFiles([])
    setResults([])
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-[#0A1628] font-semibold text-sm rounded-lg hover:bg-[#D4B96A] transition"
      >
        <Upload size={15} />
        Enviar documentos de folha
      </button>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm max-w-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-800">📁 Upload — Folha de Pagamento</p>
          <p className="text-xs text-gray-500 mt-0.5">{companyName}</p>
        </div>
        <button onClick={reset} className="text-gray-400 hover:text-gray-600 transition">
          <X size={16} />
        </button>
      </div>

      {/* Competência */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Competência</label>
        <select
          value={competencia}
          onChange={e => setCompetencia(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
        >
          {buildCompetencias().map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#C9A84C] hover:bg-yellow-50 transition"
      >
        <Upload size={24} className="mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">
          {files.length > 0
            ? `${files.length} arquivo(s) selecionado(s)`
            : 'Clique ou arraste os arquivos aqui'}
        </p>
        <p className="text-xs text-gray-400 mt-1">PDF, Excel, Word — máx. 25 MB por arquivo</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.xlsx,.xls,.docx,.doc"
          onChange={handleFiles}
          className="hidden"
        />
      </div>

      {/* Lista de arquivos selecionados */}
      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
              <FileText size={13} className="text-[#C9A84C] shrink-0" />
              <span className="truncate">{f.name}</span>
              <span className="text-gray-400 shrink-0">({(f.size / 1024).toFixed(0)} KB)</span>
            </li>
          ))}
        </ul>
      )}

      {/* Resultados */}
      {results.length > 0 && (
        <ul className="space-y-1">
          {results.map((r, i) => (
            <li key={i} className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${r.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {r.ok ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
              <span className="truncate">{r.name}</span>
              {r.msg && <span className="ml-auto shrink-0">{r.msg}</span>}
            </li>
          ))}
        </ul>
      )}

      {/* Botão */}
      <button
        onClick={handleUpload}
        disabled={!files.length || uploading}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#0A1628] text-white text-sm font-medium rounded-lg hover:bg-[#060E1A] transition disabled:opacity-40"
      >
        {uploading ? (
          <><Loader2 size={15} className="animate-spin" /> Enviando {files.length} arquivo(s)...</>
        ) : (
          <><Upload size={15} /> Enviar para o Drive</>
        )}
      </button>
    </div>
  )
}
