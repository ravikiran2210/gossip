import Link from 'next/link';
import { MessageSquare, Users, Zap, Shield } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-700 to-brand-400 flex flex-col overflow-hidden relative">
      {/* Decorative blobs */}
      <div className="absolute top-[-80px] right-[-80px] w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-60px] left-[-60px] w-56 h-56 bg-brand-300/20 rounded-full blur-2xl pointer-events-none" />

      {/* Floating chat bubbles decoration */}
      <div className="absolute top-20 right-8 md:right-24 opacity-20 pointer-events-none select-none">
        <div className="bg-white rounded-2xl rounded-tr-sm px-4 py-2 text-brand-900 text-sm font-medium mb-2 shadow-lg">Hey! How are you? 👋</div>
        <div className="bg-brand-300 rounded-2xl rounded-tl-sm px-4 py-2 text-white text-sm font-medium ml-8 shadow-lg">I'm great, thanks! 😊</div>
        <div className="bg-white rounded-2xl rounded-tr-sm px-4 py-2 text-brand-900 text-sm font-medium mt-2 shadow-lg">Let's Gossip! 🎉</div>
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center z-10">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl shadow-brand-900/40">
            <MessageSquare className="text-brand-500" size={40} />
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tight mt-2">Gossip</h1>
          <p className="text-brand-100 text-lg font-medium">Your conversations, your vibe.</p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2.5 my-8">
          {[
            { icon: Shield, label: 'Private & invite-only' },
            { icon: Zap, label: 'Real-time messaging' },
            { icon: Users, label: 'Groups & direct chats' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-white text-sm font-medium">
              <Icon size={14} className="text-brand-200" />
              {label}
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <Link
            href="/user/request"
            className="flex-1 bg-white text-brand-600 font-bold px-6 py-3.5 rounded-2xl text-center hover:bg-brand-50 transition-all shadow-xl shadow-brand-900/30 text-sm"
          >
            Request Access
          </Link>
          <Link
            href="/user/verify-code"
            className="flex-1 bg-white/15 backdrop-blur-sm border border-white/30 text-white font-bold px-6 py-3.5 rounded-2xl text-center hover:bg-white/25 transition-all text-sm"
          >
            Enter Code
          </Link>
        </div>

        <p className="mt-5 text-brand-200 text-xs">
          Admin?{' '}
          <Link href="/admin/login" className="text-white underline underline-offset-2 font-medium">
            Sign in here
          </Link>
        </p>
      </div>

      <footer className="text-center text-brand-200/60 text-xs py-4 px-4 z-10">
        Gossip · Built with NestJS, Next.js &amp; Socket.IO
      </footer>
    </div>
  );
}
