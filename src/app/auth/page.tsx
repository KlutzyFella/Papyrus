"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/Header"
import { createBrowserClient } from "@supabase/ssr"
import { Loader2, Mail, Lock, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AuthPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        router.replace("/chat")
      }
    }

    checkSession()
  }, [router, supabase.auth])

  const handleSignUp = async () => {
    setError("")
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setError("Check your email for the confirmation link!")
      }
    } catch (_) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = async () => {
    setError("")
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setError(error.message)
      } else {
        router.push("/chat")
      }
    } catch (_) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isSignUp) {
      handleSignUp()
    } else {
      handleSignIn()
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-10">
        <Header />
      </div>

      <main className="flex-1 flex items-center justify-center px-4 mt-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome</h1>
            <p className="text-zinc-400">Sign in to your account or create a new one</p>
          </div>

          <div className="mb-6">
            <div className="flex rounded-md overflow-hidden">
              <button
                onClick={() => setIsSignUp(false)}
                className={`flex-1 py-3 text-center font-medium ${
                  !isSignUp ? "bg-emerald-600 text-white" : "bg-zinc-700 text-zinc-300"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsSignUp(true)}
                className={`flex-1 py-3 text-center font-medium ${
                  isSignUp ? "bg-emerald-600 text-white" : "bg-zinc-700 text-zinc-300"
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-white">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 py-6 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-white">
                  Password
                </label>
                <button type="button" className="text-sm text-zinc-400 hover:text-emerald-400">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 py-6 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            {error && (
              <Alert
                className={
                  error.includes("Check your email")
                    ? "bg-emerald-900/20 border-emerald-900 text-emerald-300"
                    : "bg-red-900/20 border-red-900 text-red-300"
                }
              >
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                <div className="flex items-center justify-center">
                  <LogIn className="mr-2 h-5 w-5" />
                  {isSignUp ? "Sign Up" : "Sign In"}
                </div>
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
