'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { getSocket } from '@/services/socket';
import { api } from '@/services/api';
import { useChatStore } from '@/stores/chat.store';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/Button';
import EmojiPicker from 'emoji-picker-react';
import { v4 as uuidv4 } from 'uuid';
import { Paperclip, Send, Smile, X, FileText, Music, CornerUpLeft } from 'lucide-react';
import type { Message } from '@/types';
import { GifPicker } from './GifPicker';

interface MessageInputProps {
  conversationId: string;
}

interface PendingFile {
  file: File;
  previewUrl: string | null;
  type: Message['messageType'];
}

export function MessageInput({ conversationId }: MessageInputProps) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pending, setPending] = useState<PendingFile | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const { user } = useAuthStore();
  const { addMessage, replyingTo, setReplyingTo } = useChatStore();

  // Clean up the typing timeout when the component unmounts to avoid
  // calling sendTyping on an unmounted component.
  useEffect(() => {
    return () => { clearTimeout(typingTimeoutRef.current); };
  }, []);

  // Call getSocket() fresh inside the callback so it always uses the current
  // socket instance even after a reconnect (avoids stale closure).
  const sendTyping = useCallback((start: boolean) => {
    if (!user) return;
    getSocket().emit(start ? 'typing.start' : 'typing.stop', { conversationId, userName: user.name });
  }, [conversationId, user]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    sendTyping(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTyping(false), 3000);
  };

  const emitMessage = (payload: string, messageType: Message['messageType'] = 'text', mediaId?: string, fileName?: string, replyToId?: string) => {
    if (!user || !payload.trim()) return;
    const messageId = uuidv4();
    const newMsg: Message = {
      _id: messageId,
      messageId,
      conversationId,
      senderId: user._id,
      messageType,
      encryptedPayload: payload,
      mediaId,
      fileName,
      replyToId,
      createdAt: new Date().toISOString(),
      status: 'sending',
    };
    addMessage(newMsg);
    getSocket().emit('message.send', {
      messageId,
      conversationId,
      messageType,
      encryptedPayload: payload,
      mediaId,
      fileName,
      replyToId,
    });
  };

  const clearPending = () => {
    if (pending?.previewUrl) URL.revokeObjectURL(pending.previewUrl);
    setPending(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let msgType: Message['messageType'] = 'file';
    if (file.type.startsWith('image/')) msgType = file.type === 'image/gif' ? 'gif' : 'image';
    else if (file.type.startsWith('video/')) msgType = 'video';
    else if (file.type.startsWith('audio/')) msgType = 'audio';

    const previewUrl =
      file.type.startsWith('image/') || file.type.startsWith('video/')
        ? URL.createObjectURL(file)
        : null;

    setPending({ file, previewUrl, type: msgType });
    textareaRef.current?.focus();
  };

  const handleSend = async () => {
    if (!pending && !text.trim()) return;
    const replyId = replyingTo?._id;

    if (pending) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', pending.file);
        const { data } = await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        emitMessage(data.secureUrl, pending.type, data._id, pending.file.name, replyId);
        if (text.trim()) emitMessage(text.trim(), 'text', undefined, undefined, undefined);
      } catch {
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
      clearPending();
      setText('');
    } else {
      emitMessage(text.trim(), 'text', undefined, undefined, replyId);
      setText('');
    }

    setReplyingTo(null);
    sendTyping(false);
    clearTimeout(typingTimeoutRef.current);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape' && replyingTo) {
      setReplyingTo(null);
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    setText((prev) => prev + emojiData.emoji);
    setShowEmoji(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="relative bg-white border-t pb-safe flex-shrink-0">
      {/* Emoji picker */}
      {showEmoji && (
        <div className="absolute bottom-full left-0 mb-2 z-50">
          <EmojiPicker onEmojiClick={handleEmojiClick} height={350} />
        </div>
      )}

      {/* GIF picker */}
      {showGif && (
        <div className="absolute bottom-full left-0 mb-2 z-50">
          <GifPicker
            onSelect={(url) => {
              emitMessage(url, 'gif');
              setShowGif(false);
            }}
            onClose={() => setShowGif(false)}
          />
        </div>
      )}

      {/* Reply banner */}
      {replyingTo && (
        <div className="flex items-center gap-2 px-3 pt-2 pb-1 border-b bg-gray-50">
          <CornerUpLeft size={14} className="text-brand-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-brand-600 font-medium">Replying to message</p>
            <p className="text-xs text-gray-500 truncate">
              {replyingTo.messageType !== 'text'
                ? `${replyingTo.messageType}`
                : replyingTo.encryptedPayload.substring(0, 60)}
            </p>
          </div>
          <button
            type="button"
            aria-label="Cancel reply"
            onClick={() => setReplyingTo(null)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Media preview */}
      {pending && (
        <div className="px-3 pt-3 flex items-start gap-2">
          <div className="relative group">
            {pending.type === 'image' || pending.type === 'gif' ? (
              <Image
                src={pending.previewUrl!}
                alt="preview"
                width={120}
                height={90}
                className="rounded-xl object-cover border border-gray-200"
                unoptimized
              />
            ) : pending.type === 'video' ? (
              <video
                src={pending.previewUrl!}
                className="w-[120px] h-[90px] rounded-xl object-cover border border-gray-200"
                muted
              />
            ) : pending.type === 'audio' ? (
              <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
                <Music size={18} className="text-brand-500 flex-shrink-0" />
                <span className="text-xs text-gray-700 max-w-[140px] truncate">{pending.file.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
                <FileText size={18} className="text-brand-500 flex-shrink-0" />
                <span className="text-xs text-gray-700 max-w-[140px] truncate">{pending.file.name}</span>
              </div>
            )}
            <button
              type="button"
              onClick={clearPending}
              aria-label="Remove file"
              className="absolute -top-2 -right-2 bg-gray-700 hover:bg-gray-900 text-white rounded-full p-0.5 shadow"
            >
              <X size={12} />
            </button>
          </div>
          <span className="text-xs text-gray-400 mt-1">Add a caption or just hit send</span>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2 p-3">
        <button
          type="button"
          aria-label="Emoji picker"
          onClick={() => { setShowEmoji((v) => !v); setShowGif(false); }}
          className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          <Smile size={20} />
        </button>

        <button
          type="button"
          aria-label="GIF picker"
          onClick={() => { setShowGif((v) => !v); setShowEmoji(false); }}
          className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0 text-xs font-bold leading-none"
        >
          GIF
        </button>

        <button
          type="button"
          aria-label="Attach file"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          <Paperclip size={20} />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          title="Attach a file"
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={pending ? 'Add a caption… (optional)' : 'Type a message…'}
          aria-label="Message input"
          rows={1}
          className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 max-h-32 overflow-y-auto min-h-[40px]"
        />

        <Button
          type="button"
          onClick={handleSend}
          disabled={(!text.trim() && !pending) || isUploading}
          size="sm"
          className="flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 border-0"
          isLoading={isUploading}
          aria-label="Send message"
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
}
