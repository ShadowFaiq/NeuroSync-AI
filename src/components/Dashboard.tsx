import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface DashboardProps {
    userId: string;
}

export default function Dashboard({ userId }: DashboardProps) {
    const [checkIns, setCheckIns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCheckIns();
    }, [userId]);

    const fetchCheckIns = async () => {
        try {
            const { data } = await supabase
                .from('audio_recordings')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(10);

            if (data) {
                setCheckIns(data);
            }
        } catch (error) {
            console.error('Error fetching check-ins:', error);
        } finally {
            setLoading(false);
        }
    };

    const getMoodEmoji = (moodScore: number) => {
        if (moodScore >= 0.7) return '😊';
        if (moodScore >= 0.5) return '😐';
        if (moodScore >= 0.3) return '😔';
        return '😰';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Your Journey</h1>
                    <p className="text-gray-400">Track your emotional patterns over time</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                    <div className="text-sm text-gray-400">Total Check-ins</div>
                    <div className="text-2xl font-bold text-white mt-2">{checkIns.length}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                    <div className="text-sm text-gray-400">Avg. Energy</div>
                    <div className="text-2xl font-bold text-white mt-2">
                        {checkIns.length > 0
                            ? Math.round((checkIns.reduce((acc, curr) => acc + (curr.mood_score || 0), 0) / checkIns.length) * 100)
                            : 0}%
                    </div>
                </div>
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                    <div className="text-sm text-gray-400">Streak</div>
                    <div className="text-2xl font-bold text-white mt-2">3 Days</div>
                </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h2 className="text-lg font-semibold text-white mb-6">Recent History</h2>
                <div className="space-y-3">
                    {checkIns.map((checkIn) => (
                        <div
                            key={checkIn.id}
                            className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center text-2xl">
                                    {getMoodEmoji(checkIn.mood_score || 0.5)}
                                </div>
                                <div>
                                    <div className="font-medium text-white">
                                        {checkIn.mood_score >= 0.7 ? 'Happy & Motivated' :
                                            checkIn.mood_score >= 0.5 ? 'Calm & Focused' :
                                                checkIn.mood_score >= 0.3 ? 'Tired & Overwhelmed' :
                                                    'Anxious'}
                                    </div>
                                    <div className="text-sm text-gray-400 mt-1">
                                        {new Date(checkIn.created_at).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-semibold text-teal-400">
                                    {Math.round((checkIn.mood_score || 0) * 100)}%
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
