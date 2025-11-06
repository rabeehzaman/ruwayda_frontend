import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()

  // Check for language query parameter first
  const langParam = url.searchParams.get('lang')

  // Check for language preference in cookies
  const langCookie = request.cookies.get('preferred-language')?.value

  // Determine locale: query param > cookie > user preference > default (en)
  let locale = 'en'
  if (langParam === 'ar' || langParam === 'en') {
    locale = langParam
  } else if (langCookie === 'ar' || langCookie === 'en') {
    locale = langCookie
  }

  // Create response (headers will be set after determining final locale)
  let res = NextResponse.next()

  // Create Supabase client with proper cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
        },
      },
    }
  )

  // Get session
  const { data: { session } } = await supabase.auth.getSession()

  // Fetch user's preferred language if logged in and no manual override
  if (session && !langParam && !langCookie) {
    const { data: userPrefs } = await supabase
      .from('user_branch_permissions')
      .select('preferred_language')
      .eq('user_id', session.user.id)
      .single()

    if (userPrefs?.preferred_language === 'ar' || userPrefs?.preferred_language === 'en') {
      locale = userPrefs.preferred_language
    }
  }

  // Calculate isArabic after all locale logic
  const isArabic = locale === 'ar'

  // Public routes that don't require authentication
  const publicRoutes = ['/login']
  const isPublicRoute = publicRoutes.some(route => url.pathname.startsWith(route))

  // Redirect to login if not authenticated
  if (!session && !isPublicRoute) {
    const redirectUrl = url.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectedFrom', url.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to home if authenticated and trying to access login
  if (session && url.pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Check if user is trying to access a hidden page
  if (session && !isPublicRoute) {
    const { data: userPerms } = await supabase
      .from('user_branch_permissions')
      .select('hidden_pages, allowed_branches')
      .eq('user_id', session.user.id)
      .single()

    // Only enforce hidden pages for non-admin users
    const isAdmin = userPerms?.allowed_branches?.includes('*') || false
    const hiddenPages = userPerms?.hidden_pages || []

    // If user is not admin and trying to access a hidden page, redirect to home
    if (!isAdmin && hiddenPages.length > 0 && hiddenPages.includes(url.pathname)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Set locale in response headers for client-side access
  res.headers.set('x-locale', locale)
  res.headers.set('x-is-arabic', isArabic.toString())

  // If language was set via query parameter, store it in a cookie
  if (langParam && (langParam === 'ar' || langParam === 'en')) {
    res.cookies.set('preferred-language', langParam, {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: '/',
      secure: true,
      sameSite: 'lax'
    })
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|manifest.json|sw.js|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)',
  ],
}