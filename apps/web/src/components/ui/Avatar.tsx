'use client';
import Image from 'next/image';
import { getInitials } from '@/utils';
import { cn } from '@/utils';

interface AvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  className?: string;
}

const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-lg' };
const dotSizes = { sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3 h-3', xl: 'w-3.5 h-3.5' };

export function Avatar({ name, avatarUrl, size = 'md', isOnline, className }: AvatarProps) {
  return (
    <div className="relative flex-shrink-0 inline-flex">
      <div className={cn('rounded-full flex items-center justify-center bg-brand-500 text-white font-semibold overflow-hidden', sizes[size], className)}>
        {avatarUrl ? (
          <Image src={avatarUrl} alt={name} width={64} height={64} className="w-full h-full object-cover" />
        ) : (
          getInitials(name)
        )}
      </div>
      {isOnline && (
        <span className={cn(
          'absolute bottom-0 right-0 rounded-full bg-green-500 border-2 border-white',
          dotSizes[size],
        )} />
      )}
    </div>
  );
}
