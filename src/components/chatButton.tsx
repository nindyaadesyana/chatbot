"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
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
import { RatecardTable } from "@/components/RatecardTable"
import tentangTVKU from '../../public/tentangTVKU.json'

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


const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const errorHandler = () => setHasError(true)
    window.addEventListener('error', errorHandler)
    return () => window.removeEventListener('error', errorHandler)
  }, [])

  return hasError ? <div className="text-red-500">Error displaying content</div> : <>{children}</>
}


function isRateCardResponse(message: string): boolean {
  // Hanya return true jika ada kata "rate card"/"ratecard" ATAU format tabel rate card yang sangat spesifik
  const hasRateCardKeyword = /rate.?card/i.test(message);
  // Cek header tabel rate card yang umum
  const hasRateCardTableHeader = /acara\s*[|:-]\s*durasi\s*[|:-]\s*harga/i.test(message) ||
    /\bAcara\b.*\bDurasi\b.*\bHarga\b/i.test(message);
  // Jangan hanya berdasarkan kata "harga" saja
  return hasRateCardKeyword || hasRateCardTableHeader;
}


function parseRateCard(message: string): RateCardItem[] {
  // Hanya parsing jika ada header tabel rate card
  const hasHeader = /acara\s*[|:-]\s*durasi\s*[|:-]\s*harga/i.test(message) ||
    /\bAcara\b.*\bDurasi\b.*\bHarga\b/i.test(message);
  if (!hasHeader) return [];

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

  const items: RateCardItem[] = [];
  const lines = message.split('\n');

  for (const line of lines) {
    const pipeParts = line.split('|').map(part => part.trim()).filter(Boolean);
    if (pipeParts.length >= 3) {
      items.push({
        acara: pipeParts[0],
        durasi: pipeParts[1],
        harga: pipeParts[2]
      });
      continue;
    }

    const bulletMatch = line.match(/[-*]\s*(.+?):\s*(.+?)\s*\((.+?)\)/i);
    if (bulletMatch) {
      items.push({
        acara: bulletMatch[1],
        durasi: bulletMatch[2],
        harga: bulletMatch[3]
      });
    }
  }

  return items;
}


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


const AIMessageContent = ({ message }: { message: string }) => {
  try {
    const instagramRegex = /(instagram|ig).*(tvku|akun tvku)/i;
    const youtubeRegex = /(youtube|yt|channel).*(tvku|akun tvku)/i;
    const socialMediaRegex = /(sosial media|media sosial|sosmed).*(tvku)/i;
    const pendaftaranRegex = /(pendaftaran|daftar|registrasi).*(udinus|dinus|universitas dian nuswantoro)/i;

    if (pendaftaranRegex.test(message)) {
      return (
        <div className="space-y-4">
          <p>{message}</p>
          <div className="mt-4 space-y-2 p-3 bg-blue-50 rounded-md">
            <p className="font-medium">Informasi Pendaftaran UDINUS:</p>
            <div className="flex flex-col space-y-2">
              <a 
                href="https://apply.dinus.ac.id/pendaftaran/M01736" 
                className="text-blue-600 hover:underline flex items-center"
                target="_blank" 
                rel="noopener noreferrer"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                </svg>
                Website PMB UDINUS: apply.dinus.ac.id
              </a>
            </div>
          </div>
        </div>
      );
    }

    if (instagramRegex.test(message) || youtubeRegex.test(message) || socialMediaRegex.test(message)) {
      return (
        <div className="space-y-4">
          <p>{message}</p>
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
                YouTube: TVKU Universitas Dian Nuswantoro
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

    if (isRateCardResponse(message)) {
      // Use data from tentangTVKU.json instead of parsing
      if (tentangTVKU.rateCard && Array.isArray(tentangTVKU.rateCard)) {
        return (
          <div className="space-y-4">
            <RatecardTable 
              items={tentangTVKU.rateCard} 
              contacts={tentangTVKU.kontakKerjaSama}
            />
          </div>
        );
      }
    }

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


export function ChatButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [typingText, setTypingText] = useState("Thinking")
  
  
  const [isListening, setIsListening] = useState(false)
  const [isSpeechSupported, setIsSpeechSupported] = useState(false)
  const [isSafari, setIsSafari] = useState(false)
  const recognitionRef = useRef<any>(null) //eslint-disable-line
  const startSoundRef = useRef<HTMLAudioElement | null>(null)
  const stopSoundRef = useRef<HTMLAudioElement | null>(null)
  const hasResultRef = useRef(false);


  useEffect(() => {
    if (typeof window !== "undefined") {
      startSoundRef.current = new Audio("/sounds/start.mp3")
      stopSoundRef.current = new Audio("/sounds/stop.mp3")
      startSoundRef.current.load()
      stopSoundRef.current.load()

      // SpeechRecognition support detection
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      // Safari detection
      const ua = window.navigator.userAgent
      const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(ua)
      setIsSafari(isSafariBrowser)
      setIsSpeechSupported(!!SpeechRecognition && !isSafariBrowser)
    }
  }, [])


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  
  useEffect(() => {
    if (!isLoading) return
    const interval = setInterval(() => {
      setTypingText((prev) => (prev === "Thinking..." ? "Thinking" : prev + "."))
    }, 500)
    return () => clearInterval(interval)
  }, [isLoading])

  
  const submitMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim()) return

    const userMessage: ChatMessage = { sender: "user", message: messageText }
    setMessages((prev) => [...prev, userMessage])
    setInput("") 
    setIsLoading(true)

    try {
      const res = await fetch("/api/ollama", {
        method: "POST",
        body: JSON.stringify({ prompt: messageText }),
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)

      const data = await res.json()
      const aiResponse = data.response || "Maaf, saya tidak bisa menjawab pertanyaan itu."
      const speechText = data.speech || aiResponse
      
      const aiMessage: ChatMessage = { 
        sender: "ai", 
        message: aiResponse
      }
      setMessages((prev) => [...prev, aiMessage])
      
      // Add TTS with Indonesian female voice (stop any ongoing speech first)
      if ('speechSynthesis' in window) {
        // Stop any ongoing speech to prevent overlap
        speechSynthesis.cancel();
        
        // Create summary for TTS (always read full but summarized)
        let ttsText = speechText;
        
        // Clean and summarize text for TTS
        ttsText = ttsText
          .replace(/\*\*/g, '') // Remove bold markdown
          .replace(/\*/g, '')   // Remove italic markdown
          .replace(/#{1,6}\s/g, '') // Remove headers
          .replace(/\|[^\n]*\|/g, '') // Remove table rows
          .replace(/[-=]{3,}/g, '') // Remove separators
          .replace(/\n{2,}/g, '. ') // Replace multiple newlines with period
          .replace(/\n/g, '. ')     // Replace single newlines with period
          .trim();
        
        // Special handling for introduction text - always read full
        const isIntroduction = ttsText.includes('Halo, Sahabat TVKU') || 
                              ttsText.includes('Aku Dira') ||
                              ttsText.includes('asisten virtual');
        
        // Create structured TTS with opening and titles only
        if (!isIntroduction) {
          // Extract titles/headlines from content
          const extractTitles = (text: string) => {
            // Clean text first
            const cleanText = text
              .replace(/\*\*/g, '')
              .replace(/\*/g, '')
              .replace(/#{1,6}\s/g, '')
              .replace(/\{[^}]*\}/g, '')
              .replace(/\[[^\]]*\]/g, '')
              .trim();
            
            // Extract titles from JSON data or numbered lists
            const titles = [];
            
            // Try to extract from JSON structure
            const jsonMatches = cleanText.match(/"(judul|title|nama|acara)"\s*:\s*"([^"]+)"/gi);
            if (jsonMatches) {
              jsonMatches.forEach(match => {
                const titleMatch = match.match(/"([^"]+)"\s*$/i);
                if (titleMatch) titles.push(titleMatch[1]);
              });
            }
            
            // Extract from numbered lists
            const numberedMatches = cleanText.match(/\d+\.\s*([^\n.]+)/g);
            if (numberedMatches) {
              numberedMatches.forEach(match => {
                const title = match.replace(/\d+\.\s*/, '').trim();
                if (title.length > 5) titles.push(title);
              });
            }
            
            // Extract from bullet points
            const bulletMatches = cleanText.match(/[-•]\s*([^\n.]+)/g);
            if (bulletMatches) {
              bulletMatches.forEach(match => {
                const title = match.replace(/[-•]\s*/, '').trim();
                if (title.length > 5) titles.push(title);
              });
            }
            
            return titles.slice(0, 5); // Max 5 titles
          };
          
          const titles = extractTitles(ttsText);
          
          if (titles.length > 0) {
            // Create structured response with opening
            let opening = '';
            if (ttsText.toLowerCase().includes('berita')) {
              opening = 'Berikut berita terbaru TVKU: ';
            } else if (ttsText.toLowerCase().includes('program')) {
              opening = 'Berikut program acara TVKU: ';
            } else if (ttsText.toLowerCase().includes('jadwal')) {
              opening = 'Berikut jadwal acara TVKU: ';
            } else if (ttsText.toLowerCase().includes('ratecard')) {
              opening = 'Berikut layanan TVKU: ';
            } else {
              opening = 'Berikut informasi TVKU: ';
            }
            
            // Join titles with proper conjunction
            let titlesList = '';
            if (titles.length === 1) {
              titlesList = titles[0];
            } else if (titles.length === 2) {
              titlesList = titles.join(' dan ');
            } else {
              titlesList = titles.slice(0, -1).join(', ') + ', dan ' + titles[titles.length - 1];
            }
            
            ttsText = opening + titlesList + '. Untuk detail lengkap dapat dilihat di atas.';
          } else {
            // Fallback: use first sentence + closing
            const sentences = ttsText.split(/[.!?]/).filter(s => s.trim().length > 10);
            if (sentences.length > 0) {
              ttsText = sentences[0].trim() + '. Untuk detail lengkap dapat dilihat di atas.';
            }
          }
        }
        
        const utterance = new SpeechSynthesisUtterance(ttsText);
          
          const setVoice = () => {
            const voices = speechSynthesis.getVoices();
            
            let selectedVoice = voices.find(v => 
              v.lang.includes('id') && 
              (v.name.toLowerCase().includes('female') || 
               v.name.toLowerCase().includes('woman'))
            );
            
            if (!selectedVoice) {
              selectedVoice = voices.find(v => v.name === 'Google Bahasa Indonesia');
            }
            
            if (!selectedVoice) {
              selectedVoice = voices.find(v => v.lang.includes('id'));
            }
            
            if (selectedVoice) {
              utterance.voice = selectedVoice;
            }
            
            utterance.rate = 1.2;
            utterance.pitch = 1.3;
            utterance.volume = 0.8;
            
            speechSynthesis.speak(utterance);
          };
          
          if (speechSynthesis.getVoices().length > 0) {
            setVoice();
          } else {
            speechSynthesis.onvoiceschanged = setVoice;
          }

      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Unknown error"
      setMessages(prev => [...prev, { 
        sender: "ai", 
        message: `Error: ${errMsg}` 
      }])
    } finally {
      setIsLoading(false)
    }
  }, [])

 
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitMessage(input)
  }

  

  useEffect(() => {
    if (!isSpeechSupported) return
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "id-ID"

    recognition.onstart = () => {
      hasResultRef.current = false
      setIsListening(true)
      startSoundRef.current?.play().catch(e => console.error("Error memainkan suara start:", e))
    }

    recognition.onresult = (event: any) => { //eslint-disable-line
      hasResultRef.current = true
      const transcript = event.results[0][0].transcript
      submitMessage(transcript)
    }

    recognition.onerror = (event: any) => { //eslint-disable-line
      console.error("Speech recognition error:", event.error)
      let errorMessage = "Terjadi kesalahan dalam pengenalan suara"
      switch(event.error) {
        case 'no-speech':
          errorMessage = "Tidak mendeteksi suara. Pastikan mikrofon berfungsi dan coba lagi."
          break
        case 'audio-capture':
          errorMessage = "Tidak bisa mengakses mikrofon. Mohon berikan izin mikrofon."
          break
        case 'not-allowed':
          errorMessage = "Akses mikrofon ditolak. Mohon berikan izin mikrofon."
          break
      }
      setMessages(prev => [...prev, {
        sender: "ai",
        message: errorMessage
      }])
    }

    recognition.onend = () => {
      if (!hasResultRef.current) {
        stopSoundRef.current?.play().catch(e => console.error("Error memainkan suara stop:", e))
      }
      setIsListening(false)
    }

    recognitionRef.current = recognition
    return () => {
      recognition.abort()
    }
  }, [isSpeechSupported, submitMessage])


  const handleVoiceInput = async () => {
    if (!isSpeechSupported) {
      if (isSafari) {
        setMessages(prev => [...prev, {
          sender: "ai",
          message: "Maaf, fitur pengenalan suara tidak tersedia di Safari. Silakan gunakan browser lain seperti Chrome atau Edge."
        }])
      } else {
        alert("Fitur pengenalan suara tidak tersedia di browser ini.")
      }
      return
    }
    if (isListening) {
      recognitionRef.current?.stop()
      return
    }
    if (!recognitionRef.current) {
      alert("Fitur pengenalan suara tidak tersedia di browser ini.")
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      recognitionRef.current.start()
    } catch (err) {
      console.error("Izin mikrofon ditolak:", err)
      setMessages(prev => [...prev, {
        sender: "ai",
        message: "Tidak bisa mengakses mikrofon. Mohon berikan izin pada browser Anda."
      }])
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
                    src="/images/DiraProfilePicture.jpeg"
                    alt="Dira"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <DialogTitle className="text-2xl font-bold">Dira</DialogTitle>
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
                  Start a conversation with Dira
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-message-appear`}
                >
                  <div
                    className={`whitespace-pre-line break-words max-w-full md:max-w-[80%] p-3 rounded-2xl overflow-x-auto ${
                      msg.sender === "user" 
                        ? "bg-blue-500 text-white" 
                        : "bg-gray-100 text-gray-800"
                    }`}
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
              <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ketik pesan..."
                  className="flex-1 rounded-full border-gray-300"
                  aria-label="Chat message input"
                  disabled={isLoading}
                />

                {/* Mic button only if supported and not Safari */}
                {isSpeechSupported && !isSafari && (
                  <div className="relative">
                    <Button
                      type="button"
                      size="icon"
                      onClick={handleVoiceInput}
                      className={`rounded-full h-12 w-12 transition-colors duration-300 ${
                        isListening ? "bg-red-600 animate-pulse" : "bg-gray-300 hover:bg-gray-400"
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
                )}
                {/* Info for unsupported browsers */}
                {/* ...existing code... */}
                {!isSpeechSupported && (
                  <></>
                )}

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
            {/* Info for unsupported browsers - below chat box */}
            {!isSpeechSupported && (
              <div className="w-full flex justify-center items-center">
                <div className="inline-block rounded-md bg-gray-100 px-3 py-2 text-xs text-black-600 shadow-sm mt-1 mb-0 text-center border border-gray-200">
                  <span className="font-medium">Browser Anda tidak mendukung voice note.</span><br />
                  <span className="text-[11px]">Silakan gunakan browser lain.</span>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}