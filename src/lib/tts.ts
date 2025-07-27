import { getLemongrassService, type PodcastResult } from './lemongrass';
import { generatePodcastScript, type PodcastScript, scriptToSSML } from './podcastScript';

// Browser TTS fallback for single speaker
export function speak(text: string) {
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1;
  u.pitch = 1;
  u.lang = 'en-US';
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
  return u;
}

// Enhanced conversational TTS using multiple voices
export async function speakConversational(script: PodcastScript): Promise<void> {
  // Cancel any existing speech
  speechSynthesis.cancel();
  
  return new Promise((resolve) => {
    let currentIndex = 0;
    
    function speakNextSegment() {
      if (currentIndex >= script.segments.length) {
        resolve();
        return;
      }
      
      const segment = script.segments[currentIndex];
      console.log(`Speaking segment ${currentIndex + 1}: ${segment.speaker} - ${segment.text.substring(0, 50)}...`);
      
      const utterance = new SpeechSynthesisUtterance(segment.text);
      
      // Configure voice based on speaker
      const voices = speechSynthesis.getVoices();
      if (segment.speaker === 'host1') {
        // Find a male voice for Nikesh (host1)
        const maleVoice = voices.find(voice => 
          voice.name.includes('Male') || 
          voice.name.includes('David') ||
          voice.name.includes('Mark') ||
          voice.name.includes('Daniel')
        );
        if (maleVoice) {
          utterance.voice = maleVoice;
          console.log('Using voice for Nikesh:', maleVoice.name);
        }
        
        // Emotional variation for Nikesh
        const isExcited = /!|amazing|incredible|wow|fascinating|brilliant/.test(segment.text.toLowerCase());
        const isQuestioning = /\?|wondering|think|how|what|why/.test(segment.text);
        
        utterance.pitch = isExcited ? 0.9 : isQuestioning ? 0.7 : 0.8;
        utterance.rate = isExcited ? 0.95 : 0.9;
        utterance.volume = isExcited ? 0.9 : 0.8;
      } else {
        // Find another voice for Saurab (host2)
        const altMaleVoice = voices.find(voice => 
          (voice.name.includes('Male') || 
           voice.name.includes('James') ||
           voice.name.includes('Alex') ||
           voice.name.includes('Ryan')) &&
          !voice.name.includes('David') // Different from host1
        ) || voices.find(voice => voice.name.includes('Female')); // Fallback to female if no alt male
        
        
        if (altMaleVoice) {
          utterance.voice = altMaleVoice;
          console.log('Using voice for Saurab:', altMaleVoice.name);
        }
        
        // Emotional variation for Saurab - more animated
        const isExcited = /!|amazing|incredible|wow|love|awesome|fascinating|brilliant|goosebumps/.test(segment.text.toLowerCase());
        const isQuestioning = /\?|wondering|think|how|what|why/.test(segment.text);
        const isEmphatic = /really|actually|exactly|absolutely|completely/.test(segment.text.toLowerCase());
        
        utterance.pitch = isExcited ? 1.1 : isQuestioning ? 0.9 : 1.0;
        utterance.rate = isExcited ? 1.1 : isEmphatic ? 0.95 : 1.0;
        utterance.volume = isExcited ? 1.0 : 0.8;
      }
      
      utterance.lang = 'en-US';
      
      utterance.onend = () => {
        console.log(`Finished speaking segment ${currentIndex + 1}`);
        
        // Vary pause based on emotional content
        const pauseLength = segment.text.includes('!') || segment.text.includes('?') ? 1000 : 800;
        
        // Add a pause between speakers
        setTimeout(() => {
          currentIndex++;
          speakNextSegment();
        }, pauseLength);
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        currentIndex++;
        speakNextSegment();
      };

      console.log('Starting speech synthesis for segment', currentIndex + 1);
      speechSynthesis.speak(utterance);
    }
    
    // Start speaking
    speakNextSegment();
  });
}// Enhanced podcast generation with conversational format
export async function generatePodcast(
  title: string, 
  content: string, 
  conversational: boolean = true
): Promise<PodcastResult | null> {
  const service = getLemongrassService();
  
  if (!service) {
    console.warn('Lemongrass service not initialized, using browser TTS');
    if (conversational) {
      const script = await generatePodcastScript(title, content);
      console.log('Generated conversational script:', script);
      await speakConversational(script);
    } else {
      speak(content);
    }
    return null;
  }

  try {
    console.log(`Generating ${conversational ? 'conversational' : 'single-speaker'} podcast with Lemongrass API...`);
    
    // Generate script for conversational format
    const script = conversational ? await generatePodcastScript(title, content) : undefined;
    
    const result = await service.generatePodcast({
      title,
      content,
      script,
      voice: 'default',
      format: 'mp3',
      speed: 1.0,
      conversational
    });

    if (result.status === 'error') {
      console.log('Lemongrass API returned error, falling back to browser TTS');
      if (conversational && script) {
        await speakConversational(script);
      } else {
        speak(content);
      }
      return null;
    }

    // For now, since we're using mock API, always fall back to browser TTS
    // but return the mock result to show the integration works
    console.log('Using browser TTS as fallback while API is in development');
    
    if (conversational && script) {
      console.log('Playing conversational podcast with multiple voices...');
      await speakConversational(script);
    } else {
      speak(content);
    }
    
    return {
      ...result,
      script,
      message: conversational 
        ? 'Generated conversational podcast using browser TTS (Lemongrass API integration ready)'
        : 'Generated using browser TTS (Lemongrass API integration ready)'
    };

  } catch (error) {
    console.error('Podcast generation failed:', error);
    // Fallback to browser TTS
    if (conversational) {
      const script = await generatePodcastScript(title, content);
      await speakConversational(script);
    } else {
      speak(content);
    }
    return null;
  }
}

// Play audio from URL (when real API is available)
export function playAudio(audioUrl: string): HTMLAudioElement {
  const audio = new Audio(audioUrl);
  audio.play().catch(error => {
    console.error('Audio playback failed:', error);
  });
  return audio;
}

// Utility function to check available voices
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  return speechSynthesis.getVoices();
}

// Initialize voices (some browsers load voices asynchronously)
export function initializeVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
    } else {
      speechSynthesis.onvoiceschanged = () => {
        resolve(speechSynthesis.getVoices());
      };
    }
  });
}
