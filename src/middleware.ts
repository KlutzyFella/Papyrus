import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()

    // Unsure about this, but we keep this for now
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name) {
                    return req.cookies.get(name)?.value
                },
                set(name, value, options) {
                    res.cookies.set(name, value, options)
                },
                remove(name, options) {
                    res.cookies.set(name, '', {
                        ...options,
                        maxAge: -1,
                    })
                },
            },
        }
    )
    const session = await supabase.auth.getSession()
    console.log('[middleware] session:', session)

    return res
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
