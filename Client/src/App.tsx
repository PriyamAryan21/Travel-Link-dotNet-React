import { Plane, Compass, Sparkles } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Header Badge */}
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-400 text-sm font-semibold mb-6 animate-pulse">
        <Sparkles className="w-4 h-4" />
        TravelLink Client Initialized
      </div>

      {/* Main Glassmorphic Card */}
      <div className="glass-card max-w-md w-full p-8 rounded-2xl text-center relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-full blur-2xl opacity-20 -mr-6 -mt-6 transition-all duration-500 group-hover:scale-125" />
        
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-slate-800/80 border border-slate-700 text-sky-400">
            <Plane className="w-8 h-8 animate-bounce" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-gradient mb-3">
          TravelLink
        </h1>
        
        <p className="text-slate-400 mb-6 leading-relaxed">
          Your ultimate collaborative group trip planning application. Smart itineraries, shared expense splitting, and real-time location sharing.
        </p>

        <div className="flex items-center justify-center gap-2 text-slate-500 text-xs border-t border-slate-800/80 pt-6">
          <Compass className="w-4 h-4" />
          Tailwind CSS & Outfit font verified!
        </div>
      </div>
    </div>
  );
}

export default App;
