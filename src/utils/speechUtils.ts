// Speech synthesis configuration
interface SpeechOptions {
  enabled: boolean;
  volume?: number;
  rate?: number;
  pitch?: number;
  voice?: string;
  language?: string;
}

let currentUtterance: SpeechSynthesisUtterance | null = null;
let isSpeaking = false;

/**
 * Initialize speech synthesis with default settings
 */
export function initSpeech(): boolean {
  return 'speechSynthesis' in window;
}

/**
 * Speak text using speech synthesis
 */
export function speak(text: string, options: SpeechOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!options.enabled || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    // Cancel any ongoing speech
    cancelSpeech();

    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance = utterance;

    // Configure speech options
    utterance.volume = options.volume ?? 1;
    utterance.rate = options.rate ?? 1;
    utterance.pitch = options.pitch ?? 1;

    // Set language and voice if specified
    if (options.language) {
      utterance.lang = options.language;
    }

    if (options.voice) {
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(v => v.name === options.voice);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    // Set up event handlers
    utterance.onstart = () => {
      isSpeaking = true;
    };

    utterance.onend = () => {
      isSpeaking = false;
      currentUtterance = null;
      resolve();
    };

    utterance.onerror = (event) => {
      isSpeaking = false;
      currentUtterance = null;
      reject(new Error(`Speech synthesis error: ${event.error}`));
    };

    // Start speaking
    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Cancel ongoing speech
 */
export function cancelSpeech(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    currentUtterance = null;
  }
}

/**
 * Check if speech synthesis is currently active
 */
export function isSpeechActive(): boolean {
  return isSpeaking;
}

/**
 * Get available voices for speech synthesis
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices();
}

/**
 * Format navigation instruction for speech
 */
export function formatNavigationInstruction(
  instruction: string,
  distance: number
): string {
  const distanceText = formatDistance(distance);
  return `In ${distanceText}, ${instruction.toLowerCase()}`;
}

/**
 * Format distance for speech
 */
function formatDistance(meters: number): string {
  if (meters < 50) {
    return 'now';
  } else if (meters < 100) {
    return 'in 50 meters';
  } else if (meters < 1000) {
    return `in ${Math.round(meters / 100) * 100} meters`;
  } else {
    return `in ${(meters / 1000).toFixed(1)} kilometers`;
  }
}