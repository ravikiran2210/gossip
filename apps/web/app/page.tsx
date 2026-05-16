import Link from 'next/link';
import { MessageSquare, Users, Zap, Shield } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col overflow-hidden relative">
      {/* Subtle glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating chat bubbles */}
      <div className="absolute top-24 right-8 md:right-28 opacity-15 pointer-events-none select-none space-y-2">
        <div className="bg-gradient-to-br from-blue-500 to-violet-500 rounded-2xl rounded-tr-sm px-4 py-2 text-white text-sm font-medium shadow-lg">Hey! How are you? 👋</div>
        <div className="bg-white/10 rounded-2xl rounded-tl-sm px-4 py-2 text-white text-sm font-medium ml-8 shadow-lg">I'm great, thanks! 😊</div>
        <div className="bg-gradient-to-br from-blue-500 to-violet-500 rounded-2xl rounded-tr-sm px-4 py-2 text-white text-sm font-medium shadow-lg">Let's Gossip! 🎉</div>
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center z-10">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl">
            <MessageSquare className="text-gray-900" size={40} />
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tight">Gossip</h1>
          <p className="text-gray-400 text-lg">Your conversations, your vibe.</p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2.5 my-8">
          {[
            { icon: Shield, label: 'Private & invite-only' },
            { icon: Zap, label: 'Real-time messaging' },
            { icon: Users, label: 'Groups & direct chats' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-gray-300 text-sm font-medium">
              <Icon size={14} className="text-blue-400" />
              {label}
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <Link
            href="/user/request"
            className="flex-1 bg-white text-black font-bold px-6 py-3.5 rounded-2xl text-center hover:bg-gray-100 transition-all shadow-xl text-sm"
          >
            Request Access
          </Link>
          <Link
            href="/user/verify-code"
            className="flex-1 bg-white/10 border border-white/20 text-white font-bold px-6 py-3.5 rounded-2xl text-center hover:bg-white/15 transition-all text-sm"
          >
            Enter Code
          </Link>
        </div>

        <p className="mt-5 text-gray-600 text-xs">
          Admin?{' '}
          <Link href="/admin/login" className="text-gray-400 hover:text-white underline underline-offset-2 font-medium transition-colors">
            Sign in here
          </Link>
        </p>
      </div>

      <footer className="text-center text-gray-700 text-xs py-4 px-4 z-10">
        Gossip · Built with NestJS, Next.js &amp; Socket.IO
      </footer>
    </div>
  );
}
