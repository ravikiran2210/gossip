'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

interface GifItem {
  id: string;
  title: string;
  originalUrl: string;
  previewUrl: string;
}

interface GifPickerProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

const API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY;

export function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState<GifItem[]>([]);
  const [loading, setLoading] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchGifs = useCallback(async (q: string) => {
    if (!API_KEY) return;
    setLoading(true);
    try {
      const base = 'https://api.giphy.com/v1/gifs';
      const url = q.trim()
        ? `${base}/search?api_key=${API_KEY}&q=${encodeURIComponent(q)}&limit=24&rating=g`
        : `${base}/trending?api_key=${API_KEY}&limit=24&rating=g`;
      const res = await fetch(url);
      const json = await res.json();
      setGifs(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (json.data as any[]).map((g) => ({
          id: g.id,
          title: g.title,
          originalUrl: g.images.original.url,
          previewUrl: g.images.fixed_height_small.url,
        })),
      );
    } catch {
      setGifs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGifs('');
    inputRef.current?.focus();
  }, [fetchGifs]);

  const handleSearch = (value: string) => {
    setQuery(value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchGifs(value), 400);
  };

  if (!API_KEY) {
    return (
      <div className="w-80 bg-white rounded-2xl shadow-xl border p-6 flex flex-col items-center justify-center gap-2">
        <p className="text-sm text-gray-500 text-center">
          Add <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">NEXT_PUBLIC_GIPHY_API_KEY</code> to your{' '}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">.env.local</code> to enable GIFs.
        </p>
        <a
          href="https://developers.giphy.com/dashboard/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-brand-600 underline"
        >
          Get a free Giphy API key →
        </a>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white rounded-2xl shadow-xl border overflow-hidden flex flex-col">
      {/* Search header */}
      <div className="p-2 border-b flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search GIFs…"
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <button
          type="button"
          aria-label="Close GIF picker"
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-lg flex-shrink-0"
        >
          <X size={15} className="text-gray-500" />
        </button>
      </div>

      {/* GIF grid */}
      <div className="h-64 overflow-y-auto p-1.5">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={22} className="animate-spin text-brand-500" />
          </div>
        ) : gifs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No GIFs found
          </div>
        ) : (
          <div className="columns-3 gap-1 space-y-1">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                type="button"
                aria-label={gif.title || 'GIF'}
                onClick={() => { onSelect(gif.originalUrl); onClose(); }}
                className="w-full block rounded-lg overflow-hidden hover:opacity-75 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={gif.previewUrl}
                  alt={gif.title}
                  className="w-full h-auto"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Giphy attribution — required by Giphy API terms */}
      <div className="px-3 py-1 border-t bg-gray-50 flex justify-end">
        <span className="text-[10px] text-gray-400 font-medium tracking-wide">Powered by GIPHY</span>
      </div>
    </div>
  );
}
