'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/services/api';
import { AppLayout } from '@/components/layout/AppLayout';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Camera, Check } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, updateUser } = useAuthStore();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user && !token) { router.replace('/user/verify-code'); return; }
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
    }
  }, [user, token]);

  if (!user) return null;

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      const { data } = await api.patch('/users/me', { name: name.trim(), bio });
      updateUser({ name: data.name, bio: data.bio });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data: mediaData } = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { data } = await api.patch('/users/me', { avatarUrl: mediaData.secureUrl });
      updateUser({ avatarUrl: data.avatarUrl });
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col bg-gray-50 p-6">
        <div className="max-w-md mx-auto w-full">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Edit Profile</h1>

          <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-5">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Avatar name={user.name} avatarUrl={user.avatarUrl} size="xl" />
                <button
                  type="button"
                  aria-label="Change avatar"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-0 right-0 bg-brand-500 text-white rounded-full p-1.5 shadow hover:bg-brand-600 transition-colors"
                >
                  {isUploadingAvatar
                    ? <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin block" />
                    : <Camera size={13} />
                  }
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                title="Upload avatar"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarSelect}
              />
              <p className="text-xs text-gray-400">Click camera to change photo</p>
            </div>

            {/* Read-only info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-400 mb-0.5">Username</p>
                <p className="font-medium text-gray-700">@{user.username}</p>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-400 mb-0.5">Email</p>
                <p className="font-medium text-gray-700 truncate">{user.email}</p>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="profile-name">
                Display name
              </label>
              <input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="profile-bio">
                Bio <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="profile-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={300}
                rows={3}
                placeholder="A short bio about yourself…"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
              <p className="text-xs text-gray-400 text-right mt-0.5">{bio.length}/300</p>
            </div>

            <Button
              onClick={handleSave}
              isLoading={isSaving}
              disabled={!name.trim() || isSaving}
              className="w-full"
            >
              {saved ? <><Check size={16} className="mr-1.5" /> Saved!</> : 'Save changes'}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
