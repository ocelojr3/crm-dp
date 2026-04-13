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
          <div>
            <span className="font-bold text-indigo-700 text-sm">Portal DP</span>
            {companyName && <span className="text-xs text-gray-400 ml-2">· {companyName}</span>}
          </div>
          <div className="flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  pathname === href ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
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
