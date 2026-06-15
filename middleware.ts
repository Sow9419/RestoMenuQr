import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware Supabase — Deux rôles :
 * 1. Rafraîchir le token de session sur chaque requête (requis pour SSR Supabase)
 * 2. Rediriger `/` vers `/login` si l'utilisateur n'est pas authentifié
 *
 * La protection fine des routes admin est déléguée au layout `(admin)`.
 * Voir : ARCHITECTURE.md — Middleware + ROLES_AND_PERMISSIONS.md
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Laisser passer les assets Next.js internes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/.test(pathname)
  ) {
    return NextResponse.next({ request })
  }

  let response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey || !url.startsWith('http')) {
    return response
  }

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set({ name, value, ...options })
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Rafraîchir la session (NE PAS utiliser getSession() ici — non sécurisé côté serveur)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Rediriger la racine `/` vers /login si non authentifié
  if (pathname === '/' && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // La protection des routes admin est déléguée au layout (admin) qui vérifie
  // la session + le profil restaurant. Requête DB trop coûteuse en middleware Edge.

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
