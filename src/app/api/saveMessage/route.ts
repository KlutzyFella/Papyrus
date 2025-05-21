import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(req: NextRequest) {
//   console.log('[api/saveMessage] starting...')

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value
        },
        set() {}, 
        remove() {}, 
      },
    }
  )

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

//   console.log('[api/saveMessage] user:', user)
//   console.log('[api/saveMessage] authError:', authError)

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await req.json()
  const { role, text, pdfName } = body

  const { error } = await supabase.from('messages').insert({
    user_id: user.id,
    role,
    text,
    pdf_name: pdfName ?? null,
    timestamp: new Date().toISOString(),
  })

  if (error) {
    console.error('DB insert failed:', error)
    return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
