'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Building2, FileText, MessageSquare, CheckSquare, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

const links = [
  { href: '/admin', label: 'Dashboard', icon: Building2 },
  { href: '/admin/companies', label: 'Empresas', icon: Building2 },
  { href: '/admin/documents', label: 'Documentos', icon: FileText },
  { href: '/admin/messages', label: 'Mensagens', icon: MessageSquare },
  { href: '/admin/tasks', label: 'Tarefas', icon: CheckSquare },
]

export default function AdminNav({ userName }: { userName: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="bg-indigo-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg tracking-tight">Portal DP</span>
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  pathname === href ? 'bg-indigo-900' : 'hover:bg-indigo-600'
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-indigo-200 hidden md:block">{userName}</span>
          <button onClick={logout} className="flex items-center gap-1 text-xs hover:text-indigo-200 transition">
            <LogOut size={14} /> Sair
          </button>
          <button className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden px-4 pb-3 space-y-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                pathname === href ? 'bg-indigo-900' : 'hover:bg-indigo-600'
              }`}
            >
              <Icon size={15} /> {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
