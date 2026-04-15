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

function PspLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="100" height="100" rx="16" fill="#0A1628"/>
      <text y="76" fontSize="68" fontFamily="Georgia,serif" fill="#C9A84C" x="10" fontWeight="bold">P</text>
      <rect x="58" y="30" width="24" height="4" rx="2" fill="#C9A84C"/>
      <rect x="58" y="42" width="18" height="4" rx="2" fill="#C9A84C" opacity="0.6"/>
      <rect x="58" y="54" width="20" height="4" rx="2" fill="#C9A84C" opacity="0.4"/>
    </svg>
  )
}

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
    <nav className="bg-[#0A1628] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <PspLogo />
            <span className="font-bold text-sm tracking-tight text-[#C9A84C]">PSP Contabilidade — Área do Cliente</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  pathname === href ? 'bg-[#040C1A]' : 'hover:bg-[#0F1E35]'
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#D4B96A] hidden md:block">{userName}</span>
          <button onClick={logout} className="flex items-center gap-1 text-xs hover:text-[#D4B96A] transition">
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
                pathname === href ? 'bg-[#040C1A]' : 'hover:bg-[#0F1E35]'
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
