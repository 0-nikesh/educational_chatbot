// Enhanced TTS system with audio controls and time tracking
import { generatePodcastScript, type PodcastScript, type PodcastSegment } from './podcastScript';

export interface TTSState {
  isPlaying: boolean;
  isPaused: boolean;
  currentSegment: number;
  totalSegments: number;
  currentTime: number;
  totalTime: number;
  progress: number; // 0-100
}

export interface TTSControls {
  play: () => void;
  pause: () => void;
  stop: () => void;
  skip: () => void;
  getState: () => TTSState;
}

class EnhancedTTSManager {
  private state: TTSState = {
    isPlaying: false,
    isPaused: false,
    currentSegment: 0,
    totalSegments: 0,
    currentTime: 0,
    totalTime: 0,
    progress: 0
  };

  private script: PodcastScript | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private startTime: number = 0;
  private pausedTime: number = 0;
  private segmentStartTime: number = 0;
  private listeners: ((state: TTSState) => void)[] = [];
  private updateInterval: number | null = null;

  constructor() {
    this.initializeVoices();
  }

  private async initializeVoices(): Promise<void> {
    return new Promise((resolve) => {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve();
      } else {
        speechSynthesis.onvoiceschanged = () => resolve();
      }
    });
  }

  private getVoiceForSpeaker(speaker: 'host1' | 'host2'): SpeechSynthesisVoice | null {
    const voices = speechSynthesis.getVoices();
    
    if (speaker === 'host1') {
      // Nikesh - Find a clear, engaging male voice
      return voices.find(voice => 
        (voice.name.includes('David') ||
        voice.name.includes('Male') ||
        voice.name.includes('Mark')) &&
        voice.lang.includes('en')
      ) || voices.find(voice => voice.lang.includes('en-US'))[0];
    } else {
      // Saurab - Find a different, enthusiastic voice
      return voices.find(voice => 
        (voice.name.includes('James') ||
        voice.name.includes('Alex') ||
        voice.name.includes('Female')) &&
        voice.lang.includes('en') &&
        !voice.name.includes('David')
      ) || voices.find(voice => voice.lang.includes('en-US'))[1] || voices[0];
    }
  }

  private addEmotionalVariation(utterance: SpeechSynthesisUtterance, text: string, speaker: 'host1' | 'host2'): void {
    // Detect emotional cues in text and adjust speech accordingly
    const isExcited = /!|amazing|incredible|wow|love|awesome|fascinating|brilliant/.test(text.toLowerCase());
    const isQuestioning = /\?|wondering|think|how|what|why/.test(text);
    const isEmphatic = /really|actually|exactly|absolutely|completely/.test(text.toLowerCase());
    
    if (speaker === 'host1') {
      // Nikesh - Analytical but passionate
      utterance.pitch = isExcited ? 0.9 : isQuestioning ? 0.7 : 0.8;
      utterance.rate = isEmphatic ? 0.85 : 0.9;
      utterance.volume = isExcited ? 0.9 : 0.8;
    } else {
      // Saurab - More animated and expressive
      utterance.pitch = isExcited ? 1.1 : isQuestioning ? 0.9 : 1.0;
      utterance.rate = isExcited ? 1.1 : isEmphatic ? 0.95 : 1.0;
      utterance.volume = isExcited ? 1.0 : 0.8;
    }
  }

  private estimateSegmentDuration(text: string): number {
    // Estimate ~3 characters per second for speech
    return Math.ceil(text.length / 3) * 1000; // in milliseconds
  }

  private updateState(): void {
    if (this.state.isPlaying && !this.state.isPaused) {
      const now = Date.now();
      const elapsed = now - this.segmentStartTime;
      
      if (this.script && this.state.currentSegment < this.script.segments.length) {
        const currentSegment = this.script.segments[this.state.currentSegment];
        const segmentDuration = this.estimateSegmentDuration(currentSegment.text);
        
        this.state.currentTime = this.pausedTime + elapsed;
        this.state.progress = (this.state.currentTime / this.state.totalTime) * 100;
        
        // Notify listeners
        this.listeners.forEach(listener => listener({ ...this.state }));
      }
    }
  }

  public async playScript(script: PodcastScript): Promise<TTSControls> {
    this.script = script;
    this.state.totalSegments = script.segments.length;
    this.state.totalTime = script.segments.reduce((total, segment) => 
      total + this.estimateSegmentDuration(segment.text), 0
    );
    this.state.currentSegment = 0;
    this.state.currentTime = 0;
    this.state.progress = 0;
    this.pausedTime = 0;

    await this.initializeVoices();
    this.play();

    return {
      play: () => this.play(),
      pause: () => this.pause(),
      stop: () => this.stop(),
      skip: () => this.skip(),
      getState: () => ({ ...this.state })
    };
  }

  private play(): void {
    if (!this.script || this.state.currentSegment >= this.script.segments.length) {
      return;
    }

    if (this.state.isPaused) {
      // Resume
      this.state.isPaused = false;
      this.state.isPlaying = true;
      this.segmentStartTime = Date.now();
      speechSynthesis.resume();
    } else {
      // Start or continue playing
      this.state.isPlaying = true;
      this.state.isPaused = false;
      this.startTime = Date.now();
      this.segmentStartTime = Date.now();
      this.playCurrentSegment();
    }

    this.startUpdateInterval();
  }

  private pause(): void {
    if (this.state.isPlaying) {
      this.state.isPaused = true;
      this.pausedTime += Date.now() - this.segmentStartTime;
      speechSynthesis.pause();
      this.stopUpdateInterval();
    }
  }

  private stop(): void {
    this.state.isPlaying = false;
    this.state.isPaused = false;
    this.state.currentSegment = 0;
    this.state.currentTime = 0;
    this.state.progress = 0;
    this.pausedTime = 0;
    
    speechSynthesis.cancel();
    this.stopUpdateInterval();
  }

  private skip(): void {
    if (this.script && this.state.currentSegment < this.script.segments.length - 1) {
      speechSynthesis.cancel();
      this.state.currentSegment++;
      this.pausedTime += this.estimateSegmentDuration(this.script.segments[this.state.currentSegment - 1].text);
      this.segmentStartTime = Date.now();
      
      if (this.state.isPlaying) {
        this.playCurrentSegment();
      }
    }
  }

  private playCurrentSegment(): void {
    if (!this.script || this.state.currentSegment >= this.script.segments.length) {
      this.stop();
      return;
    }

    const segment = this.script.segments[this.state.currentSegment];
    const utterance = new SpeechSynthesisUtterance(segment.text);
    
    // Configure voice for speaker
    const voice = this.getVoiceForSpeaker(segment.speaker);
    if (voice) utterance.voice = voice;
    
    // Add emotional variation based on content
    this.addEmotionalVariation(utterance, segment.text, segment.speaker);
    
    utterance.lang = 'en-US';
    
    utterance.onend = () => {
      if (this.state.isPlaying) {
        // Vary pause length based on content - longer for dramatic effect
        const pauseLength = segment.text.includes('!') || segment.text.includes('?') ? 800 : 500;
        
        setTimeout(() => {
          this.state.currentSegment++;
          this.pausedTime += this.estimateSegmentDuration(segment.text);
          this.segmentStartTime = Date.now();
          this.playCurrentSegment();
        }, pauseLength);
      }
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.state.currentSegment++;
      this.playCurrentSegment();
    };

    this.currentUtterance = utterance;
    speechSynthesis.speak(utterance);
  }

  private startUpdateInterval(): void {
    if (this.updateInterval) return;
    
    this.updateInterval = window.setInterval(() => {
      this.updateState();
    }, 100); // Update every 100ms
  }

  private stopUpdateInterval(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  public addStateListener(listener: (state: TTSState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}

// Global instance
const ttsManager = new EnhancedTTSManager();

// Export functions for backward compatibility
export function speak(text: string): void {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.lang = 'en-US';
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

export async function speakConversational(script: PodcastScript): Promise<TTSControls> {
  return ttsManager.playScript(script);
}

export function formatTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export { ttsManager };
