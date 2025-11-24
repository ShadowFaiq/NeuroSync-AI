import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import GlassCard from './ui/GlassCard';
import GradientButton from './ui/GradientButton';
import BreathingExercise from './BreathingExercise';
import { Mic, Square, Play, Music, CheckCircle, Brain } from 'lucide-react';

// TypeScript Interfaces for API responses
interface TranscribeResponse {
    success: boolean;
    transcript: string;
    mood_score: number;
    anxiety_score: number;
    crisis_flag: boolean;
    wellness_plan: WellnessPlan;
}

interface WellnessPlan {
    immediate_actions?: string[];
    activities?: string[];
    music_recommendation?: {
        needed: boolean;
        spotify_playlist_url?: string;
        description?: string;
    };
}

interface AudioRecorderProps {
    userId: string;
    userProfile: any;
}

export default function AudioRecorder({ userId, userProfile }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [transcription, setTranscription] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [wellnessPlan, setWellnessPlan] = useState<WellnessPlan | null>(null);
    const [showPlan, setShowPlan] = useState(false);
    const [scores, setScores] = useState<{ mood: number; anxiety: number } | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Please ensure permissions are granted.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const processAudio = async () => {
        if (!audioBlob) return;

        setIsProcessing(true);
        console.log('=== Starting Audio Processing ===');
        console.log('User ID:', userId);
        console.log('Audio blob size:', audioBlob.size, 'bytes');

        try {
            // Step 1: Upload to Supabase Storage
            const filename = `${userId}/${Date.now()}.webm`;
            console.log('[Step 1] Uploading to Supabase Storage:', filename);

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('audio_recording')
                .upload(filename, audioBlob, {
                    contentType: 'audio/webm',
                    upsert: false
                });

            if (uploadError) {
                console.error('[Upload Error]:', uploadError);

                if (uploadError.message?.includes('not found')) {
                    throw new Error('Storage bucket "audio_recording" not found. Please run supabase_setup.sql!');
                } else if (uploadError.message?.includes('permission') || uploadError.message?.includes('policy')) {
                    throw new Error('Permission denied. Check storage RLS policies!');
                } else {
                    throw new Error(`Upload failed: ${uploadError.message}`);
                }
            }

            console.log('[Upload Success] ✅');

            // Step 2: Get user phone
            const userPhone = userProfile?.whatsapp_number || userProfile?.phone || '';
            console.log('[Step 2] User phone:', userPhone || 'Not provided');

            // Step 3: Send to Backend API
            console.log('[Step 3] Calling backend API...');
            const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/transcribe`;

            const requestBody = {
                audio_id: filename,
                user_id: userId,
                user_phone: userPhone
            };

            console.log('Request:', requestBody);

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Backend Error]:', errorText);

                if (response.status === 404) {
                    throw new Error('Backend not found. Is the server running on port 8000? Run: npm run dev');
                } else if (response.status === 500) {
                    throw new Error(`Backend error: ${errorText.substring(0, 100)}`);
                } else {
                    throw new Error(`API error (${response.status}): ${errorText}`);
                }
            }

            const result: TranscribeResponse = await response.json();
            console.log('[API Response] ✅:', result);

            // Validate response
            if (!result.transcript) {
                throw new Error('Invalid API response - missing transcript');
            }

            // Step 4: Display results
            setTranscription(result.transcript);
            setWellnessPlan(result.wellness_plan);
            setScores({ mood: result.mood_score, anxiety: result.anxiety_score });
            setShowPlan(true);
            console.log('=== Processing Complete ===');

        } catch (error: any) {
            console.error('[Processing Error] ❌:', error);

            let userMessage = 'Error processing audio:\n\n';
            if (error.message.includes('fetch')) {
                userMessage += '❌ Cannot connect to backend.\n\nMake sure:\n1. Backend is running (npm run dev)\n2. Check console for errors';
            } else {
                userMessage += error.message;
            }

            alert(userMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold text-white">Daily Check-In</h1>
                <p className="text-gray-400">Record your thoughts and feelings to get personalized insights.</p>
            </div>

            <GlassCard className="flex flex-col items-center justify-center p-12 min-h-[400px]">
                {!audioBlob && !isProcessing && (
                    <div className="text-center space-y-8">
                        <div className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${isRecording ? 'bg-red-500/20 animate-pulse' : 'bg-indigo-500/20'}`}>
                            {isRecording && (
                                <div className="w-full h-full absolute rounded-full border-4 border-red-500/50 animate-ping" />
                            )}
                            <Mic className={`w-12 h-12 ${isRecording ? 'text-red-500' : 'text-indigo-400'}`} />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white">
                                {isRecording ? 'Recording...' : 'Tap to Record'}
                            </h2>
                            <p className="text-gray-400 font-mono text-xl">
                                {formatTime(recordingTime)}
                            </p>
                        </div>

                        <div className="flex justify-center gap-4">
                            {!isRecording ? (
                                <GradientButton onClick={startRecording} size="lg" className="rounded-full w-16 h-16 p-0 flex items-center justify-center">
                                    <Mic className="w-6 h-6" />
                                </GradientButton>
                            ) : (
                                <button
                                    onClick={stopRecording}
                                    className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-all transform hover:scale-105 shadow-lg shadow-red-500/30"
                                >
                                    <Square className="w-6 h-6 fill-current" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {audioBlob && !isProcessing && !showPlan && (
                    <div className="w-full max-w-md space-y-8 animate-fade-in">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-10 h-10 text-green-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Recording Complete</h2>
                            <p className="text-gray-400 mt-2">Ready to analyze your check-in?</p>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setAudioBlob(null)}
                                className="flex-1 py-3 px-6 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition"
                            >
                                Discard
                            </button>
                            <GradientButton onClick={processAudio} className="flex-1">
                                Analyze <Play className="ml-2 w-4 h-4" />
                            </GradientButton>
                        </div>
                    </div>
                )}

                {isProcessing && (
                    <div className="text-center space-y-6 animate-fade-in">
                        <div className="relative w-24 h-24 mx-auto">
                            <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full" />
                            <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin" />
                            <Brain className="absolute inset-0 m-auto w-8 h-8 text-indigo-400 animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Analyzing...</h2>
                            <p className="text-gray-400 mt-2">Generating your personalized wellness plan</p>
                        </div>
                    </div>
                )}
            </GlassCard>

            {showPlan && wellnessPlan && (
                <div className="space-y-6 animate-fade-in">
                    {scores && (
                        <div className={`relative overflow-hidden rounded-2xl transition-all duration-1000 ${scores.mood > 0.5
                            ? 'bg-gradient-to-br from-yellow-400/20 via-orange-500/20 to-pink-500/20 border-orange-500/30'
                            : 'bg-slate-900/50 border-slate-700/30'
                            } border p-8`}>
                            {/* Background Effects */}
                            {scores.mood > 0.5 && (
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,200,0,0.1),transparent_70%)] animate-pulse" />
                                    <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(255,165,0,0.05),transparent_50%)] animate-spin-slow" />
                                </div>
                            )}

                            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                {/* Mood Section */}
                                <div className="text-center space-y-4">
                                    <h3 className={`text-lg font-medium uppercase tracking-widest ${scores.mood > 0.5 ? 'text-yellow-400' : 'text-slate-400'
                                        }`}>
                                        Happiness Level
                                    </h3>

                                    <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                                        {/* Circular Progress Background */}
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle
                                                cx="80"
                                                cy="80"
                                                r="70"
                                                stroke="currentColor"
                                                strokeWidth="12"
                                                fill="transparent"
                                                className={scores.mood > 0.5 ? 'text-orange-500/20' : 'text-slate-700/30'}
                                            />
                                            <circle
                                                cx="80"
                                                cy="80"
                                                r="70"
                                                stroke="currentColor"
                                                strokeWidth="12"
                                                fill="transparent"
                                                strokeDasharray={440}
                                                strokeDashoffset={440 - (440 * scores.mood)}
                                                className={`transition-all duration-1000 ease-out ${scores.mood > 0.5 ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'text-slate-500'
                                                    }`}
                                                strokeLinecap="round"
                                            />
                                        </svg>

                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className={`text-4xl font-bold ${scores.mood > 0.5 ? 'text-white drop-shadow-lg' : 'text-slate-300'
                                                }`}>
                                                {Math.round(scores.mood * 100)}%
                                            </span>
                                            <span className="text-2xl mt-1">
                                                {scores.mood > 0.7 ? '🤩' : scores.mood > 0.5 ? '🙂' : scores.mood > 0.3 ? '😐' : '😔'}
                                            </span>
                                        </div>
                                    </div>

                                    <p className={`text-sm ${scores.mood > 0.5 ? 'text-orange-200' : 'text-slate-500'}`}>
                                        {scores.mood > 0.5 ? "Radiating positive energy! ✨" : "A quiet, reflective moment."}
                                    </p>
                                </div>

                                {/* Anxiety Section */}
                                <div className="text-center space-y-4">
                                    <h3 className="text-lg font-medium uppercase tracking-widest text-purple-400">
                                        Anxiety Level
                                    </h3>

                                    <div className="relative w-full h-4 bg-gray-700/50 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000 ease-out"
                                            style={{ width: `${scores.anxiety * 100}%` }}
                                        />
                                    </div>

                                    <div className="flex justify-between items-end">
                                        <span className="text-3xl font-bold text-white">
                                            {Math.round(scores.anxiety * 100)}%
                                        </span>
                                        <span className="text-sm text-purple-300 mb-1">
                                            {scores.anxiety > 0.7 ? "High Intensity" : scores.anxiety > 0.3 ? "Moderate" : "Calm"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Breathing Exercise Section */}
                    <BreathingExercise />

                    {wellnessPlan.music_recommendation?.spotify_playlist_url && (
                        <GlassCard className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 transform transition-all hover:scale-[1.02] cursor-pointer group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                                    <Music className="w-6 h-6 text-green-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        Music for your Mood
                                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Spotify</span>
                                    </h3>
                                    <p className="text-gray-300 text-sm">{wellnessPlan.music_recommendation.description || 'Personalized playlist for you'}</p>
                                </div>
                                <a
                                    href={wellnessPlan.music_recommendation.spotify_playlist_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-2.5 bg-green-500 hover:bg-green-600 rounded-full text-white font-bold shadow-lg shadow-green-500/20 transition-all flex items-center gap-2"
                                >
                                    <Play className="w-4 h-4 fill-current" />
                                    Listen
                                </a>
                            </div>
                        </GlassCard>
                    )}

                    <GlassCard className="border-l-4 border-l-indigo-500">
                        <h2 className="text-xl font-bold text-white mb-4">Transcription</h2>
                        <p className="text-gray-300 leading-relaxed">{transcription}</p>
                    </GlassCard>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GlassCard>
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-400" />
                                Immediate Actions
                            </h3>
                            <ul className="space-y-3">
                                {wellnessPlan.immediate_actions?.map((action, i) => (
                                    <li key={i} className="flex items-start gap-3 text-gray-300">
                                        <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-xs text-blue-400 mt-0.5">
                                            {i + 1}
                                        </span>
                                        {action}
                                    </li>
                                ))}
                            </ul>
                        </GlassCard>

                        <GlassCard>
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-400" />
                                Recommended Activities
                            </h3>
                            <ul className="space-y-3">
                                {wellnessPlan.activities?.map((activity, i) => (
                                    <li key={i} className="flex items-start gap-3 text-gray-300">
                                        <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-xs text-purple-400 mt-0.5">
                                            {i + 1}
                                        </span>
                                        {activity}
                                    </li>
                                ))}
                            </ul>
                        </GlassCard>
                    </div>



                    <div className="flex justify-center pt-8">
                        <GradientButton onClick={() => {
                            setShowPlan(false);
                            setAudioBlob(null);
                            setTranscription('');
                            setWellnessPlan(null);
                        }}>
                            Start New Check-In
                        </GradientButton>
                    </div>
                </div>
            )}
        </div>
    );
}
