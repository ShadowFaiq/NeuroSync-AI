import { useState, useEffect } from 'react';
import { Wind } from 'lucide-react';
import GlassCard from './ui/GlassCard';

export default function BreathingExercise() {
    const [isActive, setIsActive] = useState(false);
    const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
    const [text, setText] = useState('Ready to relax?');

    useEffect(() => {
        if (!isActive) {
            setText('Ready to relax?');
            setPhase('inhale'); // Reset to initial state visual
            return;
        }

        const cycle = async () => {
            // Inhale (4s)
            setPhase('inhale');
            setText('Breathe In...');
            await new Promise(r => setTimeout(r, 4000));

            if (!isActive) return;

            // Hold (4s)
            setPhase('hold');
            setText('Hold...');
            await new Promise(r => setTimeout(r, 4000));

            if (!isActive) return;

            // Exhale (4s)
            setPhase('exhale');
            setText('Breathe Out...');
            await new Promise(r => setTimeout(r, 4000));
        };

        const interval = setInterval(cycle, 12000); // Total cycle 12s
        cycle(); // Start immediately

        return () => clearInterval(interval);
    }, [isActive]);

    return (
        <GlassCard className="p-8 flex flex-col items-center justify-center space-y-8 relative overflow-hidden">
            <div className="text-center z-10">
                <h3 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                    <Wind className="w-5 h-5 text-teal-400" />
                    Breathing Exercise
                </h3>
                <p className="text-gray-400 text-sm mt-1">Center your thoughts</p>
            </div>

            <div className="relative w-48 h-48 flex items-center justify-center">
                {/* Outer Glow */}
                <div className={`absolute inset-0 bg-teal-500/20 rounded-full blur-xl transition-all duration-[4000ms] ease-in-out ${phase === 'inhale' ? 'scale-110 opacity-100' :
                        phase === 'hold' ? 'scale-110 opacity-80' :
                            'scale-50 opacity-50'
                    }`} />

                {/* Main Circle */}
                <div className={`w-32 h-32 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-teal-500/30 transition-all duration-[4000ms] ease-in-out z-10 ${phase === 'inhale' ? 'scale-125' :
                        phase === 'hold' ? 'scale-125' :
                            'scale-75'
                    }`}>
                    <span className="text-white font-bold text-lg animate-pulse">
                        {isActive ? text : "Start"}
                    </span>
                </div>

                {/* Ripple Effect */}
                {isActive && phase === 'exhale' && (
                    <div className="absolute inset-0 border-2 border-teal-500/30 rounded-full animate-ping" />
                )}
            </div>

            <button
                onClick={() => setIsActive(!isActive)}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${isActive
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        : 'bg-teal-500 text-white hover:bg-teal-600 shadow-lg shadow-teal-500/30'
                    }`}
            >
                {isActive ? 'Stop Exercise' : 'Start Breathing'}
            </button>
        </GlassCard>
    );
}
