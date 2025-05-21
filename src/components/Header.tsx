"use client"

import { useEffect, useState, useRef } from "react"
import { BookOpen, LogOut, Menu, X } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function Header() {
    const [user, setUser] = useState<{ email: string | null; initials: string }>({
        email: null,
        initials: "",
    })
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const router = useRouter()
    const mobileMenuRef = useRef<HTMLDivElement>(null)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    useEffect(() => {
        const fetchUser = async () => {
            const { data } = await supabase.auth.getUser()
            if (data.user) {
                const email = data.user.email ?? null
                const initials = email ? email.substring(0, 2).toUpperCase() : "U"
                setUser({ email, initials })
            }
        }

        fetchUser()
    }, [supabase.auth])

    useEffect(() => {
        // Close mobile menu when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
                setIsMobileMenuOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/auth")
    }

    return (
        <header className="w-full h-16 px-4 md:px-6 flex items-center justify-between bg-zinc-800 border-b border-zinc-700 shadow-md z-50">
            <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-emerald-500" />
                    <h1 className="text-xl font-bold text-white hidden sm:inline-block">Papyrus</h1>
                </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
                {/* Navigation links removed as requested */}

                {user.email ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                <Avatar className="h-9 w-9 bg-zinc-600 border-2 border-emerald-500 text-emerald-300">
                                    <AvatarFallback>{user.initials}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 bg-zinc-800 border-zinc-700 text-zinc-100" align="end">
                            <div className="flex items-center justify-start gap-2 p-2">
                                <div className="flex flex-col space-y-1 leading-none">
                                    <p className="font-medium text-sm text-zinc-200">{user.email}</p>
                                </div>
                            </div>
                            <DropdownMenuSeparator className="bg-zinc-700" />
                            {/* Profile and Settings options removed as requested */}
                            <DropdownMenuItem
                                className="cursor-pointer text-red-400 focus:bg-red-900/20 focus:text-red-400"
                                onClick={handleLogout}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Button
                        variant="default"
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => router.push("/auth")}
                    >
                        Sign In
                    </Button>
                )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
                {user.email && (
                    <Avatar className="h-8 w-8 mr-2 bg-zinc-600 border-2 border-emerald-500 text-emerald-300">
                        <AvatarFallback>{user.initials}</AvatarFallback>
                    </Avatar>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-zinc-200"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div
                    ref={mobileMenuRef}
                    className="absolute top-16 right-0 w-full bg-zinc-800 border-b border-zinc-700 shadow-lg z-50 md:hidden"
                >
                    <div className="flex flex-col p-4 space-y-3">
                        {/* Navigation links removed as requested */}
                        {user.email ? (
                            <>
                                <div className="pt-2 border-t border-zinc-700">
                                    <p className="px-3 text-sm text-zinc-400">Signed in as</p>
                                    <p className="px-3 text-sm font-medium text-zinc-200">{user.email}</p>
                                </div>
                                {/* Profile and Settings options removed as requested */}
                                <button
                                    onClick={() => {
                                        handleLogout()
                                        setIsMobileMenuOpen(false)
                                    }}
                                    className="flex items-center text-red-400 py-2 px-3 rounded-md hover:bg-red-900/20 transition-colors text-left"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Log out
                                </button>
                            </>
                        ) : (
                            <Button
                                variant="default"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white mt-2"
                                onClick={() => {
                                    router.push("/auth")
                                    setIsMobileMenuOpen(false)
                                }}
                            >
                                Sign In
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </header>
    )
}
