// Podcast script generation for conversational format with Gemini AI integration
import { GeminiService } from './gemini';
import { useProjectStore } from '../state/useProjectStore';

export interface PodcastSegment {
  speaker: 'host1' | 'host2';
  text: string;
  duration?: number;
}

export interface PodcastScript {
  title: string;
  segments: PodcastSegment[];
  totalDuration?: number;
}

export interface SpeakerProfile {
  name: string;
  voice: string;
  personality: string;
  role: string;
}

export const DEFAULT_SPEAKERS: Record<'host1' | 'host2', SpeakerProfile> = {
  host1: {
    name: "Nikesh",
    voice: "male-thoughtful",
    personality: "analytical, asks probing questions, detail-oriented",
    role: "lead host"
  },
  host2: {
    name: "Saurab",
    voice: "male-engaging", 
    personality: "enthusiastic, makes connections, practical insights",
    role: "co-host"
  }
};

/**
 * Generate a conversational podcast script from content using AI or fallback
 */
export async function generatePodcastScript(
  title: string, 
  content: string, 
  speakers = DEFAULT_SPEAKERS
): Promise<PodcastScript> {
  const store = useProjectStore.getState();
  
  // Try AI-enhanced podcast generation first
  if (store.ui.useGemini && store.ui.geminiApiKey) {
    try {
      console.log('🤖 Generating AI-powered podcast script...');
      return await generateAIPodcastScript(title, content, speakers);
    } catch (error) {
      console.warn('AI podcast generation failed, falling back to template-based:', error);
      // Fall back to template-based generation
    }
  }
  
  console.log('📝 Generating template-based podcast script...');
  return generateTemplatePodcastScript(title, content, speakers);
}

/**
 * Generate AI-enhanced podcast script using Gemini
 */
async function generateAIPodcastScript(
  title: string,
  content: string,
  speakers = DEFAULT_SPEAKERS
): Promise<PodcastScript> {
  const store = useProjectStore.getState();
  const gemini = new GeminiService({ apiKey: store.ui.geminiApiKey });
  
  const prompt = `
Create an engaging, conversational podcast script between two hosts discussing "${title}".

CONTENT TO DISCUSS:
${content}

HOST PROFILES:
- ${speakers.host1.name}: ${speakers.host1.personality}, ${speakers.host1.role}
- ${speakers.host2.name}: ${speakers.host2.personality}, ${speakers.host2.role}

REQUIREMENTS:
1. Create a natural, engaging conversation (not a formal interview)
2. Use casual, enthusiastic language with emotional reactions
3. Break down complex concepts into relatable examples  
4. Include natural transitions, questions, and back-and-forth dialogue
5. Make it educational but entertaining
6. Length: 8-12 exchanges between hosts
7. Each speaker should have roughly equal speaking time

FORMAT: Return as JSON with this structure:
{
  "segments": [
    {"speaker": "host1", "text": "Hey everyone! So I just finished reading..."},
    {"speaker": "host2", "text": "Oh really? What caught your attention first?"}
  ]
}

Make it sound like two passionate educators having an exciting discussion about fascinating ideas!
`;

  const response = await gemini.generateContent(prompt);
  
  // Parse the AI response
  try {
    // Extract JSON from the response (sometimes AI wraps it in markdown)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const aiData = JSON.parse(jsonMatch[0]);
      
      return {
        title: `AI-Generated Podcast: ${title}`,
        segments: aiData.segments.map((seg: any) => ({
          speaker: seg.speaker,
          text: seg.text
        })),
        totalDuration: estimateTotalDuration(aiData.segments)
      };
    }
  } catch (parseError) {
    console.warn('Failed to parse AI response, using fallback:', parseError);
  }
  
  // If parsing fails, fall back to template
  return generateTemplatePodcastScript(title, content, speakers);
}

/**
 * Generate template-based podcast script (fallback)
 */
function generateTemplatePodcastScript(
  title: string, 
  content: string, 
  speakers = DEFAULT_SPEAKERS
): PodcastScript {
  const segments: PodcastSegment[] = [];
  
  // Natural, engaging opening
  const openings = [
    `Hey everyone! So I just finished reading through "${title}" and honestly, there's some fascinating stuff here that I think you'll find really interesting.`,
    `You know what? I've been diving deep into "${title}" and there are some insights here that completely changed how I think about this topic.`,
    `Alright, so we're talking about "${title}" today, and let me tell you - this isn't your typical dry academic stuff. There's some real gold here.`
  ];
  
  segments.push({
    speaker: 'host1',
    text: openings[Math.floor(Math.random() * openings.length)]
  });

  const responses = [
    `Oh really? I'm intrigued! What caught your attention first?`,
    `That sounds promising! I love it when something actually makes you think differently. What's the main thing that stood out?`,
    `Now you've got me curious! Break it down for me - what makes this so compelling?`
  ];
  
  segments.push({
    speaker: 'host2',
    text: responses[Math.floor(Math.random() * responses.length)]
  });

  // Break content into discussion points
  const points = extractKeyPoints(content);
  
  points.forEach((point, index) => {
    const leadSpeaker = index % 2 === 0 ? 'host1' : 'host2';
    const respondSpeaker = leadSpeaker === 'host1' ? 'host2' : 'host1';
    
    // Create natural conversation around the content
    if (index === 0) {
      // First point gets special treatment
      segments.push({
        speaker: leadSpeaker,
        text: `So here's what really got me thinking: ${point}`
      });
      
      const reactions = [
        `Wow, that's actually really profound when you think about it. It reminds me of...`,
        `Hold on, that's interesting. So you're saying...`,
        `That's a great point! And what I find fascinating is how this connects to...`,
        `Hmm, I never thought about it that way. This actually explains why...`
      ];
      
      segments.push({
        speaker: respondSpeaker,
        text: reactions[Math.floor(Math.random() * reactions.length)]
      });
    } else {
      // Natural transitions and emotional responses
      const transitions = [
        `And here's another thing that blew my mind:`,
        `But wait, it gets even more interesting:`,
        `Now, this next part is where it really clicks:`,
        `Here's where things get really fascinating:`,
        `And then there's this insight that just makes so much sense:`
      ];
      
      segments.push({
        speaker: leadSpeaker,
        text: `${transitions[index % transitions.length]} ${point}`
      });
      
      // Emotional, engaging responses
      const engagedResponses = [
        `Oh my god, yes! That completely changes the whole perspective, doesn't it?`,
        `That's exactly what I was thinking! It's like suddenly everything just connects.`,
        `This is why I love this stuff! It's not just theory - you can actually see how it applies to real life.`,
        `Right?! And what's crazy is how this contradicts what most people assume.`,
        `I'm getting goosebumps just thinking about the implications of this!`,
        `This is the kind of insight that keeps me up at night thinking about it.`,
        `You know what? This actually happened to me last week - I saw exactly this pattern!`
      ];
      
      segments.push({
        speaker: respondSpeaker,
        text: engagedResponses[Math.floor(Math.random() * engagedResponses.length)]
      });
    }
    
    // Add follow-up discussion for key points
    if (index % 3 === 2 && index < points.length - 1) {
      const followUps = [
        `But here's what I'm wondering - how does this actually play out in practice?`,
        `The more I think about this, the more questions I have. Like, what does this mean for...`,
        `You know what's wild? I bet most people have experienced this without even realizing it.`,
        `This is making me rethink everything I thought I knew about this topic.`
      ];
      
      segments.push({
        speaker: respondSpeaker,
        text: followUps[Math.floor(Math.random() * followUps.length)]
      });
    }
  });

  // Natural, emotional conclusion
  const conclusions = [
    `You know what? This conversation has been incredible. I feel like I understand this topic on a completely different level now.`,
    `This has been such an eye-opening discussion! I'm definitely going to be thinking about these ideas for days.`,
    `Wow, we've covered so much ground here. I love how everything connects together in ways you don't expect.`
  ];
  
  segments.push({
    speaker: 'host2',
    text: conclusions[Math.floor(Math.random() * conclusions.length)]
  });
  
  const closings = [
    `Absolutely! And honestly, this is just the tip of the iceberg. There's so much more to explore here. Thanks for diving deep with me on this one!`,
    `I couldn't agree more! These are the kinds of conversations that make everything click. Thanks for bringing such great insights to this discussion!`,
    `Exactly! And I love how we can take these complex ideas and make them feel so relatable. This has been awesome - thanks for the great conversation!`
  ];
  
  segments.push({
    speaker: 'host1',
    text: closings[Math.floor(Math.random() * closings.length)]
  });

  return {
    title: `Podcast Discussion: ${title}`,
    segments,
    totalDuration: estimateTotalDuration(segments)
  };
}

/**
 * Extract key discussion points from content
 */
function extractKeyPoints(content: string): string[] {
  // Clean content and split into sentences
  const cleanContent = content
    .replace(/\[\[PAGE:\d+\]\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
    
  const sentences = cleanContent
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 30) // Increased minimum length for meaningful content
    .slice(0, 8); // Take more sentences for better discussion
  
  // If we have fewer sentences, split the content differently
  if (sentences.length < 3) {
    // Split by commas or semicolons for shorter content
    const phrases = cleanContent
      .split(/[,;]+/)
      .map(p => p.trim())
      .filter(p => p.length > 20)
      .slice(0, 6);
    
    return phrases.length > 0 ? phrases : [cleanContent];
  }
  
  return sentences;
}

/**
 * Estimate total duration based on text length
 */
function estimateTotalDuration(segments: PodcastSegment[]): number {
  const totalText = segments.reduce((sum, segment) => sum + segment.text.length, 0);
  // Estimate roughly 3 characters per second for speech
  return Math.ceil(totalText / 3); // Duration in seconds
}

/**
 * Convert script to SSML for better TTS control
 */
export function scriptToSSML(script: PodcastScript, speakers = DEFAULT_SPEAKERS): string {
  const ssmlSegments = script.segments.map(segment => {
    const speaker = speakers[segment.speaker];
    const voice = segment.speaker === 'host1' ? 'en-US-AriaNeural' : 'en-US-JennyNeural';
    
    return `
    <voice name="${voice}">
      <prosody rate="medium" pitch="medium">
        ${segment.text}
      </prosody>
      <break time="1s"/>
    </voice>`;
  });
  
  return `
  <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    ${ssmlSegments.join('\n')}
  </speak>`;
}
