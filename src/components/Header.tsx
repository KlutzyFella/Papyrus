'use client'

import { useEffect, useState } from 'react'
import { BookOpen, CircleUser, LogOut } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function Header() {
  const [email, setEmail] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email ?? null)
      }
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  return (
    <header className="w-full h-16 px-4 py-3 border-b border-zinc-900 flex items-center justify-between bg-zinc-800 shadow-lg shadow-zinc-900/50 relative">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl text-zinc-100 font-semibold">
          <BookOpen className="inline mr-2" />
          Papyrus
        </h1>
      </div>

      {email && (
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 text-zinc-100 hover:underline"
          >
            <CircleUser />
            <span className="text-sm">{email}</span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-zinc-700 text-zinc-100 rounded-2xl shadow-lg py-1 z-50">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-zinc-600 flex items-center gap-2 rounded-2xl"
              >
                <LogOut size={16} />
                Log Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
