import { useCallback } from 'react';

/**
 * useTTS - React hook for text-to-speech in the selected language.
 * @param language Language code (e.g., 'en', 'hi')
 * @returns speak(text: string) => void
 */
export function useTTS(language: string) {
  // Map app language to browser TTS language
  const langMap: Record<string, string> = {
    hi: 'hi-IN',
    en: 'en-US',
  };
  const browserLang = langMap[language] || 'en-US';

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.lang = browserLang;
    // Try to select a matching voice
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find(v => v.lang === browserLang);
    if (match) utter.voice = match;
    window.speechSynthesis.speak(utter);
  }, [browserLang]);

  return { speak };
}