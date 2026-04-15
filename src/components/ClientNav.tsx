'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FileText, MessageSquare, CheckSquare, LogOut } from 'lucide-react'

const links = [
  { href: '/portal', label: 'Início', icon: FileText },
  { href: '/portal/documents', label: 'Documentos', icon: FileText },
  { href: '/portal/messages', label: 'Mensagens', icon: MessageSquare },
  { href: '/portal/tasks', label: 'Tarefas', icon: CheckSquare },
]

function PspLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="100" height="100" rx="16" fill="#0A1628"/>
      <text y="76" fontSize="68" fontFamily="Georgia,serif" fill="#C9A84C" x="10" fontWeight="bold">P</text>
      <rect x="58" y="30" width="24" height="4" rx="2" fill="#C9A84C"/>
      <rect x="58" y="42" width="18" height="4" rx="2" fill="#C9A84C" opacity="0.6"/>
      <rect x="58" y="54" width="20" height="4" rx="2" fill="#C9A84C" opacity="0.4"/>
    </svg>
  )
}

export default function ClientNav({ userName, companyName }: { userName: string; companyName: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <PspLogo />
            <div>
              <span className="font-bold text-[#0A1628] text-sm">PSP Contabilidade — Área do Cliente</span>
              {companyName && <span className="text-xs text-gray-400 ml-2">· {companyName}</span>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  pathname === href ? 'bg-[#FBF7EE] text-[#0A1628]' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={14} />{label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{userName}</span>
          <button onClick={logout} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition">
            <LogOut size={14} /> Sair
          </button>
        </div>
      </div>
    </nav>
  )
}
