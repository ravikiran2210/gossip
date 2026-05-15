import Link from 'next/link';
import { Shield, Users, MessageSquare, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
            <MessageSquare className="text-white" size={32} />
          </div>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          Secure Messenger
        </h1>
        <p className="text-lg text-blue-100 max-w-md mb-12">
          A private, admin-gated realtime messaging platform. Request access to join.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {[
            { icon: Shield, label: 'Admin-gated access' },
            { icon: Zap, label: 'Realtime messaging' },
            { icon: Users, label: 'Group chats' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-2 text-white text-sm">
              <Icon size={14} />
              {label}
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <Link
            href="/user/request"
            className="flex-1 bg-white text-brand-700 font-semibold px-8 py-4 rounded-xl text-center hover:bg-blue-50 transition-colors shadow-lg"
          >
            Request Access
          </Link>
          <Link
            href="/admin/login"
            className="flex-1 bg-white/15 backdrop-blur border border-white/30 text-white font-semibold px-8 py-4 rounded-xl text-center hover:bg-white/25 transition-colors"
          >
            Admin Login
          </Link>
        </div>

        <p className="mt-6 text-blue-200 text-sm">
          Already have an access code?{' '}
          <Link href="/user/verify-code" className="text-white underline font-medium">
            Verify code
          </Link>
        </p>
      </div>

      <footer className="text-center text-blue-200 text-xs py-4 px-4">
        Powered by NestJS · Next.js · MongoDB · Socket.IO · Cloudinary
      </footer>
    </div>
  );
}
