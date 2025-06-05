"use client"

import React, { useState, useRef, useEffect } from "react"
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
import ReactMarkdown from "react-markdown"

interface ChatMessage {
  sender: "user" | "ai"
  message: string
  isAnimating?: boolean
}

interface RateCardItem {
  acara: string
  durasi: string
  harga: string
}

// Error Boundary Component
const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const errorHandler = () => setHasError(true)
    window.addEventListener('error', errorHandler)
    return () => window.removeEventListener('error', errorHandler)
  }, [])

  return hasError ? <div className="text-red-500">Error displaying content</div> : <>{children}</>
}

// Rate Card Detection
function isRateCardResponse(message: string): boolean {
  return (
    /rate.?card|harga|price|acara|durasi/i.test(message) || 
    /acara.*harga|harga.*acara/i.test(message) ||
    /acara\s*[|:-]\s*durasi\s*[|:-]\s*harga/i.test(message)
  )
}

// Rate Card Parser
function parseRateCard(message: string): RateCardItem[] {
  // Try to parse as JSON first
  try {
    const data = JSON.parse(message)
    if (Array.isArray(data.rateCard)) {
      return data.rateCard.map((item: any) => ({
        acara: item.acara || 'N/A',
        durasi: item.durasi || 'N/A',
        harga: item.harga || 'N/A'
      }))
    }
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        acara: item.acara || 'N/A',
        durasi: item.durasi || 'N/A',
        harga: item.harga || 'N/A'
      }))
    }
  } catch {}

  // Fallback to text parsing
  const items: RateCardItem[] = []
  const lines = message.split('\n')

  for (const line of lines) {
    // Match table format: Acara | Durasi | Harga
    const pipeParts = line.split('|').map(part => part.trim()).filter(Boolean)
    if (pipeParts.length >= 3) {
      items.push({
        acara: pipeParts[0],
        durasi: pipeParts[1],
        harga: pipeParts[2]
      })
      continue
    }

    // Match bullet format: - Acara: Durasi (Harga)
    const bulletMatch = line.match(/[-*]\s*(.+?):\s*(.+?)\s*\((.+?)\)/i)
    if (bulletMatch) {
      items.push({
        acara: bulletMatch[1],
        durasi: bulletMatch[2],
        harga: bulletMatch[3]
      })
    }
  }

  return items
}

// Rate Card Table Component
function RateCardTable({ items }: { items: RateCardItem[] }) {
  if (items.length === 0) return null

  return (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Acara</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Durasi</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Harga</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {items.map((item, index) => (
            <tr key={index}>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.acara}</td>
              <td className="px-4 py-2 whitespace-normal text-sm text-gray-500">{item.durasi}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.harga}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// AI Message Content Component
const AIMessageContent = ({ message }: { message: string }) => {
  try {
    if (isRateCardResponse(message)) {
      const items = parseRateCard(message)
      if (items.length > 0) {
        return (
          <div className="space-y-2">
            <h3 className="font-bold text-gray-800">Rate Card TVKU</h3>
            <RateCardTable items={items} />
          </div>
        )
      }
    }

    return (
  <ReactMarkdown
    components={{
      a: ({ node, ...props }) => {
        let displayText = '';

        if (typeof props.children === 'string') {
          displayText = props.children;
        } else if (Array.isArray(props.children)) {
          displayText = props.children.map((child) =>
            typeof child === 'string' ? child : ''
          ).join('');
        }

        const parsedText = displayText.split(': ')[1] ?? displayText;

        return (
          <a 
            {...props} 
            href={props.href} 
            className="text-blue-600 hover:underline"
          >
            {parsedText === 'tvku_ig' ? '@tvku_smg' : 
            parsedText === 'tvku_yt' ? '@TVKU_udinus' : 
            '@tvku_smg'}
          </a>
        )
      }
    }}
  >
    {message}
  </ReactMarkdown>

    )
  } catch (error) {
    console.error("Error rendering AI message:", error)
    return <div className="text-red-500">Error displaying message</div>
  }
}

// Main ChatButton Component
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

  // Initialize audio and voice recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      startSoundRef.current = new Audio("/sounds/start.mp3")
      stopSoundRef.current = new Audio("/sounds/stop.mp3")
    }
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Typing animation
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

  // Text animation
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: ChatMessage = { sender: "user", message: input }
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
      console.log("API Response:", data.response) // Debug log

      const aiMessage: ChatMessage = { 
        sender: "ai", 
        message: data.response || "Maaf, saya tidak bisa menjawab pertanyaan itu." 
      }

      setMessages((prev) => {
        const newMessages = [...prev, aiMessage]
        setTimeout(() => animateText(newMessages.length - 1), 100)
        return newMessages
      })
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Unknown error"
      console.error("API Error:", errMsg) // Debug log
      setMessages((prev) => [...prev, { 
        sender: "ai", 
        message: `Error: ${errMsg}` 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // Voice input handling
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
        handleSubmit(fakeEvent)
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
                      msg.sender === "user" 
                        ? "bg-blue-500 text-white" 
                        : "bg-gray-100 text-gray-800"
                    } ${msg.isAnimating ? "animate-pulse" : ""}`}
                  >
                    <ErrorBoundary>
                      {msg.sender === "ai" ? (
                        <AIMessageContent message={msg.message} />
                      ) : (
                        msg.message
                      )}
                    </ErrorBoundary>
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