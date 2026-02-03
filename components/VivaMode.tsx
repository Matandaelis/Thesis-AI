import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Video, X, Sparkles, Activity } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

// --- Audio Utils ---
function base64ToArrayBuffer(base64: string) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

function encodeAudio(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): any {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encodeAudio(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
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

interface VivaModeProps {
    onClose: () => void;
    contextText?: string;
}

export const VivaMode: React.FC<VivaModeProps> = ({ onClose, contextText }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
    const [volume, setVolume] = useState(0); // For visualizer
    const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([]);
    
    // Audio Context Refs
    const inputContextRef = useRef<AudioContext | null>(null);
    const outputContextRef = useRef<AudioContext | null>(null);
    const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sessionRef = useRef<any>(null); // LiveSession
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    useEffect(() => {
        return () => {
            handleDisconnect();
        };
    }, []);

    // Visualizer Loop
    useEffect(() => {
        let animId: number;
        const updateVisualizer = () => {
            if (isConnected) {
                setVolume(v => Math.max(0, Math.min(100, v + (Math.random() * 20 - 10))));
            } else {
                setVolume(0);
            }
            animId = requestAnimationFrame(updateVisualizer);
        };
        updateVisualizer();
        return () => cancelAnimationFrame(animId);
    }, [isConnected]);

    const handleConnect = async () => {
        setStatus('connecting');
        try {
            const metaEnv = (import.meta as any).env || {};
            const processEnv = (typeof process !== 'undefined' && process.env) ? process.env : {};
            const apiKey = metaEnv.VITE_API_KEY || metaEnv.VITE_GEMINI_API_KEY || processEnv.API_KEY;
            
            if (!apiKey) throw new Error("API Key missing");

            const ai = new GoogleGenAI({ apiKey });
            
            // Audio Setup
            inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Construct System Instruction with Context
            const instruction = `You are a tough but fair academic supervisor conducting a viva defense. Ask probing questions one by one. Keep responses concise.${contextText ? ` The student is practicing for their thesis defense. Here is the context of their thesis: "${contextText.substring(0, 1000)}...". Based on this context, ask rigorous questions about methodology and findings.` : ''}`;

            // Live Session Init
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: {
                    onopen: () => {
                        console.log("Live Session Opened");
                        setStatus('connected');
                        setIsConnected(true);
                        setMessages(prev => [...prev, {role: 'model', text: "Session connected. Ready for defense."}]);

                        // Start Input Stream
                        if (inputContextRef.current) {
                            inputSourceRef.current = inputContextRef.current.createMediaStreamSource(stream);
                            processorRef.current = inputContextRef.current.createScriptProcessor(4096, 1, 1);
                            
                            processorRef.current.onaudioprocess = (e) => {
                                const inputData = e.inputBuffer.getChannelData(0);
                                const pcmBlob = createBlob(inputData);
                                sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                            };
                            
                            inputSourceRef.current.connect(processorRef.current);
                            processorRef.current.connect(inputContextRef.current.destination);
                        }
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        // Handle Audio Output
                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData && outputContextRef.current) {
                            const buffer = base64ToArrayBuffer(audioData);
                            const audioBuffer = await decodeAudioData(new Uint8Array(buffer), outputContextRef.current, 24000, 1);
                            
                            const source = outputContextRef.current.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputContextRef.current.destination);
                            
                            // Scheduling
                            const currentTime = outputContextRef.current.currentTime;
                            const startTime = Math.max(currentTime, nextStartTimeRef.current);
                            source.start(startTime);
                            nextStartTimeRef.current = startTime + audioBuffer.duration;
                            
                            source.onended = () => sourcesRef.current.delete(source);
                            sourcesRef.current.add(source);
                        }
                    },
                    onclose: () => {
                        console.log("Live Session Closed");
                        handleDisconnect();
                    },
                    onerror: (err) => {
                        console.error("Live Session Error", err);
                        setStatus('error');
                        handleDisconnect();
                    }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                    },
                    systemInstruction: instruction,
                }
            });
            
            sessionRef.current = sessionPromise;

        } catch (e) {
            console.error(e);
            setStatus('error');
        }
    };

    const handleDisconnect = () => {
        setIsConnected(false);
        setStatus('idle');
        
        // Stop Audio Processing
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current.onaudioprocess = null;
            processorRef.current = null;
        }
        if (inputSourceRef.current) {
            inputSourceRef.current.disconnect();
            inputSourceRef.current = null;
        }
        if (inputContextRef.current) {
            inputContextRef.current.close();
            inputContextRef.current = null;
        }
        if (outputContextRef.current) {
            outputContextRef.current.close();
            outputContextRef.current = null;
        }
        
        // Stop Session
        if (sessionRef.current) {
            sessionRef.current.then((s: any) => s.close());
            sessionRef.current = null;
        }
        sourcesRef.current.forEach(s => s.stop());
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;
    };

    const toggleMute = () => {
        if (inputSourceRef.current && inputSourceRef.current.mediaStream) {
            inputSourceRef.current.mediaStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
            setIsMuted(!isMuted);
        }
    };

    return (
        <div className="fixed inset-0 bg-zinc-950/95 z-50 flex items-center justify-center p-6 animate-fade-in backdrop-blur-md">
            <div className="max-w-2xl w-full bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-zinc-800 relative overflow-hidden">
                {/* Background Pulse */}
                {isConnected && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
                )}

                <div className="relative z-10 flex flex-col items-center text-center space-y-8">
                    {/* Header */}
                    <div className="flex justify-between w-full items-center">
                        <div className="flex items-center gap-2 text-indigo-400">
                            <Activity size={20} className={isConnected ? "animate-pulse" : ""} />
                            <span className="font-bold tracking-wider text-sm uppercase">Viva Defense Mode</span>
                        </div>
                        <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Status & Visualizer */}
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[200px]">
                        {status === 'idle' && (
                            <div className="text-zinc-300">
                                <h2 className="text-2xl font-serif font-bold mb-2">Ready to Practice?</h2>
                                <p className="text-sm opacity-70 max-w-md">Connect to start a real-time voice conversation with your AI Supervisor. It will ask questions about your thesis context.</p>
                            </div>
                        )}
                        {status === 'connecting' && (
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-indigo-400 font-bold">Establishing Secure Line...</p>
                            </div>
                        )}
                        {status === 'connected' && (
                            <div className="relative">
                                {/* Simulated Visualizer Ring */}
                                <div 
                                    className="w-32 h-32 rounded-full border-4 border-indigo-500 flex items-center justify-center transition-all duration-75 shadow-[0_0_30px_rgba(99,102,241,0.5)]"
                                    style={{ transform: `scale(${1 + volume / 200})` }}
                                >
                                    <Mic size={48} className="text-white" />
                                </div>
                                <div className="mt-8 text-indigo-300 font-medium animate-pulse">Listening...</div>
                            </div>
                        )}
                        {status === 'error' && (
                            <div className="text-red-400">
                                <p className="font-bold text-lg mb-2">Connection Failed</p>
                                <button onClick={() => setStatus('idle')} className="underline">Try Again</button>
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-6">
                        {status === 'idle' ? (
                            <button 
                                onClick={handleConnect}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg shadow-indigo-900/50 transition-all hover:scale-105 flex items-center gap-3"
                            >
                                <Video size={24} /> Start Defense
                            </button>
                        ) : status === 'connected' ? (
                            <>
                                <button 
                                    onClick={toggleMute}
                                    className={`p-4 rounded-full transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}`}
                                >
                                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                                </button>
                                <button 
                                    onClick={handleDisconnect}
                                    className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg shadow-red-900/50 transition-all hover:scale-105"
                                >
                                    End Session
                                </button>
                            </>
                        ) : null}
                    </div>
                    
                    <p className="text-xs text-zinc-500">
                        Powered by Gemini 2.5 Native Audio. Use headphones for best experience.
                    </p>
                </div>
            </div>
        </div>
    );
};