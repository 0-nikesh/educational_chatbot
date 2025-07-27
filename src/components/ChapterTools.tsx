import React, { useState, useEffect } from 'react';
import { speakConversational, speak, formatTime, type TTSState, type TTSControls } from '../lib/enhancedTTS';
import { generatePodcastScript } from '../lib/podcastScript';
import { summarizeDemo } from '../lib/summarize';
import { useProjectStore } from '../state/useProjectStore';

export function ChapterTools() {
  const { activeSectionId, sections, addNote } = useProjectStore();
  const [busy, setBusy] = useState(false);
  const [conversational, setConversational] = useState(true);
  
  // Enhanced TTS state
  const [ttsState, setTtsState] = useState<TTSState>({
    isPlaying: false,
    isPaused: false,
    currentSegment: 0,
    totalSegments: 0,
    currentTime: 0,
    totalTime: 0,
    progress: 0
  });
  const [ttsControls, setTtsControls] = useState<TTSControls | null>(null);

  const current = sections.find(s => s.id === activeSectionId);

  const summarize = async () => {
    if (!current) return;
    setBusy(true);
    try {
      const sum = await summarizeDemo(current.text);
      addNote({ title: `Summary: ${current.title}`, body: sum, timestamp: Date.now() });
    } finally {
      setBusy(false);
    }
  };

  const generatePodcast = async () => {
    if (!current) return;
    setBusy(true);
    try {
      // Stop any current playback
      if (ttsControls) {
        ttsControls.stop();
      }

      const sum = await summarizeDemo(current.text);
      
      if (conversational) {
        // Generate conversational podcast
        const script = await generatePodcastScript(current.title, sum);
        console.log('Generated script with segments:', script.segments.length);
        console.log('Script segments preview:', script.segments.map(s => `${s.speaker}: ${s.text.substring(0, 50)}...`));
        
        const controls = await speakConversational(script);
        setTtsControls(controls);
        
        addNote({ 
          title: `Podcast Script: ${current.title}`, 
          body: `Generated conversational podcast with ${script.segments.length} segments\n\nContent being discussed:\n${sum}`, 
          timestamp: Date.now() 
        });
      } else {
        // Single speaker
        speak(sum);
        addNote({ title: `Podcast: ${current.title}`, body: 'Single speaker podcast generated', timestamp: Date.now() });
      }
    } finally {
      setBusy(false);
    }
  };

  const handlePlayPause = () => {
    if (!ttsControls) return;
    
    if (ttsState.isPlaying && !ttsState.isPaused) {
      ttsControls.pause();
    } else {
      ttsControls.play();
    }
  };

  const handleStop = () => {
    if (ttsControls) {
      ttsControls.stop();
      setTtsControls(null);
      setTtsState({
        isPlaying: false,
        isPaused: false,
        currentSegment: 0,
        totalSegments: 0,
        currentTime: 0,
        totalTime: 0,
        progress: 0
      });
    }
  };

  const handleSkip = () => {
    if (ttsControls) {
      ttsControls.skip();
    }
  };

  // Update TTS state
  useEffect(() => {
    if (ttsControls) {
      const interval = setInterval(() => {
        setTtsState(ttsControls.getState());
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [ttsControls]);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
      <h3 className="font-semibold text-gray-800">Chapter Tools</h3>
      
      {current ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Active Chapter:</span>
            <span className="text-sm text-gray-800 truncate ml-2">{current.title}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={summarize}
              disabled={busy}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {busy ? 'Summarizing...' : 'Summarize'}
            </button>
            <button
              onClick={generatePodcast}
              disabled={busy}
              className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {busy ? 'Generating...' : 'Generate Podcast'}
            </button>
          </div>

          {/* Podcast Format Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Format:</span>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={conversational}
                onChange={(e) => setConversational(e.target.checked)}
                className="sr-only"
              />
              <div className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${conversational ? 'bg-purple-500' : 'bg-gray-300'}`}>
                <div className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${conversational ? 'translate-x-4' : 'translate-x-0.5'} mt-0.5`} />
              </div>
              <span className="ml-2 text-sm text-gray-700">
                {conversational ? 'Conversational (2 speakers)' : 'Single speaker'}
              </span>
            </label>
          </div>

          {/* Enhanced Audio Controls */}
          {ttsControls && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-700">Podcast Player</h4>
                <div className="flex items-center text-xs text-gray-500">
                  <span className="mr-1">🎧</span>
                  {formatTime(ttsState.currentTime)} / {formatTime(ttsState.totalTime)}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${ttsState.progress}%` }}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handlePlayPause}
                  className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full transition-colors"
                  title={ttsState.isPlaying && !ttsState.isPaused ? 'Pause' : 'Play'}
                >
                  {ttsState.isPlaying && !ttsState.isPaused ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 4v12h2V4H6zm6 0v12h2V4h-2z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.75 4.75l8.25 5.25-8.25 5.25V4.75z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={handleStop}
                  className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                  title="Stop"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4h12v12H4V4z" clipRule="evenodd" />
                  </svg>
                </button>

                <button
                  onClick={handleSkip}
                  className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-colors"
                  title="Skip to next segment"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.75 4.75l8.25 5.25-8.25 5.25V4.75zm11.25 0v10.5h-2V4.75h2z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Segment Info */}
              <div className="text-center text-xs text-gray-500">
                Segment {ttsState.currentSegment + 1} of {ttsState.totalSegments}
                {ttsState.isPaused && <span className="ml-2 text-yellow-600">⏸ Paused</span>}
                {conversational && (
                  <div className="mt-1 text-purple-600">
                    🎙️ {ttsState.currentSegment % 2 === 0 ? 'Nikesh' : 'Saurab'} speaking
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">Select a chapter to use tools</p>
      )}
    </div>
  );
}
