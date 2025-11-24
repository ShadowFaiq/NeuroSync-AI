import { ArrowRight, Brain, Shield, Activity, Users } from 'lucide-react';
import GradientButton from './ui/GradientButton';
import GlassCard from './ui/GlassCard';

interface LandingPageProps {
    onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse-glow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-500/20 rounded-full blur-[120px] animate-pulse-glow delay-1000" />
            </div>

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-background/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            NeuroSync
                        </span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
                        <a href="#about" className="text-sm text-gray-400 hover:text-white transition-colors">About</a>
                        <a href="#testimonials" className="text-sm text-gray-400 hover:text-white transition-colors">Stories</a>
                        <GradientButton size="sm" onClick={onGetStarted}>
                            Get Started
                        </GradientButton>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-in">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm text-gray-300">AI-Powered Mental Health Tracking</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight animate-fade-in delay-100">
                        Master Your <br />
                        <span className="text-gradient">Mental Wellness</span>
                    </h1>

                    <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 animate-fade-in delay-200">
                        Your personal AI companion for mental clarity. Track moods, analyze patterns,
                        and get personalized insights to improve your daily life.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in delay-300">
                        <GradientButton size="lg" onClick={onGetStarted} className="w-full sm:w-auto">
                            Start Your Journey <ArrowRight className="ml-2 w-5 h-5" />
                        </GradientButton>
                        <button className="px-8 py-4 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-white font-medium w-full sm:w-auto">
                            Watch Demo
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-20 px-6 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <GlassCard className="hover:translate-y-[-5px] transition-transform">
                            <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-6">
                                <Activity className="w-6 h-6 text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Smart Tracking</h3>
                            <p className="text-gray-400">
                                Advanced algorithms analyze your voice and text to track emotional patterns over time.
                            </p>
                        </GlassCard>

                        <GlassCard className="hover:translate-y-[-5px] transition-transform">
                            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-6">
                                <Shield className="w-6 h-6 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Private & Secure</h3>
                            <p className="text-gray-400">
                                Your data is encrypted and processed locally whenever possible. Your privacy is our priority.
                            </p>
                        </GlassCard>

                        <GlassCard className="hover:translate-y-[-5px] transition-transform">
                            <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center mb-6">
                                <Users className="w-6 h-6 text-pink-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Community Support</h3>
                            <p className="text-gray-400">
                                Connect with others on similar journeys or keep your progress completely private.
                            </p>
                        </GlassCard>
                    </div>
                </div>
            </section>
        </div>
    );
}
