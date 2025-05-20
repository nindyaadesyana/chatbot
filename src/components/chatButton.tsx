"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Mic } from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  sender: string
  message: string
  isAnimating?: boolean
  audio?: string;
}

export function ChatButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [typingText, setTypingText] = useState("Thinking")
  const recognitionRef = useRef<any>(null)
  const startSoundRef = useRef<HTMLAudioElement | null>(null)
  const stopSoundRef = useRef<HTMLAudioElement | null>(null)
  const [isListening, setIsListening] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      startSoundRef.current = new Audio("/sounds/start.mp3")
      stopSoundRef.current = new Audio("/sounds/stop.mp3")
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (!isLoading) return

    const interval = setInterval(() => {
      setTypingText((prev) => {
        if (prev === "Thinking...") return "Thinking"
        return prev + "."
      })
    }, 500)

    return () => clearInterval(interval)
  }, [isLoading])

  const animateText = (index: number) => {
    if (messages[index]?.sender !== "ai") return

    const message = messages[index].message
    let currentChar = 0
    const animationSpeed = 30

    setMessages((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], isAnimating: true }
      return updated
    })

    const interval = setInterval(() => {
      currentChar++
      if (currentChar >= message.length) {
        clearInterval(interval)
        setMessages((prev) => {
          const updated = [...prev]
          updated[index] = { ...updated[index], isAnimating: false }
          return updated
        })
      }
    }, animationSpeed)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = { sender: "user", message: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/ollama", {
        method: "POST",
        body: JSON.stringify({ prompt: input }),
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)

      const data = await res.json()
      const aiMessage = { sender: "ai", message: data.response || "No response" }

      setMessages((prev) => {
        const newMessages = [...prev, aiMessage]
        setTimeout(() => animateText(newMessages.length - 1), 100)
        return newMessages
      })
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Unknown error"
      setMessages((prev) => [...prev, { sender: "ai", message: `Error: ${errMsg}` }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitVoice = async (voiceText: string, e: React.FormEvent) => {
    e.preventDefault()
    if (!voiceText.trim()) return

    const userMessage = { sender: "user", message: voiceText }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/ollama", {
        method: "POST",
        body: JSON.stringify({ prompt: voiceText }),
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)

      const data = await res.json()
      const aiMessage = { sender: "ai", message: data.response || "No response" }

      setMessages((prev) => {
        const newMessages = [...prev, aiMessage]
        setTimeout(() => animateText(newMessages.length - 1), 100)
        return newMessages
      })
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Unknown error"
      setMessages((prev) => [...prev, { sender: "ai", message: `Error: ${errMsg}` }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert("Browser tidak mendukung Voice Recognition.")
      return
    }

    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = "id-ID"

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent
        handleSubmitVoice(transcript, fakeEvent)
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error("Voice recognition error:", event.error)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
        stopSoundRef.current?.play()
      }
    }

    if (isListening) {
      recognitionRef.current.stop()
    } else {
      recognitionRef.current.start()
      startSoundRef.current?.play()
      setIsListening(true)
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 bg-[#0C71C3] shadow-lg z-50 flex items-center justify-center hover:scale-110 transition-transform duration-300"
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] md:max-w-[800px] p-0 rounded-xl overflow-hidden max-h-[80vh] md:max-h-[600px]">
          <div className="w-full flex flex-col h-[80vh] md:h-[600px]">
            <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <Image
                    src="/images/bahlil.jpeg"
                    alt="LIL BAH AI"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <DialogTitle className="text-2xl font-bold">LIL BAH AI</DialogTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close chat"
              >
                <X size={24} />
              </Button>
            </DialogHeader>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.length === 0 && !isLoading && (
                <div className="flex justify-center items-center h-full text-gray-500">
                  Start a conversation with LIL BAH AI
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-message-appear`}
                >
                  <div
                    className={`whitespace-pre-line max-w-[80%] p-3 rounded-2xl ${
                      msg.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"
                    } ${msg.isAnimating ? "animate-pulse" : ""}`}
                  >
                    {msg.sender==="ai"?(
                      <ReactMarkdown
                        components={{
                          a: ({ node, ...props }) => (
                            <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" />
                          )
                        }}
                      >
                        {msg.message}
                      </ReactMarkdown>
                    ):(
                    msg.message
                  )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start animate-message-appear">
                  <div className="p-3 rounded-2xl bg-gray-100">
                    <span className="inline-block animate-typing">{typingText}</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t mt-auto">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ketik pesan..."
                  className="flex-1 rounded-full border-gray-300"
                  aria-label="Chat message input"
                  disabled={isLoading}
                />

                <div className="relative">
                  <Button
                    type="button"
                    size="icon"
                    onClick={handleVoiceInput}
                    className={`rounded-full h-12 w-12 transition-colors duration-300 ${
                      isListening ? "bg-red-600" : "bg-gray-300 hover:bg-gray-400"
                    }`}
                    aria-label="Voice input"
                  >
                    <Mic className="h-5 w-5 text-white" />
                  </Button>

                  {isListening && (
                    <>
                      <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping pointer-events-none" />
                      <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping pointer-events-none delay-200" />
                      <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping pointer-events-none delay-400" />
                    </>
                  )}
                </div>

                <Button
                  type="submit"
                  size="icon"
                  className="rounded-full bg-[#0C71C3] h-12 w-12 hover:bg-blue-700 transition-colors duration-300"
                  aria-label="Send message"
                  disabled={isLoading || !input.trim()}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
    
  )
}

