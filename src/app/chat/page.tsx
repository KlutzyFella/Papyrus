"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/Header"
import { ArrowUp, Paperclip, Loader2 } from "lucide-react"
import { sendToGemini } from "@/lib/gemini"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<{ type: "user" | "bot"; text: string }[]>([])
  const [input, setInput] = useState("")
  const [pdfName, setPdfName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [pdfText, setPdfText] = useState("")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.replace("/auth")
      }
    }

    checkAuth()
  }, [router, supabase.auth])

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const res = await fetch("/api/getMessage")
        if (res.ok) {
          const data = await res.json()

          // Correctly map 'role' from DB to frontend 'type'
          const formatted = data.map((msg: any) => ({
            type: msg.role === "user" ? "user" : "bot",
            text: msg.text,
          }))

          setMessages(formatted)
        } else {
          console.error("Failed to load messages")
        }
      } catch (error) {
        console.error("Error loading messages:", error)
      }
    }

    loadMessages()
  }, [])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    setIsLoading(true)
    const userText = input
    setMessages((prev) => [...prev, { type: "user", text: input }])
    setInput("")

    try {
      const contextPrompt = pdfText
        ? `Here's the content of the PDF:\n${pdfText}\n\nUser question: ${userText}`
        : userText

      await fetch("/api/saveMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          role: "user",
          text: userText,
          pdfName: pdfName ?? null,
        }),
      })

      const botReply = await sendToGemini(contextPrompt)
      setMessages((prev) => [...prev, { type: "bot", text: botReply }])

      await fetch("/api/saveMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          role: "assistant",
          text: botReply,
          pdfName: pdfName ?? null,
        }),
      })
    } catch (error) {
      console.error("Error sending message:", error)
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: "Sorry, I encountered an error processing your request. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleAttachPDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || file.type !== "application/pdf") return

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/pdf", {
        method: "POST",
        body: formData,
      })

      const json = await res.json()

      if (json.text) {
        setPdfText(json.text)
        setPdfName(file.name)
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            text: `I've processed "${file.name}". You can now ask questions about this document.`,
          },
        ])
      }
    } catch (error) {
      console.error("Error processing PDF:", error)
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: "Sorry, I encountered an error processing your PDF. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const clearPdfAttachment = () => {
    setPdfName(null)
    setPdfText("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <>
      <main className="flex flex-col h-screen bg-zinc-900 relative">
        <div className="fixed top-0 left-0 right-0 z-10">
          <Header />
        </div>
        {/* Message history */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800 mt-16 mb-24">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-8 rounded-lg bg-zinc-800/50 max-w-md">
                  <h2 className="text-xl font-semibold mb-2 text-zinc-100">Welcome to Chat</h2>
                  <p className="text-zinc-400">Ask me anything or upload a PDF document to get started.</p>
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`p-3 rounded-lg max-w-[80%] ${
                      msg.type === "user"
                        ? "bg-emerald-600 text-white rounded-tr-none"
                        : "bg-zinc-700 text-zinc-100 rounded-tl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* PDF attachment indicator */}
        {pdfName && (
          <div className="bg-zinc-800 px-4 py-2 border-t border-zinc-700 fixed bottom-16 left-0 right-0 z-10">
            <div className="max-w-3xl mx-auto flex items-center">
              <Badge variant="outline" className="flex items-center gap-1 px-3 py-1 bg-zinc-700 text-zinc-200">
                <Paperclip size={14} />
                <span className="truncate max-w-[200px]">{pdfName}</span>
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearPdfAttachment}
                className="ml-2 h-7 text-zinc-400 hover:text-zinc-200"
              >
                Remove
              </Button>
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="border-t border-zinc-700 bg-zinc-800 p-4 fixed bottom-0 left-0 right-0 z-10">
          <div className="max-w-3xl mx-auto flex items-center gap-2">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              className="flex-1 bg-zinc-700 border-zinc-600 text-zinc-100 placeholder:text-zinc-400 focus-visible:ring-emerald-500"
              placeholder="Type your message..."
              disabled={isLoading}
            />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    size="icon"
                    variant="outline"
                    className="bg-zinc-700 border-zinc-600 hover:bg-zinc-600 text-zinc-200"
                    disabled={isLoading}
                  >
                    <Paperclip size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Attach PDF</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              onClick={sendMessage}
              size="icon"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowUp size={18} />}
            </Button>

            <input
              type="file"
              accept="application/pdf"
              onChange={handleAttachPDF}
              ref={fileInputRef}
              className="hidden"
            />
          </div>
        </div>
      </main>
    </>
  )
}
