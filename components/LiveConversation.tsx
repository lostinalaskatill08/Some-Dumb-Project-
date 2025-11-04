
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import type { AnalysisContent } from '../types';
import { MicrophoneIcon } from './Icons';

// --- Audio Helper Functions (as per guidelines) ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

/**
 * @google/genai does not export the LiveSession type.
 * Defining a local interface for type safety based on its usage in this component.
 */
interface LiveSession {
  close: () => void;
  sendRealtimeInput: (input: { media: Blob }) => void;
}

interface LiveConversationProps {
  context: 'GUIDANCE' | 'SUMMARY';
  summary: AnalysisContent | null;
  onClose: () => void;
}

type Status = 'CONNECTING' | 'LISTENING' | 'SPEAKING' | 'ERROR' | 'IDLE';
interface Transcription {
    author: 'You' | 'AI';
    text: string;
}

const LiveConversation: React.FC<LiveConversationProps> = ({ context, summary, onClose }) => {
    const [status, setStatus] = useState<Status>('CONNECTING');
    const [error, setError] = useState<string | null>(null);
    const [transcriptionHistory, setTranscriptionHistory] = useState<Transcription[]>([]);
    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioResourcesRef = useRef<{
        inputAudioContext: AudioContext;
        outputAudioContext: AudioContext;
        stream: MediaStream;
        scriptProcessor: ScriptProcessorNode;
        sources: Set<AudioBufferSourceNode>;
        nextStartTime: number;
    } | null>(null);

    const transcriptEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcriptionHistory]);

    useEffect(() => {
        let isCancelled = false;
        
        const startSession = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                if (isCancelled) return;
                
                const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                
                const sources = new Set<AudioBufferSourceNode>();
                let nextStartTime = 0;
                
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
                
                const systemInstruction = context === 'GUIDANCE'
                    ? "You are a friendly and patient assistant for the Green Energy Candidate Analyzer. Your goal is to help users, especially those who may not be tech-savvy or have disabilities, navigate the application. Start by asking what their role is (Homeowner, Community Organizer, etc.) and what location they want to analyze. Be clear, simple, and encouraging."
                    : `You are an expert energy consultant. The user has just received their personalized analysis. Your task is to discuss the results. Start by briefly summarizing the key findings, then ask if they have any questions or want to explore their next steps. Be prepared to explain recommendations in simpler terms. Here is the user's summary report:\n\n${summary?.text}`;
                
                sessionPromiseRef.current = ai.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                    config: {
                        responseModalities: [Modality.AUDIO],
                        inputAudioTranscription: {},
                        outputAudioTranscription: {},
                        systemInstruction,
                    },
                    callbacks: {
                        onopen: () => {
                            if (isCancelled) return;
                            setStatus('LISTENING');
                            const source = inputAudioContext.createMediaStreamSource(stream);
                            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                                const pcmBlob = createBlob(inputData);
                                sessionPromiseRef.current?.then((session) => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            };
                            source.connect(scriptProcessor);
                            scriptProcessor.connect(inputAudioContext.destination);
                            
                            if (audioResourcesRef.current) {
                                audioResourcesRef.current.scriptProcessor = scriptProcessor;
                            }
                        },
                        onmessage: async (message: LiveServerMessage) => {
                            if (isCancelled) return;
                            if (message.serverContent?.outputTranscription) {
                                currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                            }
                            if (message.serverContent?.inputTranscription) {
                                currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                            }
                            if (message.serverContent?.turnComplete) {
                                const fullInput = currentInputTranscriptionRef.current;
                                const fullOutput = currentOutputTranscriptionRef.current;
                                if (fullInput) setTranscriptionHistory(prev => [...prev, { author: 'You', text: fullInput }]);
                                if (fullOutput) setTranscriptionHistory(prev => [...prev, { author: 'AI', text: fullOutput }]);
                                currentInputTranscriptionRef.current = '';
                                currentOutputTranscriptionRef.current = '';
                                setStatus('LISTENING');
                            }

                            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                            if (base64Audio) {
                                setStatus('SPEAKING');
                                nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                                const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                                const source = outputAudioContext.createBufferSource();
                                source.buffer = audioBuffer;
                                source.connect(outputAudioContext.destination);
                                source.addEventListener('ended', () => {
                                    sources.delete(source);
                                    if(sources.size === 0 && status === 'SPEAKING'){
                                        setStatus('LISTENING');
                                    }
                                });
                                source.start(nextStartTime);
                                nextStartTime += audioBuffer.duration;
                                sources.add(source);
                            }
                        },
                        onerror: (e) => {
                            console.error('Live API Error:', e);
                            setError('A connection error occurred. Please try again.');
                            setStatus('ERROR');
                        },
                        onclose: () => {
                            if (!isCancelled) {
                                // console.log('Session closed.');
                            }
                        },
                    },
                });

                audioResourcesRef.current = {
                    inputAudioContext,
                    outputAudioContext,
                    stream,
                    scriptProcessor: null as any, // Will be set in onopen
                    sources,
                    nextStartTime,
                };
            } catch (err) {
                console.error('Failed to start session:', err);
                setError('Could not access the microphone. Please grant permission and try again.');
                setStatus('ERROR');
            }
        };

        startSession();

        return () => {
            isCancelled = true;
            sessionPromiseRef.current?.then(session => session.close());
            if (audioResourcesRef.current) {
                audioResourcesRef.current.scriptProcessor?.disconnect();
                audioResourcesRef.current.stream?.getTracks().forEach(track => track.stop());
                audioResourcesRef.current.inputAudioContext?.close();
                audioResourcesRef.current.outputAudioContext?.close();
            }
        };
    }, [context, summary]);

    const renderStatus = () => {
        switch(status) {
            case 'CONNECTING': return "Connecting to AI Assistant...";
            case 'LISTENING': return "Listening...";
            case 'SPEAKING': return "AI is Speaking...";
            case 'ERROR': return "Error";
            case 'IDLE': return "Ready";
        }
    }
    
    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
            role="dialog"
            aria-modal="true"
        >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                <header className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 rounded-t-2xl z-10">
                    <div className="flex items-center gap-3">
                        <MicrophoneIcon className="w-6 h-6 text-green-500"/>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">AI Voice Assistant</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                        aria-label="Close voice assistant"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <div className="p-6 flex-1 overflow-y-auto space-y-4">
                   {transcriptionHistory.map((item, index) => (
                       <div key={index} className={`flex ${item.author === 'You' ? 'justify-end' : 'justify-start'}`}>
                           <div className={`max-w-[80%] p-3 rounded-2xl ${item.author === 'You' ? 'bg-green-100 dark:bg-green-900/50 text-slate-800 dark:text-slate-200 rounded-br-none' : 'bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 rounded-bl-none'}`}>
                               <p className="font-bold text-sm mb-1">{item.author}</p>
                               <p className="text-base">{item.text}</p>
                           </div>
                       </div>
                   ))}
                   <div ref={transcriptEndRef} />
                </div>

                <footer className="p-4 border-t border-slate-200 dark:border-slate-700 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400">
                        {status === 'LISTENING' && <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>}
                        {status === 'SPEAKING' && <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>}
                        <p className="font-medium">{renderStatus()}</p>
                    </div>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </footer>
            </div>
        </div>
    );
};

export default LiveConversation;
