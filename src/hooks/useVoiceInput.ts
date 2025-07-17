
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

// Define the interface for the SpeechRecognition API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

// Extend the Window interface
declare global {
  interface Window {
    SpeechRecognition: { new(): SpeechRecognition };
    webkitSpeechRecognition: { new(): SpeechRecognition };
  }
}

export function useVoiceInput({ onTranscript, language }: { onTranscript: (transcript: string) => void, language: string }) {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
    if (!SpeechRecognition) {
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      let errorMessage = "An unknown error occurred during speech recognition.";
      if (event.error === 'no-speech') {
        errorMessage = "No speech was detected. Please try again.";
      } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        errorMessage = "Microphone access denied. Please enable it in your browser settings.";
      } else if (event.error === 'network') {
        errorMessage = "A network error occurred. Please check your connection.";
      }
      toast({
          variant: "destructive",
          title: "Voice Error",
          description: errorMessage
      });
      setIsListening(false);
    };
    
    recognition.onend = () => {
        setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript, toast, language]);
  
  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error("Could not start speech recognition", error);
        toast({
            variant: "destructive",
            title: "Voice Error",
            description: "Could not start voice recognition. Please check your microphone permissions."
        });
      }
    }
  }, [isListening, toast]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const isSupported = !!(typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition));

  return { isListening, startListening, stopListening, isSupported };
}
