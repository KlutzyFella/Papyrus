'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { ArrowUp, Paperclip } from 'lucide-react'
import { sendToGemini } from '@/lib/gemini'
import { createBrowserClient } from '@supabase/ssr'

export default function ChatPage() {
    const router = useRouter()
    const [messages, setMessages] = useState<{ type: 'user' | 'bot'; text: string }[]>([])
    const [input, setInput] = useState('')
    const [pdfName, setPdfName] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const bottomRef = useRef<HTMLDivElement>(null)
    const [pdfText, setPdfText] = useState('')

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                router.replace('/auth')
            }
            else {
                router.replace('/chat')
            }
        })
    }, [])

    const sendMessage = async () => {
        if (!input.trim()) return

        const userText = input
        setMessages((prev) => [...prev, { type: 'user', text: input }])
        setInput('')

        const contextPrompt = pdfText
            ? `Here's the content of the PDF:\n${pdfText}\n\nUser question: ${userText}`
            : userText

        await fetch('/api/saveMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                role: 'user',
                text: userText,
                pdfName: pdfName ?? null,
            })
        })

        const botReply = await sendToGemini(contextPrompt)
        setMessages((prev) => [...prev, { type: 'bot', text: botReply }])

        await fetch('/api/saveMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                role: 'assistant',
                text: botReply,
                pdfName: pdfName ?? null,
            })
        })
    }

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleAttachPDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || file.type !== 'application/pdf') return

        // debug 
        console.log('File selected:', file.name)

        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/pdf', {
            method: 'POST',
            body: formData,
        })

        const json = await res.json()

        // debug
        console.log('PDF response:', json)

        if (json.text) {
            setPdfText(json.text)
            setPdfName(file.name)
        }
    }


    return (
        <>
            <Header />
            <main className="w-full h-screen flex flex-col items-center justify-center">

                {/* Message history*/}
                <div className="w-full p bg-zinc-800 overflow-y-auto space-y-3 scrollbar-custom flex-1 justify-center items-center">

                    <div className='w-1/2'>
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`m-4 p-2 rounded max-w-[70%] ${msg.type === 'user' ? 'bg-zinc-400 ml-auto text-right' : 'bg-gray-300'
                                    }`}
                            >
                                {msg.text}
                            </div>
                        ))}

                        {messages.length === 0 && (
                            <p className="text-center text-gray-400">Hey! What do you need help with?</p>
                        )}

                        <div ref={bottomRef} />
                    </div>
                </div>

                {/* Input area */}
                <div className="h-28 bottom-0 left-0 w-full bg-zinc-800 p-4 flex justify-center items-center gap-2 z-10">

                    <div className='w-1/2 flex justify-center items-center gap-2'>

                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            className="flex-1 bg-zinc-700 p-2 rounded-xl text-white"
                            placeholder="Type your message..."
                        />

                        <button
                            className="bg-zinc-100 hover:bg-zinc-300 text-black px-2 py-2 rounded-full"
                            onClick={sendMessage}
                        >
                            <ArrowUp size={20} />
                        </button>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-2 py-2 bg-zinc-100 hover:bg-zinc-300 rounded-full"
                        >
                            <Paperclip size={20} />
                        </button>

                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={handleAttachPDF}
                            ref={fileInputRef}
                            className="hidden"
                        />
                    </div>
                </div>

                {pdfName && (
                    <p className="text-sm text-gray-500 mt-1">
                        Attached PDF: <span className="font-medium">{pdfName}</span>
                    </p>
                )}
            </main>
        </>
    )
}
