import { useState } from 'react';
import { supabase } from '../lib/supabase';
import GlassCard from './ui/GlassCard';
import GradientButton from './ui/GradientButton';
import Input from './ui/Input';
import { Mail, Lock, User, Phone, ArrowRight } from 'lucide-react';

interface AuthProps {
  onSuccess?: () => void;
}

export default function Auth({ onSuccess }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Format WhatsApp number
      let whatsappNumber = phone.trim();
      if (!whatsappNumber.startsWith('+')) {
        whatsappNumber = '+' + whatsappNumber;
      }
      whatsappNumber = 'whatsapp:' + whatsappNumber;

      const { data: _data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            whatsapp_number: whatsappNumber,
          },
        },
      });

      if (error) throw error;

      alert('Sign up successful! Please check your email to verify your account.');
      if (onSuccess) onSuccess();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: _data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/30 rounded-full blur-[100px] animate-pulse-glow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500/30 rounded-full blur-[100px] animate-pulse-glow delay-1000" />
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Hero Text */}
        <div className="hidden lg:block space-y-6 text-white p-8">
          <h1 className="text-5xl font-bold leading-tight">
            Unlock Your <br />
            <span className="text-gradient">Mental Potential</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-md">
            Experience the future of mental wellness with NeuroSync.
            Advanced AI-powered tracking, personalized insights, and a
            community that cares.
          </p>

          <div className="flex gap-4 pt-4">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-gray-800 flex items-center justify-center text-xs">
                  User
                </div>
              ))}
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-bold">10k+ Users</span>
              <span className="text-xs text-gray-400">Trust NeuroSync</span>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Card */}
        <GlassCard className="w-full max-w-md mx-auto relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-400 text-sm">
              {isSignUp ? 'Join the community today' : 'Enter your details to access your account'}
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 py-3 rounded-lg font-medium hover:bg-gray-100 transition-all duration-300"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0F172A] px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
              {isSignUp && (
                <>
                  <Input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                    icon={<User className="w-4 h-4" />}
                  />

                  <div>
                    <Input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="WhatsApp Number (+92...)"
                      icon={<Phone className="w-4 h-4" />}
                    />
                    <p className="text-xs text-gray-500 mt-1 ml-1">
                      Include country code (e.g., +92)
                    </p>
                  </div>
                </>
              )}

              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                icon={<Mail className="w-4 h-4" />}
              />

              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                minLength={6}
                icon={<Lock className="w-4 h-4" />}
              />

              <GradientButton
                type="submit"
                isLoading={loading}
                className="w-full"
              >
                {isSignUp ? 'Create Account' : 'Sign In'} <ArrowRight className="ml-2 w-4 h-4" />
              </GradientButton>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
