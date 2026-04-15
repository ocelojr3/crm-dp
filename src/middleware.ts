import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // ── Sem sessão → redireciona para login em qualquer rota protegida ──
  if ((pathname.startsWith('/admin') || pathname.startsWith('/portal')) && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── Usuário logado → verificar role e proteger rotas ──
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    // Logado acessando /login → redireciona para o painel correto
    if (pathname === '/login') {
      const dest = role === 'admin' ? '/admin' : '/portal'
      return NextResponse.redirect(new URL(dest, request.url))
    }

    // Client tentando acessar /admin → redireciona para /portal
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/portal', request.url))
    }

    // Admin tentando acessar /portal → redireciona para /admin
    if (pathname.startsWith('/portal') && role !== 'client') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*', '/portal/:path*', '/login', '/forgot-password', '/reset-password'],
}
