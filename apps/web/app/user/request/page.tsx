'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { api } from '@/services/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CheckCircle, MessageSquare, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  message: z.string().max(500).optional(),
});
type FormData = z.infer<typeof schema>;

export default function UserRequestPage() {
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await api.post('/access/request', data);
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit request. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-500" size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Request Sent!</h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Your request is with the admin. Once approved, you'll receive an access code.
          </p>
          <Link
            href="/user/verify-code"
            className="block bg-gray-900 hover:bg-black text-white font-bold px-6 py-3 rounded-2xl transition-colors text-sm"
          >
            Already have a code? Enter it →
          </Link>
          <Link href="/" className="block mt-3 text-xs text-gray-400 hover:text-gray-600">← Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Brand panel */}
      <div className="hidden md:flex w-[400px] flex-shrink-0 bg-black flex-col items-center justify-center px-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-violet-500/5" />
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl mb-4 z-10">
          <MessageSquare className="text-gray-900" size={32} />
        </div>
        <h2 className="text-3xl font-black text-white z-10">Join Gossip</h2>
        <p className="text-gray-500 text-sm mt-2 z-10">An invite-only conversation platform</p>
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
              <Send className="text-blue-500" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Request Access</h1>
              <p className="text-xs text-gray-400 mt-0.5">The admin will review your request</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Full Name" {...register('name')} error={errors.name?.message} autoFocus />
            <Input label="Email Address" type="email" {...register('email')} error={errors.email?.message} />
            <Input label="Phone (optional)" type="tel" {...register('phone')} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Why do you want access? <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                {...register('message')}
                rows={3}
                placeholder="Tell us a bit about yourself…"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <Button type="submit" isLoading={isSubmitting} className="w-full">
              Submit Request
            </Button>
          </form>

          <div className="mt-5 flex items-center justify-between">
            <Link href="/" className="text-gray-400 hover:text-gray-600 text-xs">← Back</Link>
            <Link href="/user/verify-code" className="text-blue-500 hover:text-blue-600 text-xs font-medium">Have a code? →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
