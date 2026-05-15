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
import { User } from 'lucide-react';
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
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

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
      toast.success('Welcome to Messenger!');
      router.replace('/app/chats');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to set up profile');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
            <User className="text-brand-600" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Set Up Profile</h1>
            <p className="text-sm text-gray-500">Almost there — create your account</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Full Name" {...register('name')} error={errors.name?.message} autoFocus />
          <Input label="Username" {...register('username')} error={errors.username?.message} placeholder="e.g. john_doe" />
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Input label="Phone (optional)" type="tel" {...register('phone')} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio (optional)</label>
            <textarea {...register('bio')} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
          </div>
          <Input label="Password (optional)" type="password" {...register('password')} error={errors.password?.message} placeholder="Set a login password" />
          <Button type="submit" isLoading={isSubmitting} className="w-full">
            Create Account & Enter
          </Button>
        </form>
      </div>
    </div>
  );
}
