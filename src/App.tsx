import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import AudioRecorder from './components/AudioRecorder';
import Dashboard from './components/Dashboard';
import EmergencyContacts from './components/EmergencyContacts';
import { LayoutDashboard, Mic, Users, LogOut, Brain } from 'lucide-react';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
      setAuthReady(true);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
        setShowAuth(false);
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);
        </nav >

    <div className="p-4 border-t border-white/10">
      {userProfile && (
        <div className="mb-4 px-4">
          <p className="text-sm font-medium text-white">{userProfile.full_name}</p>
          <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
        </div>
      )}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        Sign Out
      </button>
    </div>
      </aside >

    {/* Mobile Header */ }
    < div className = "md:hidden fixed top-0 w-full z-20 bg-background/80 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between" >
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-indigo-500" />
          <span className="font-bold text-white">NeuroSync</span>
        </div>
        <button onClick={handleSignOut} className="text-gray-400 hover:text-white">
          <LogOut className="w-5 h-5" />
        </button>
      </div >

    {/* Main Content */ }
    < main className = "flex-1 md:ml-64 min-h-screen relative" >
      {/* Background Gradients */ }
      < div className = "absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none" >
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-purple-500/10 rounded-full blur-[150px]" />
        </div >

    <div className="p-6 md:p-12 pt-20 md:pt-12 max-w-7xl mx-auto">
      {activeTab === 'dashboard' && <Dashboard userId={session.user.id} />}
      {activeTab === 'record' && (
        <AudioRecorder userId={session.user.id} userProfile={userProfile} />
      )}
      {activeTab === 'contacts' && <EmergencyContacts userId={session.user.id} />}
    </div>
      </main >

    {/* Mobile Bottom Nav */ }
    < div className = "md:hidden fixed bottom-0 w-full bg-background/80 backdrop-blur-md border-t border-white/10 flex justify-around p-4 z-20" >
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-indigo-400' : 'text-gray-500'}`}
        >
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px]">Home</span>
        </button>
        <button
          onClick={() => setActiveTab('record')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'record' ? 'text-indigo-400' : 'text-gray-500'}`}
        >
          <Mic className="w-6 h-6" />
          <span className="text-[10px]">Record</span>
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'contacts' ? 'text-indigo-400' : 'text-gray-500'}`}
        >
          <Users className="w-6 h-6" />
          <span className="text-[10px]">Contacts</span>
        </button>
      </div >
    </div >
  );
}

export default App;