'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Key } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({ code: z.string().min(6, 'Enter your access code') });
type FormData = z.infer<typeof schema>;

export default function VerifyCodePage() {
  const router = useRouter();
  const loginWithToken = useAuthStore((s) => s.loginWithToken);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const { data: result } = await api.post('/access/verify-code', { code: data.code.trim() });

      if (result.isNewUser === false) {
        // Returning user — code already bound to their account, log them in directly
        loginWithToken(result.accessToken, result.refreshToken, result.user);
        router.push('/app/chats');
      } else {
        // New user — store codeId and proceed to profile setup
        sessionStorage.setItem('onboardingCodeId', result.codeId);
        router.push('/user/setup-profile');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid or expired code');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
            <Key className="text-brand-600" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Enter Access Code</h1>
            <p className="text-sm text-gray-500">Enter the code provided by the admin</p>
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
            Verify Code
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-700">← Back</Link>
          <Link href="/user/request" className="text-brand-600 hover:underline">Request access</Link>
        </div>
      </div>
    </div>
  );
}
