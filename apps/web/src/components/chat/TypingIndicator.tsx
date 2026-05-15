'use client';
import React from 'react';

interface TypingIndicatorProps {
  userIds: string[];
}

export function TypingIndicator({ userIds }: TypingIndicatorProps) {
  if (!userIds.length) return null;
  return (
    <div className="flex items-center gap-2 px-3 py-1">
      <div className="bg-gray-200 rounded-full px-3 py-2 flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
      <span className="text-xs text-gray-400">
        {userIds.length === 1 ? 'typing…' : `${userIds.length} people typing…`}
      </span>
    </div>
  );
}
