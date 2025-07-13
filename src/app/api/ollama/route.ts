import { NextRequest, NextResponse } from 'next/server'
import { ChatbotService } from '@/lib/chatbot'

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()
    const response = await ChatbotService.processMessage(prompt)
    return NextResponse.json({ response })
  } catch (error) {
    console.error("Error in /api/ollama:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Terjadi kesalahan' },
      { status: 500 }
    )
  }
}