'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { api } from '@/services/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CheckCircle, MessageSquare } from 'lucide-react';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Request Sent!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Your request has been sent to the admin. Please wait for approval.
            Once approved, you will receive an access code.
          </p>
          <p className="text-gray-400 text-xs mb-4">Already have a code?</p>
          <Link href="/user/verify-code" className="text-brand-600 font-medium hover:underline text-sm">
            Enter Access Code →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
            <MessageSquare className="text-brand-600" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Request Access</h1>
            <p className="text-sm text-gray-500">The admin will review your request</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Full Name" {...register('name')} error={errors.name?.message} autoFocus />
          <Input label="Email Address" type="email" {...register('email')} error={errors.email?.message} />
          <Input label="Phone (optional)" type="tel" {...register('phone')} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Why do you want access? (optional)</label>
            <textarea
              {...register('message')}
              rows={3}
              placeholder="Tell us a bit about yourself..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>
          <Button type="submit" isLoading={isSubmitting} className="w-full">
            Submit Request
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-700">← Back</Link>
          <Link href="/user/verify-code" className="text-brand-600 hover:underline">Have a code?</Link>
        </div>
      </div>
    </div>
  );
}
