'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { MessageSquare, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(2),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, underscores'),
  email: z.string().email(),
  phone: z.string().optional(),
  bio: z.string().max(300).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;

export default function SetupProfilePage() {
  const router = useRouter();
  const { loginWithToken } = useAuthStore();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const codeId = sessionStorage.getItem('onboardingCodeId');
    if (!codeId) {
      toast.error('No valid access code found. Please verify your code first.');
      router.replace('/user/verify-code');
    }
  }, [router]);

  const onSubmit = async (data: FormData) => {
    const codeId = sessionStorage.getItem('onboardingCodeId');
    if (!codeId) { router.replace('/user/verify-code'); return; }
    try {
      const { data: result } = await api.post('/access/setup-profile', {
        ...data,
        codeId,
        password: data.password || undefined,
      });
      sessionStorage.removeItem('onboardingCodeId');
      loginWithToken(result.accessToken, result.refreshToken, result.user);
      toast.success('Welcome to Gossip! 🎉');
      router.replace('/app/chats');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to set up profile');
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
        <h2 className="text-3xl font-black text-white z-10">Almost there!</h2>
        <p className="text-gray-500 text-sm mt-2 z-10">Set up your Gossip identity</p>
      </div>

      {/* Form panel */}
      <div className="flex-1 bg-white flex items-center justify-center p-6 overflow-y-auto">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 w-full max-w-sm">
          <div className="flex md:hidden items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <MessageSquare className="text-gray-700" size={20} />
            </div>
            <span className="text-xl font-black text-gray-900">Gossip</span>
          </div>

          <div className="flex items-center gap-3 mb-7">
            <div className="w-11 h-11 bg-blue-50 rounded-2xl flex items-center justify-center">
              <Sparkles className="text-blue-500" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Set Up Profile</h1>
              <p className="text-xs text-gray-400 mt-0.5">Create your Gossip identity</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Full Name" {...register('name')} error={errors.name?.message} autoFocus />
            <Input label="Username" {...register('username')} error={errors.username?.message} placeholder="e.g. john_doe" />
            <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
            <Input label="Phone (optional)" type="tel" {...register('phone')} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                {...register('bio')}
                rows={2}
                placeholder="Tell people about yourself…"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <Input label="Password (optional)" type="password" {...register('password')} error={errors.password?.message} placeholder="Set a login password" />
            <Button type="submit" isLoading={isSubmitting} className="w-full">
              Create Account &amp; Enter Gossip
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
