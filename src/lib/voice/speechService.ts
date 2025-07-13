export class SpeechService {
  private static synthesis: SpeechSynthesis | null = null;
  private static recognition: SpeechRecognition | null = null;
  private static isListening = false;

  static speak(text: string) {
    if (typeof window === 'undefined') {
      console.log('TTS: Window undefined');
      return;
    }

    console.log('TTS: Starting to speak:', text.substring(0, 50) + '...');
    
    this.synthesis = window.speechSynthesis;
    
    // Cancel any ongoing speech
    this.synthesis.cancel();
    
    // Wait for voices to load
    const speak = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set Indonesian voice
      const voices = this.synthesis?.getVoices() || [];
      const indonesianVoice = voices.find(voice => voice.lang === 'id-ID');
      if (indonesianVoice) {
        utterance.voice = indonesianVoice;
        console.log('TTS: Using Indonesian voice:', indonesianVoice.name);
      }
      
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.lang = 'id-ID';
      
      utterance.onstart = () => console.log('TTS: Speech started');
      utterance.onend = () => console.log('TTS: Speech ended');
      utterance.onerror = (e) => console.error('TTS Error:', e);
      
      this.synthesis?.speak(utterance);
      console.log('TTS: Speak command sent');
    };

    // Ensure voices are loaded
    if (this.synthesis && this.synthesis.getVoices().length === 0) {
      this.synthesis.onvoiceschanged = () => {
        speak();
        if (this.synthesis) this.synthesis.onvoiceschanged = null;
      };
    } else {
      speak();
    }
  }

  static startContinuousListening(
    onResult: (text: string) => void,
    onError?: (error: string) => void
  ) {
    if (typeof window === 'undefined' || this.isListening) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      onError?.('Speech recognition not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'id-ID';
    this.recognition.continuous = true;
    this.recognition.interimResults = false;

    this.recognition.onresult = (event) => {
      const text = event.results[event.results.length - 1][0].transcript;
      onResult(text);
    };

    this.recognition.onerror = (event) => {
      onError?.(event.error);
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        this.recognition?.start(); // Restart if still in listening mode
      }
    };

    this.isListening = true;
    this.recognition.start();
  }

  static stopListening() {
    this.isListening = false;
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  static stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  static getListeningStatus() {
    return this.isListening;
  }
}