import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get user session
  // getUser is safer than getSession as it validates the session against the database
  const { data: { user } } = await supabase.auth.getUser()

  // Define public routes that don't require authentication
  const path = request.nextUrl.pathname
  
  // Public routes (accessible without login) - excluding root which has special handling
  const publicRoutes = [
    '/register-player/public',
    '/register-player/qr', // Assuming QR page might also need to be public or it redirects to public
    '/live',
  ]
  
  // Auth routes (login, register via auth, etc.) - should redirect to dashboard if already logged in
  // Exclude /register-player from auth routes check
  const isAuthRoute = path.startsWith('/login') || (path.startsWith('/register') && !path.startsWith('/register-player'))
  
  const isPublicRoute = publicRoutes.some(route => path === route || path.startsWith(route))
  
  // Special handling for root path: redirect authenticated users to dashboard
  if (user && path === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }
  
  // If user is logged in and tries to access auth routes, redirect to dashboard
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }
  
  // If user is NOT logged in and tries to access protected routes (anything not public, auth, or root)
  if (!user && !isPublicRoute && !isAuthRoute && path !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return response
}
