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
    // First check for social media mentions anywhere in the text
    const instagramRegex = /(instagram|ig).*(tvku|akun tvku)/i;
    const youtubeRegex = /(youtube|yt|channel).*(tvku|akun tvku)/i;
    const socialMediaRegex = /(sosial media|media sosial|sosmed).*(tvku)/i;
    
    // Create social media response component if any patterns match
    if (instagramRegex.test(message) || youtubeRegex.test(message) || socialMediaRegex.test(message)) {
      return (
        <div className="space-y-4">
          {/* Display original message first */}
          <p>{message}</p>
          
          {/* Then add social media links */}
          <div className="mt-4 space-y-2 p-3 bg-blue-50 rounded-md">
            <p className="font-medium">Akun media sosial TVKU:</p>
            <div className="flex flex-col space-y-2">
              <a 
                href="https://instagram.com/tvku_smg" 
                className="text-blue-600 hover:underline flex items-center"
                target="_blank" 
                rel="noopener noreferrer"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                Instagram: @tvku_smg
              </a>
              
              <a 
                href="https://youtube.com/@TVKU_udinus" 
                className="text-blue-600 hover:underline flex items-center"
                target="_blank" 
                rel="noopener noreferrer"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                YouTube: TVKU Universitas Dan Nuswantoro
              </a>
              
              <a 
                href="https://tiktok.com/@tvku_smg" 
                className="text-blue-600 hover:underline flex items-center"
                target="_blank" 
                rel="noopener noreferrer"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"/></svg>
                TikTok: @tvku_smg
              </a>
            </div>
          </div>
        </div>
      );
    }

    // Rate card handling can remain as is
    if (isRateCardResponse(message)) {
      const items = parseRateCard(message);
      if (items.length > 0) {
        return (
          <div className="space-y-2">
            <h3 className="font-bold text-gray-800">Rate Card TVKU</h3>
            <RateCardTable items={items} />
          </div>
        );
      }
    }

    // Continue with standard markdown rendering for other responses
    return (
      <ReactMarkdown
        components={{
          a: ({ ...props }) => {
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
    );
  } catch (error) {
    console.error("Error rendering AI message:", error);
    return <div className="text-red-500">Error displaying message</div>;
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
  const recognitionRef = useRef<null>(null)
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