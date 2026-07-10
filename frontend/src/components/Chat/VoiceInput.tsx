import { useCallback, useRef, useEffect } from "react";
import { useAppStore } from "../../store/appStore";
import { cn } from "../../lib/utils";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const voice = useAppStore((s) => s.voice);
  const setVoiceState = useAppStore((s) => s.setVoiceState);
  const recognitionRef = useRef<ReturnType<typeof SpeechRecognitionAPI> | null>(null);

  useEffect(() => {
    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: { results: Array<Array<{ transcript: string }>>; resultIndex: number }) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result) {
            const lastResult = result[result.length - 1];
            if (lastResult) {
              finalTranscript += lastResult.transcript;
            }
          }
        }
        if (finalTranscript) {
          setVoiceState({ transcript: finalTranscript });
          onTranscript(finalTranscript);
          try { recognition.stop(); } catch {}
          setVoiceState({ isListening: false });
        }
      };

      recognition.onerror = () => {
        setVoiceState({ isListening: false, transcript: "" });
      };

      recognition.onend = () => {
        setVoiceState({ isListening: false });
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !voice.isListening) {
      setVoiceState({ isListening: true, transcript: "" });
      try { recognitionRef.current.start(); } catch {}
    }
  }, [voice.isListening, setVoiceState]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      setVoiceState({ isListening: false });
    }
  }, [setVoiceState]);

  if (!voice.isSupported) return null;

  return (
    <button
      onClick={voice.isListening ? stopListening : startListening}
      disabled={disabled}
      className={cn(
        "p-2 rounded-lg transition-all",
        voice.isListening
          ? "bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/30"
          : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      title={voice.isListening ? "Stop listening" : "Voice input"}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    </button>
  );
}
