'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { fetchApi } from '@/src/shared/lib/api';
import { useClickOutside } from '@/src/shared/hooks/useClickOutside';
import type { UserSearchResult } from '@/src/shared/types/api';

interface AuthorSearchProps {
  onSelect: (result: UserSearchResult) => void;
  onCancel: () => void;
}

export function AuthorSearch({ onSelect, onCancel }: AuthorSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const closeDropdown = useCallback(() => setOpen(false), []);
  useClickOutside(containerRef, open, closeDropdown);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await fetchApi<UserSearchResult[]>(
          `/api/users/search?q=${encodeURIComponent(value.trim())}`,
        );
        setResults(data ?? []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  return (
    <div
      ref={containerRef}
      className="flex gap-2.5 py-3 px-3.5 items-start rounded-b-md"
      style={{
        border: '1px solid rgba(120,110,95,0.08)',
        borderTop: 'none',
        background: 'rgba(30,28,24,0.3)',
      }}
    >
      <div className="flex-1 relative">
        <input
          type="text"
          placeholder="Search by name, ORCID, or wallet..."
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          className="w-full py-2 px-3 rounded text-[#d4ccc0] font-serif text-xs outline-none"
          style={{
            background: 'rgba(30,28,24,0.6)',
            border: '1px solid rgba(120,110,95,0.2)',
          }}
          autoFocus
        />
        {loading && (
          <span className="absolute right-3 top-2.5 text-[10px] text-[#6a6050]">
            searching…
          </span>
        )}
        {open && results.length > 0 && (
          <div
            className="absolute left-0 right-0 mt-1 rounded overflow-hidden z-10"
            style={{
              background: 'rgba(30,28,24,0.95)',
              border: '1px solid rgba(120,110,95,0.25)',
            }}
          >
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  onSelect(r);
                  setOpen(false);
                }}
                className="w-full text-left py-2 px-3 cursor-pointer transition-colors duration-150 hover:bg-white/5"
                style={{ background: 'transparent' }}
              >
                <div className="text-[12px] text-[#d4ccc0] font-serif">
                  {r.displayName || 'Unknown'}
                  {r.orcidId && (
                    <span className="text-[10px] text-[#5a7a9a] ml-2">
                      {r.orcidId}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-[#6a6050] font-mono mt-0.5">
                  {r.walletAddress}
                </div>
              </button>
            ))}
          </div>
        )}
        {open &&
          query.trim().length >= 2 &&
          results.length === 0 &&
          !loading && (
            <div
              className="absolute left-0 right-0 mt-1 rounded py-2 px-3 text-[11px] text-[#6a6050]"
              style={{
                background: 'rgba(30,28,24,0.95)',
                border: '1px solid rgba(120,110,95,0.25)',
              }}
            >
              No users found
            </div>
          )}
      </div>
      <button
        onClick={onCancel}
        className="rounded py-2 px-3 text-[#6a6050] text-xs cursor-pointer font-serif"
        style={{
          background: 'none',
          border: '1px solid rgba(120,110,95,0.15)',
        }}
      >
        Cancel
      </button>
    </div>
  );
}
