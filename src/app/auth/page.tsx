"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { createBrowserClient } from '@supabase/ssr'


export default function AuthPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                router.replace('/chat')
            }
        })
    }, [])


    const handleSignUp = async () => {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) setError(error.message)
        // else alert('Check your email for confirmation!')
    }

    const handleSignIn = async () => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) setError(error.message)
        else router.push('/chat')
    }

    return (
        <>
            <Header />
            <div className='w-full h-screen flex flex-col justify-center items-center'>
                <div className="w-1/2 h-1/2 max-w-md mx-auto bg-zinc-900 p-6 border-zinc-900 rounded-4xl shadow-md space-y-4 flex flex-col justify-center items-center">
                    <h1 className="text-2xl font-bold text-center text-white">Get Started</h1>
                    <input
                        className="w-3/4 border p-2 rounded-lg text-white"
                        type="email"
                        placeholder="Email"
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        className="w-3/4 border p-2 rounded-lg text-white"
                        type="password"
                        placeholder="Password"
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <div className="flex gap-4">
                        <button className="bg-zinc-100 text-black px-4 py-2 rounded-xl hover:bg-zinc-300" onClick={handleSignIn}>
                            Log In
                        </button>
                        <button className="bg-zinc-100 text-black px-4 py-2 rounded-xl hover:bg-zinc-300" onClick={handleSignUp}>
                            Sign In
                        </button>
                    </div>
                    {error && <p className="text-red-500">{error}</p>}
                </div>
            </div>
        </>
    )
}
