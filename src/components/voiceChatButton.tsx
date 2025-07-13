'use client';

import { useState } from 'react';
import { FiMic, FiMicOff } from 'react-icons/fi';
import { SpeechService } from '@/lib/voice/speechService';
import VoiceChatOverlay from './voiceChatOverlay';

interface ChatMessage {
  type: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

interface VoiceChatButtonProps {
  onVoiceInput?: (text: string) => void;
  onResponse?: (response: string) => void;
}

export default function VoiceChatButton({ onVoiceInput, onResponse }: VoiceChatButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addMessage = (type: 'user' | 'bot', text: string) => {
    setMessages(prev => [...prev, { type, text, timestamp: new Date() }]);
  };

  const toggleVoiceMode = async () => {
    console.log('Toggle voice mode clicked, current state:', isListening);
    
    if (isListening) {
      // Stop listening
      console.log('Stopping voice mode');
      SpeechService.stopListening();
      SpeechService.stopSpeaking();
      setIsListening(false);
      setShowOverlay(false);
    } else {
      // Start continuous listening
      console.log('Starting voice mode');
      setShowOverlay(true);
      SpeechService.startContinuousListening(
        async (text) => {
          console.log('=== VOICE INPUT DETECTED ===');
          console.log('Voice input:', text);
          addMessage('user', text);
          onVoiceInput?.(text);
          
          // Show processing state
          setIsProcessing(true);
          addMessage('bot', 'Sedang memproses...');
          
          // Send to chatbot
          try {
            const response = await fetch('/api/ollama', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: text }),
            });
            
            const data = await response.json();
            const botResponse = data.response || 'Maaf, tidak ada response.';
            const speechText = data.speech || botResponse;
            
            console.log('API Response:', { botResponse, speechText });
            
            // Remove processing message and add real response
            setMessages(prev => prev.slice(0, -1));
            addMessage('bot', botResponse);
            onResponse?.(botResponse);
            
            // Speak the cleaned version
            console.log('About to call TTS with:', speechText.substring(0, 50));
            SpeechService.speak(speechText);
            console.log('TTS call completed');
          } catch (error) {
            console.error('Error:', error);
            const errorMessage = 'Maaf, terjadi kesalahan. Silakan coba lagi.';
            
            setMessages(prev => prev.slice(0, -1));
            addMessage('bot', errorMessage);
            
            // Speak error message too
            SpeechService.speak(errorMessage);
          } finally {
            setIsProcessing(false);
          }
        },
        (error) => {
          console.error('Speech recognition error:', error);
          setIsListening(false);
          setShowOverlay(false);
        }
      );
      setIsListening(true);
    }
  };

  const handleCloseOverlay = () => {
    SpeechService.stopListening();
    SpeechService.stopSpeaking();
    setIsListening(false);
    setShowOverlay(false);
  };

  return (
    <>
      <button
        onClick={toggleVoiceMode}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all ${
          isListening 
            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white z-40`}
        title={isListening ? 'Stop Voice Mode' : 'Start Voice Mode'}
      >
        {isListening ? <FiMicOff size={24} /> : <FiMic size={24} />}
      </button>
      
      <VoiceChatOverlay 
        isOpen={showOverlay}
        onClose={handleCloseOverlay}
        messages={messages}
      />
    </>
  );
}