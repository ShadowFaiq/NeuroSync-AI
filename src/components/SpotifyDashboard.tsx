import { useState, useEffect } from 'react';
import { Music, Play, ExternalLink } from 'lucide-react';
import GlassCard from './ui/GlassCard';
import GradientButton from './ui/GradientButton';

interface SpotifyDashboardProps {
    userId: string;
    moodScore: number;
    anxietyScore: number;
}

interface Track {
    id: string;
    name: string;
    artists: { name: string }[];
    album: { images: { url: string }[] };
    external_urls: { spotify: string };
}

export default function SpotifyDashboard({ userId, moodScore, anxietyScore }: SpotifyDashboardProps) {
    const [recommendations, setRecommendations] = useState<Track[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRecommendations = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/spotify/recommendations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    mood_score: moodScore,
                    anxiety_score: anxietyScore
                })
            });

            if (!response.ok) throw new Error('Failed to fetch recommendations');

            const data = await response.json();
            setRecommendations(data.tracks);
        } catch (err) {
            console.error('Error fetching recommendations:', err);
            setError('Could not load music. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecommendations();
    }, [moodScore, anxietyScore]);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Music className="w-8 h-8 text-green-400" />
                        Music Therapy
                    </h1>
                    <p className="text-gray-400">Curated tracks based on your current mood</p>
                </div>
                <GradientButton onClick={fetchRecommendations} disabled={loading}>
                    {loading ? 'Curating...' : 'Refresh Mix'}
                </GradientButton>
            </div>

            {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <GlassCard key={i} className="h-24 animate-pulse flex items-center gap-4">
                            <div className="w-16 h-16 bg-white/10 rounded-lg" />
                            <div className="space-y-2 flex-1">
                                <div className="h-4 w-3/4 bg-white/10 rounded" />
                                <div className="h-3 w-1/2 bg-white/10 rounded" />
                            </div>
                        </GlassCard>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendations.map((track) => (
                        <GlassCard key={track.id} className="group hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1">
                            <div className="flex items-center gap-4">
                                <div className="relative w-20 h-20 flex-shrink-0">
                                    <img
                                        src={track.album.images[0]?.url}
                                        alt={track.name}
                                        className="w-full h-full object-cover rounded-lg shadow-lg group-hover:shadow-green-500/20 transition-shadow"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                        <Play className="w-8 h-8 text-white fill-current" />
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white truncate pr-2">{track.name}</h3>
                                    <p className="text-sm text-gray-400 truncate">{track.artists.map(a => a.name).join(', ')}</p>

                                    <a
                                        href={track.external_urls.spotify}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 mt-2 text-xs text-green-400 hover:text-green-300 font-medium"
                                    >
                                        Play on Spotify <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
}
