'use client';

import { useState } from 'react';
import { FiX } from 'react-icons/fi';

interface ChatMessage {
  type: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

interface VoiceChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
}

export default function VoiceChatOverlay({ isOpen, onClose, messages }: VoiceChatOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl h-96 flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Voice Chat with Dira</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            🎤 Voice mode active - Speak to chat with Dira
          </p>
        </div>
      </div>
    </div>
  );
}