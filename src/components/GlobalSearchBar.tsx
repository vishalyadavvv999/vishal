import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Search, UserCheck, X } from 'lucide-react';
import type { AuthorProfile, Book, CurrencyCode } from '../types';
import { formatPrice } from '../lib/currency';
import { useLanguage } from '../lib/i18n';
import { BookCoverImage } from './BookCoverImage';

interface GlobalSearchBarProps {
  books: Book[];
  authors: AuthorProfile[];
  currency: CurrencyCode;
  variant: 'desktop' | 'mobile';
  onSelectBook: (book: Book) => void;
  onSelectAuthor: (authorSlug: string) => void;
  onSubmitSearch: (query: string) => void;
  onAfterNavigate?: () => void;
}

function renderHighlightedText(text: string, query: string) {
  const q = query.trim();
  if (!q) return text;
  const lowerText = text.toLowerCase();
  const lowerQ = q.toLowerCase();
  const matchIdx = lowerText.indexOf(lowerQ);
  if (matchIdx === -1) return text;

  const before = text.slice(0, matchIdx);
  const match = text.slice(matchIdx, matchIdx + q.length);
  const after = text.slice(matchIdx + q.length);

  return (
    <>
      {before}
      <mark className="bg-[#DFC166]/40 text-[#0B192C] font-semibold rounded-xs px-0.5">
        {match}
      </mark>
      {after}
    </>
  );
}

function scoreBookMatch(book: Book, qLower: string): number {
  const title = book.title.toLowerCase();
  const author = book.author.toLowerCase();
  const isbn = book.isbn.toLowerCase();
  const category = (book.category_name || '').toLowerCase();
  const language = (book.language || '').toLowerCase();
  const desc = (book.description || '').toLowerCase();

  let score = 0;
  if (title.startsWith(qLower)) score += 120;
  else if (title.includes(qLower)) score += 90;

  if (isbn.replace(/[-\s]/g, '').includes(qLower.replace(/[-\s]/g, '')) || isbn.includes(qLower)) {
    score += 100;
  }

  if (author.startsWith(qLower)) score += 80;
  else if (author.includes(qLower)) score += 60;

  if (category.includes(qLower)) score += 40;
  if (language.includes(qLower)) score += 25;
  if (desc.includes(qLower)) score += 15;

  return score;
}

export function GlobalSearchBar({
  books,
  authors,
  currency,
  variant,
  onSelectBook,
  onSelectAuthor,
  onSubmitSearch,
  onAfterNavigate,
}: GlobalSearchBarProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const trimmedQuery = query.trim();
  const qLower = trimmedQuery.toLowerCase();

  const matchedBooks = useMemo(() => {
    if (!qLower) return [];
    const scored: Array<{ book: Book; score: number }> = [];
    for (const book of books) {
      const score = scoreBookMatch(book, qLower);
      if (score > 0) {
        scored.push({ book, score });
      }
    }
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return Number(b.book.is_featured) - Number(a.book.is_featured);
    });
    return scored.map((entry) => entry.book);
  }, [books, qLower]);

  const matchedAuthors = useMemo(() => {
    if (!qLower) return [];
    return authors
      .filter((auth) => {
        const subjects = (auth.subjects || []).join(' ').toLowerCase();
        return (
          auth.name.toLowerCase().includes(qLower) ||
          (auth.credentials || '').toLowerCase().includes(qLower) ||
          (auth.affiliation || '').toLowerCase().includes(qLower) ||
          subjects.includes(qLower)
        );
      })
      .slice(0, 3);
  }, [authors, qLower]);

  const visibleBooks = useMemo(() => matchedBooks.slice(0, 6), [matchedBooks]);

  type ResultOption =
    | { type: 'book'; book: Book }
    | { type: 'author'; author: AuthorProfile }
    | { type: 'catalog' };

  const navigableOptions = useMemo<ResultOption[]>(() => {
    if (!trimmedQuery) return [];
    const list: ResultOption[] = [];
    for (const book of visibleBooks) {
      list.push({ type: 'book', book });
    }
    for (const author of matchedAuthors) {
      list.push({ type: 'author', author });
    }
    if (matchedBooks.length > 0) {
      list.push({ type: 'catalog' });
    }
    return list;
  }, [trimmedQuery, visibleBooks, matchedAuthors, matchedBooks.length]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Desktop keyboard shortcut: Ctrl/Cmd+K focuses the desktop search bar
  useEffect(() => {
    if (variant !== 'desktop') return;
    const handleGlobalShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        if (trimmedQuery) setOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalShortcut);
    return () => window.removeEventListener('keydown', handleGlobalShortcut);
  }, [variant, trimmedQuery]);

  const showDropdown = open && trimmedQuery.length > 0;

  const activateOption = (option: ResultOption) => {
    setOpen(false);
    setActiveIndex(-1);
    onAfterNavigate?.();
    if (option.type === 'book') {
      onSelectBook(option.book);
    } else if (option.type === 'author') {
      onSelectAuthor(option.author.slug);
    } else {
      onSubmitSearch(trimmedQuery);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (showDropdown) {
        e.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
      } else if (query) {
        e.preventDefault();
        setQuery('');
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      if (!trimmedQuery) return;
      e.preventDefault();
      if (!open) setOpen(true);
      if (navigableOptions.length > 0) {
        setActiveIndex((prev) => (prev + 1) % navigableOptions.length);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      if (!trimmedQuery || navigableOptions.length === 0) return;
      e.preventDefault();
      setOpen(true);
      setActiveIndex((prev) => (prev <= 0 ? navigableOptions.length - 1 : prev - 1));
      return;
    }

    if (e.key === 'Enter') {
      if (!trimmedQuery) return;
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < navigableOptions.length) {
        activateOption(navigableOptions[activeIndex]);
      } else {
        setOpen(false);
        setActiveIndex(-1);
        onAfterNavigate?.();
        onSubmitSearch(trimmedQuery);
      }
    }
  };

  const activeDescendantId =
    showDropdown && activeIndex >= 0 && activeIndex < navigableOptions.length
      ? `${listboxId}-opt-${activeIndex}`
      : undefined;

  return (
    <div
      ref={containerRef}
      className={variant === 'desktop' ? 'relative w-44 xl:w-64' : 'relative w-full'}
    >
      <div className="relative flex items-center">
        <Search
          className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-label={t('headerSearchLabel')}
          aria-expanded={showDropdown}
          aria-controls={showDropdown ? listboxId : undefined}
          aria-activedescendant={activeDescendantId}
          aria-autocomplete="list"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => {
            if (trimmedQuery) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={t('headerSearchPlaceholder')}
          className={`w-full pl-9 ${
            query ? 'pr-8' : 'pr-3'
          } py-1.5 text-sm bg-white border border-slate-300 rounded-md text-[#0B192C] placeholder:text-slate-400 focus:border-[#0B192C] focus:ring-1 focus:ring-[#0B192C] focus:outline-none transition-colors`}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setOpen(false);
              setActiveIndex(-1);
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#0B192C] rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          id={listboxId}
          role="listbox"
          className={`absolute z-50 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden ${
            variant === 'desktop' ? 'right-0 w-[380px] max-w-[90vw]' : 'left-0 right-0 w-full'
          }`}
        >
          <div className="max-h-[70vh] overflow-y-auto divide-y divide-slate-100">
            {visibleBooks.length === 0 && matchedAuthors.length === 0 ? (
              <div className="px-4 py-6 text-center space-y-2">
                <BookOpen className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="text-sm font-medium text-[#0B192C]">
                  {t('headerSearchNoResults')}
                </p>
                <p className="text-xs text-slate-500">
                  “{trimmedQuery}”
                </p>
              </div>
            ) : (
              <>
                {visibleBooks.length > 0 && (
                  <div className="py-1.5">
                    <div className="px-3.5 py-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/70">
                      <span>{t('headerSearchBooks')}</span>
                      <span className="font-mono tabular-nums text-slate-600">
                        {matchedBooks.length}
                      </span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {visibleBooks.map((book, idx) => {
                        const isHighlighted = activeIndex === idx;
                        const isAvailable = book.is_available && book.stock_quantity > 0;
                        return (
                          <button
                            key={book.id}
                            id={`${listboxId}-opt-${idx}`}
                            role="option"
                            aria-selected={isHighlighted}
                            type="button"
                            onMouseEnter={() => setActiveIndex(idx)}
                            onClick={() => activateOption({ type: 'book', book })}
                            className={`w-full px-3.5 py-2.5 flex items-center gap-3 text-left transition-colors cursor-pointer ${
                              isHighlighted ? 'bg-[#0B192C]/5' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="w-10 aspect-[3/4] rounded overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                              <BookCoverImage src={book.cover_url} title={book.title} />
                            </div>
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <p className="text-sm font-semibold text-[#0B192C] truncate">
                                {renderHighlightedText(book.title, trimmedQuery)}
                              </p>
                              <p className="text-xs text-slate-600 truncate">
                                {renderHighlightedText(book.author, trimmedQuery)}
                                {book.category_name ? ` · ${book.category_name}` : ''}
                              </p>
                              <div className="flex items-center gap-2 text-[11px]">
                                <span className="font-mono text-slate-500 tabular-nums">
                                  {renderHighlightedText(book.isbn, trimmedQuery)}
                                </span>
                                <span className="text-slate-300">·</span>
                                <span
                                  className={`font-medium ${
                                    isAvailable ? 'text-emerald-700' : 'text-rose-700'
                                  }`}
                                >
                                  {isAvailable ? t('inStock') : t('outOfStock')}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0 pl-2">
                              <span className="font-mono text-sm font-bold text-[#0B192C] tabular-nums">
                                {formatPrice(book.price, currency)}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {matchedAuthors.length > 0 && (
                  <div className="py-1.5">
                    <div className="px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/70">
                      {t('headerSearchAuthors')}
                    </div>
                    <div className="divide-y divide-slate-100">
                      {matchedAuthors.map((author, aIdx) => {
                        const optionIndex = visibleBooks.length + aIdx;
                        const isHighlighted = activeIndex === optionIndex;
                        return (
                          <button
                            key={author.id}
                            id={`${listboxId}-opt-${optionIndex}`}
                            role="option"
                            aria-selected={isHighlighted}
                            type="button"
                            onMouseEnter={() => setActiveIndex(optionIndex)}
                            onClick={() => activateOption({ type: 'author', author })}
                            className={`w-full px-3.5 py-2.5 flex items-center gap-3 text-left transition-colors cursor-pointer ${
                              isHighlighted ? 'bg-[#0B192C]/5' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full bg-[#0B192C] text-[#DFC166] flex items-center justify-center shrink-0">
                              <UserCheck className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-[#0B192C] truncate">
                                {renderHighlightedText(author.name, trimmedQuery)}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
                                {[author.credentials, author.affiliation].filter(Boolean).join(' · ') ||
                                  `${author.book_count} ${author.book_count === 1 ? 'edition' : 'editions'}`}
                              </p>
                            </div>
                            <span className="text-xs font-medium text-[#9F7918] shrink-0">
                              →
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {matchedBooks.length > 0 && (
            <button
              id={`${listboxId}-opt-${visibleBooks.length + matchedAuthors.length}`}
              role="option"
              aria-selected={activeIndex === visibleBooks.length + matchedAuthors.length}
              type="button"
              onMouseEnter={() =>
                setActiveIndex(visibleBooks.length + matchedAuthors.length)
              }
              onClick={() => activateOption({ type: 'catalog' })}
              className={`w-full px-4 py-2.5 bg-[#0B192C] text-white text-xs font-semibold flex items-center justify-between hover:bg-[#132642] transition-colors cursor-pointer ${
                activeIndex === visibleBooks.length + matchedAuthors.length
                  ? 'ring-2 ring-inset ring-[#C59B27]'
                  : ''
              }`}
            >
              <span>
                {t('headerSearchViewAll')} ({matchedBooks.length})
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#DFC166]" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
