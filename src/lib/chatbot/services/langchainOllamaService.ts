import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { HumanMessage } from "@langchain/core/messages"; // <-- PERUBAHAN DI SINI
import { OLLAMA_CONFIG } from '../config/api';

export async function askOllamaWithLangChain(message: string): Promise<string> {
  // Sebaiknya URL ini juga diletakkan di dalam file OLLAMA_CONFIG agar konsisten
  const baseUrl = "http://localhost:11434"; 

  const chat = new ChatOllama({
    baseUrl: baseUrl,
    model: OLLAMA_CONFIG.MODEL,
  });

  const response = await chat.invoke([new HumanMessage(message)]);
  
  // Memastikan output selalu string
  return Array.isArray(response.content) 
    ? response.content.join("") 
    : response.content;
}