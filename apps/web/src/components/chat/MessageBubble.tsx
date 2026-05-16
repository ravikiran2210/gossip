'use client';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { formatMessageTime } from '@/utils';
import { cn } from '@/utils';
import type { Message, MessageReaction, ReplyPreview } from '@/types';
import { Check, CheckCheck, Clock, Download, FileText, Loader2, Reply, Trash2, Smile, CornerUpLeft } from 'lucide-react';

// Cross-origin URLs ignore the `download` attribute — fetch as blob first
async function downloadWithName(url: string, fileName: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    // Always revoke the object URL even if the download triggers an error
    URL.revokeObjectURL(blobUrl);
  }
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  senderName?: string;
  currentUserId?: string;
  onReply?: (msg: Message) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onDelete?: (messageId: string, forEveryone: boolean) => void;
}

function StatusIcon({ status }: { status?: string }) {
  if (status === 'sending') return <Clock size={11} className="opacity-60" />;
  if (status === 'delivered') return <CheckCheck size={11} className="opacity-70" />;
  if (status === 'read') return <CheckCheck size={11} className="text-sky-300" />;
  return <Check size={11} className="opacity-60" />;
}

function ReactionBar({ reactions, currentUserId }: { reactions: MessageReaction[]; currentUserId?: string }) {
  if (!reactions || reactions.length === 0) return null;

  // Group by emoji
  const grouped: Record<string, { count: number; mine: boolean }> = {};
  for (const r of reactions) {
    if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, mine: false };
    grouped[r.emoji].count++;
    if (r.userId === currentUserId) grouped[r.emoji].mine = true;
  }

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(grouped).map(([emoji, { count, mine }]) => (
        <span
          key={emoji}
          className={cn(
            'inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full border',
            mine
              ? 'bg-brand-50 border-brand-300 text-brand-700'
              : 'bg-gray-100 border-gray-200 text-gray-700',
          )}
        >
          {emoji}
          {count > 1 && <span>{count}</span>}
        </span>
      ))}
    </div>
  );
}

function ReplyQuote({ replyTo, isMine }: { replyTo: ReplyPreview; isMine: boolean }) {
  const preview =
    replyTo.messageType === 'image' ? '📷 Photo'
    : replyTo.messageType === 'video' ? '🎥 Video'
    : replyTo.messageType === 'audio' ? '🎵 Audio'
    : replyTo.messageType === 'gif' ? '🎞 GIF'
    : replyTo.messageType === 'file' ? `📎 ${replyTo.fileName || 'File'}`
    : replyTo.encryptedPayload?.substring(0, 60) || '';

  return (
    <div className={cn(
      'text-xs px-2 py-1 mb-1 rounded border-l-2 opacity-80',
      isMine
        ? 'bg-white/20 border-white/40 text-white'
        : 'bg-gray-50 dark:bg-[#2a2a2a] border-blue-400 text-gray-600 dark:text-gray-300',
    )}>
      <CornerUpLeft size={10} className="inline mr-1 opacity-60" />
      <span className="truncate">{preview}</span>
    </div>
  );
}

export function MessageBubble({
  message,
  isMine,
  senderName,
  currentUserId,
  onReply,
  onReact,
  onDelete,
}: MessageBubbleProps) {
  const [downloading, setDownloading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReactPicker, setShowReactPicker] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu && !showReactPicker) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowReactPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu, showReactPicker]);

  const handleDownload = async () => {
    if (!message.fileName) {
      window.open(message.encryptedPayload, '_blank');
      return;
    }
    setDownloading(true);
    try {
      await downloadWithName(message.encryptedPayload, message.fileName);
    } finally {
      setDownloading(false);
    }
  };

  const replyTo =
    message.replyToId && typeof message.replyToId === 'object'
      ? (message.replyToId as ReplyPreview)
      : null;

  if (message.messageType === 'system') {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {message.encryptedPayload}
        </span>
      </div>
    );
  }

  if (message.deletedForEveryone) {
    return (
      <div className={cn('flex mb-1', isMine ? 'justify-end' : 'justify-start')}>
        <div className={cn(
          'px-3 py-1.5 rounded-2xl italic text-xs opacity-50 border',
          isMine ? 'border-white/20 text-white bg-white/10' : 'border-gray-200 text-gray-400 bg-gray-50',
        )}>
          🚫 This message was deleted
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (message.messageType) {
      case 'image':
        return (
          <div className="max-w-[240px]">
            <Image
              src={message.encryptedPayload}
              alt="Image"
              width={240}
              height={180}
              className="rounded-lg object-cover cursor-pointer"
            />
          </div>
        );
      case 'video':
        return (
          <video controls className="max-w-[240px] rounded-lg">
            <source src={message.encryptedPayload} />
          </video>
        );
      case 'audio':
        return (
          <div className="flex flex-col gap-1">
            {message.fileName && (
              <span className="text-xs opacity-70 truncate max-w-[220px]">🎵 {message.fileName}</span>
            )}
            <audio controls className="max-w-[240px]">
              <source src={message.encryptedPayload} />
            </audio>
          </div>
        );
      case 'file':
        return (
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity text-left"
          >
            {downloading
              ? <Loader2 size={16} className="animate-spin flex-shrink-0" />
              : <FileText size={16} className="flex-shrink-0" />
            }
            <span className="truncate max-w-[200px]">{message.fileName || 'Download file'}</span>
            {!downloading && <Download size={14} className="flex-shrink-0 opacity-60" />}
          </button>
        );
      case 'gif':
        return (
          <Image src={message.encryptedPayload} alt="GIF" width={240} height={180} className="rounded-lg" unoptimized />
        );
      default:
        return <span className="text-sm whitespace-pre-wrap break-words">{message.encryptedPayload}</span>;
    }
  };

  return (
    <div className={cn('flex mb-2', isMine ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[75%] group relative')} ref={menuRef}>
        {!isMine && senderName && (
          <p className="text-xs font-semibold mb-1 ml-1 text-brand-500">{senderName}</p>
        )}

        {/* Hover action bar */}
        <div className={cn(
          'absolute top-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10',
          isMine ? '-left-20' : '-right-20',
        )}>
          {onReply && (
            <button
              type="button"
              aria-label="Reply"
              onClick={() => onReply(message)}
              className="p-1 rounded-full bg-white shadow border border-gray-100 text-gray-500 hover:text-brand-500"
            >
              <Reply size={13} />
            </button>
          )}
          {onReact && (
            <button
              type="button"
              aria-label="React"
              onClick={() => setShowReactPicker((v) => !v)}
              className="p-1 rounded-full bg-white shadow border border-gray-100 text-gray-500 hover:text-brand-500"
            >
              <Smile size={13} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              aria-label="Delete"
              onClick={() => setShowMenu((v) => !v)}
              className="p-1 rounded-full bg-white shadow border border-gray-100 text-gray-500 hover:text-red-500"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>

        {/* Quick react picker */}
        {showReactPicker && onReact && (
          <div className={cn(
            'absolute top-8 flex gap-1 bg-white rounded-full shadow-lg border border-gray-100 px-2 py-1 z-20',
            isMine ? 'right-0' : 'left-0',
          )}>
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                aria-label={`React ${emoji}`}
                onClick={() => { onReact(message._id, emoji); setShowReactPicker(false); }}
                className="text-lg hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Delete context menu */}
        {showMenu && onDelete && (
          <div className={cn(
            'absolute top-8 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 min-w-[160px]',
            isMine ? 'right-0' : 'left-0',
          )}>
            {isMine && (
              <button
                type="button"
                onClick={() => { onDelete(message._id, true); setShowMenu(false); }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 size={14} /> Delete for everyone
              </button>
            )}
            <button
              type="button"
              onClick={() => { onDelete(message._id, false); setShowMenu(false); }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Trash2 size={14} /> Delete for me
            </button>
          </div>
        )}

        {/* Bubble */}
        <div className={cn(
          'px-3 py-2 rounded-2xl',
          isMine
            ? 'bg-gradient-to-br from-blue-500 to-violet-500 text-white rounded-br-sm'
            : 'bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-gray-100 rounded-bl-sm shadow-sm border border-gray-100 dark:border-[#2a2a2a]',
        )}>
          {replyTo && <ReplyQuote replyTo={replyTo} isMine={isMine} />}
          {renderContent()}
        </div>

        {/* Reactions */}
        <ReactionBar reactions={message.reactions || []} currentUserId={currentUserId} />

        {/* Timestamp + status */}
        <div className={cn('flex items-center gap-1 mt-0.5 px-1', isMine ? 'justify-end' : 'justify-start')}>
          <span className="text-xs text-gray-400">{formatMessageTime(message.createdAt)}</span>
          {isMine && <StatusIcon status={message.status} />}
        </div>
      </div>
    </div>
  );
}
