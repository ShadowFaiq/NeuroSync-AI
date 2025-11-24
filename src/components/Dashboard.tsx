import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import GlassCard from './ui/GlassCard';
import { Activity, Calendar, TrendingUp, Zap, Music } from 'lucide-react';

interface DashboardProps {
    userId: string;
}

export default function Dashboard({ userId }: DashboardProps) {
    const [checkIns, setCheckIns] = useState<any[]>([]);
    const [energyData, setEnergyData] = useState<any[]>([]);

    useEffect(() => {
        fetchCheckIns();
    }, [userId]);

    const fetchCheckIns = async () => {
        const { data, error: _error } = await supabase
            .from('audio_recordings')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (data) {
            setCheckIns(data);

            // Prepare energy timeline data
            const timelineData = data.slice().reverse().map((record: any) => ({
                date: new Date(record.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                energy: Math.round((record.mood_score || 0.5) * 100)
            }));
            setEnergyData(timelineData);
        }
    };

    const getMoodEmoji = (moodScore: number) => {
        if (moodScore >= 0.7) return '😊';
        if (moodScore >= 0.5) return '😐';
        if (moodScore >= 0.3) return '😔';
        return '😰';
    };

    const getMoodLabel = (moodScore: number) => {
        if (moodScore >= 0.7) return 'Happy & Motivated';
        if (moodScore >= 0.5) return 'Calm & Focused';
        if (moodScore >= 0.3) return 'Tired & Overwhelmed';
        return 'Energized & Anxious';
    };

    const getStatusColor = (moodScore: number) => {
        if (moodScore >= 0.7) return 'bg-green-500/20 text-green-400 border-green-500/30';
        if (moodScore >= 0.5) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        if (moodScore >= 0.3) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Your Journey</h1>
                    <p className="text-gray-400">Track your emotional patterns over time</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                            <Activity className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total Check-ins</p>
                            <h3 className="text-2xl font-bold text-white">{checkIns.length}</h3>
                        </div>
                    </div>
                </GlassCard>
                <GlassCard>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-teal-500/20 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-teal-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Avg. Energy</p>
                            <h3 className="text-2xl font-bold text-white">
                                {energyData.length > 0
                                    ? Math.round(energyData.reduce((acc, curr) => acc + curr.energy, 0) / energyData.length)
                                    : 0}%
                            </h3>
                        </div>
                    </div>
                </GlassCard>
                <GlassCard>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <Zap className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Streak</p>
                            <h3 className="text-2xl font-bold text-white">3 Days</h3>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Energy Timeline Chart */}
            <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center">
                        <Activity className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Energy Timeline</h2>
                        <p className="text-sm text-gray-400">Last 10 check-ins</p>
                    </div>
                </div>

                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={energyData}>
                            <defs>
                                <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#9ca3af"
                                style={{ fontSize: '12px' }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#9ca3af"
                                style={{ fontSize: '12px' }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="energy"
                                stroke="#14b8a6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorEnergy)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>

            {/* Check-In History */}
            <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">Recent History</h2>
                </div>

                <div className="space-y-3">
                    {checkIns.map((checkIn) => (
                        <div
                            key={checkIn.id}
                            className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition cursor-pointer group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                    {getMoodEmoji(checkIn.mood_score)}
                                </div>

                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-medium text-white">{getMoodLabel(checkIn.mood_score)}</h3>
                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(checkIn.mood_score)}`}>
                                            {checkIn.wellness_plan ? 'Completed' : 'In Progress'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-1">
                                        {new Date(checkIn.created_at).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="text-right hidden sm:block">
                                <div className="text-sm font-medium text-gray-400">Energy</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full"
                                            style={{ width: `${(checkIn.mood_score || 0) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-semibold text-teal-400">
                                        {Math.round((checkIn.mood_score || 0) * 100)}%
                                    </span>
                                </div>
                                {checkIn.wellness_plan?.music_recommendation?.spotify_playlist_url && (
                                    <a
                                        href={checkIn.wellness_plan.music_recommendation.spotify_playlist_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 mt-2 text-xs text-green-400 hover:text-green-300 transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Music className="w-3 h-3" />
                                        Play Music
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </GlassCard>
        </div>
    );
}
