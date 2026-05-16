'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { MessageSquare, Key } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({ code: z.string().min(6, 'Enter your access code') });
type FormData = z.infer<typeof schema>;

export default function VerifyCodePage() {
  const router = useRouter();
  const loginWithToken = useAuthStore((s) => s.loginWithToken);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const { token, user } = useAuthStore.getState();
    if (token && user) {
      document.cookie = 'user_session=1; path=/; max-age=2592000; SameSite=Lax';
      router.replace('/app/chats');
    }
  }, [router]);

  const onSubmit = async (data: FormData) => {
    try {
      const { data: result } = await api.post('/access/verify-code', { code: data.code.trim() });
      if (result.isNewUser === false) {
        loginWithToken(result.accessToken, result.refreshToken, result.user);
        router.push('/app/chats');
      } else {
        sessionStorage.setItem('onboardingCodeId', result.codeId);
        router.push('/user/setup-profile');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid or expired code');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Brand panel */}
      <div className="hidden md:flex w-[400px] flex-shrink-0 bg-black flex-col items-center justify-center px-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-violet-500/5" />
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl mb-4 z-10">
          <MessageSquare className="text-gray-900" size={32} />
        </div>
        <h2 className="text-3xl font-black text-white z-10">Gossip</h2>
        <p className="text-gray-500 text-sm mt-2 z-10">Connect with people who matter</p>
      </div>

      {/* Form panel */}
      <div className="flex-1 bg-white flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 w-full max-w-sm">
          <div className="flex md:hidden items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <MessageSquare className="text-gray-700" size={20} />
            </div>
            <span className="text-xl font-black text-gray-900">Gossip</span>
          </div>

          <div className="flex items-center gap-3 mb-7">
            <div className="w-11 h-11 bg-blue-50 rounded-2xl flex items-center justify-center">
              <Key className="text-blue-500" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Enter Access Code</h1>
              <p className="text-xs text-gray-400 mt-0.5">Code provided by your admin</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Access Code"
              {...register('code')}
              error={errors.code?.message}
              placeholder="e.g. ABC123XYZ789"
              autoFocus
              className="uppercase tracking-widest text-center text-lg font-mono"
            />
            <Button type="submit" isLoading={isSubmitting} className="w-full">
              Verify &amp; Enter
            </Button>
          </form>

          <div className="mt-5 flex items-center justify-between">
            <Link href="/" className="text-gray-400 hover:text-gray-600 text-xs">← Back</Link>
            <Link href="/user/request" className="text-blue-500 hover:text-blue-600 text-xs font-medium">Request access →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
