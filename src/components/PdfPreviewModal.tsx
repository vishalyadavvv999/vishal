import { useEffect, useState } from 'react';
import {
  Bookmark,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Type,
  X,
} from 'lucide-react';
import type { Book, BookPreviewExcerpt } from '../types';
import { api } from '../lib/api';
import { useLanguage } from '../lib/i18n';
import { BookCoverImage } from './BookCoverImage';

interface PdfPreviewModalProps {
  book: Book | null;
  onClose: () => void;
  onAddToCart?: (book: Book) => void;
}

type ReaderTheme = 'paper' | 'archival' | 'navy';
type FontScale = 'sm' | 'md' | 'lg';

const BOOKMARK_STORAGE_KEY = 'bhagwati_publications_reader_bookmarks_v1';

export function PdfPreviewModal({ book, onClose, onAddToCart }: PdfPreviewModalProps) {
  const { language } = useLanguage();
  const [mode, setMode] = useState<'interactive' | 'pdf'>('interactive');
  const [excerpt, setExcerpt] = useState<BookPreviewExcerpt | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>('paper');
  const [fontScale, setFontScale] = useState<FontScale>('md');
  const [bookmarkedPage, setBookmarkedPage] = useState<number | null>(null);

  useEffect(() => {
    if (!book) return;
    setMode('interactive');
    setLoading(true);
    setPageIndex(0);

    try {
      const saved = localStorage.getItem(BOOKMARK_STORAGE_KEY);
      if (saved) {
        const map = JSON.parse(saved) as Record<string, number>;
        const savedIdx = map[String(book.id)];
        if (typeof savedIdx === 'number' && savedIdx >= 0) {
          setBookmarkedPage(savedIdx);
          setPageIndex(savedIdx);
        } else {
          setBookmarkedPage(null);
        }
      } else {
        setBookmarkedPage(null);
      }
    } catch {
      setBookmarkedPage(null);
    }

    api
      .getBookPreviewExcerpt(book.id)
      .then((res) => setExcerpt(res))
      .catch(() => setExcerpt(null))
      .finally(() => setLoading(false));
  }, [book]);

  useEffect(() => {
    if (!book || mode !== 'interactive' || !excerpt) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setPageIndex((p) => Math.min(excerpt.pages.length - 1, p + 1));
      } else if (e.key === 'ArrowLeft') {
        setPageIndex((p) => Math.max(0, p - 1));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [book, mode, excerpt, onClose]);

  if (!book) return null;

  const pdfUrl = `/api/books/${book.id}/sample-pdf`;
  const pages = excerpt?.pages || [];
  const activePage = pages[pageIndex] || pages[0];

  const toggleBookmark = () => {
    const next = bookmarkedPage === pageIndex ? null : pageIndex;
    setBookmarkedPage(next);
    try {
      const raw = localStorage.getItem(BOOKMARK_STORAGE_KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
      if (next === null) {
        delete map[String(book.id)];
      } else {
        map[String(book.id)] = next;
      }
      localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(map));
    } catch {
      // ignore storage errors
    }
  };

  const themeSurface: Record<ReaderTheme, string> = {
    paper: 'bg-white text-[#0B192C] border-slate-200',
    archival: 'bg-[#FAF6EE] text-[#1F1A14] border-[#E5DEC9]',
    navy: 'bg-[#0B192C] text-slate-100 border-[#1D3557]',
  };

  const textSizeClass: Record<FontScale, string> = {
    sm: 'text-sm leading-relaxed',
    md: 'text-base leading-relaxed',
    lg: 'text-lg leading-loose',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#07111E]/80 backdrop-blur-xs p-2 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-preview-title"
    >
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        {/* Top Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#0B192C] text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <BookOpen className="w-5 h-5 text-[#DFC166] shrink-0" />
            <div className="min-w-0">
              <h2 id="pdf-preview-title" className="font-serif text-base sm:text-lg font-semibold truncate">
                {language === 'hi' ? 'डिजिटल पुस्तक प्रीव्यू' : 'Digital Preview'} — {book.title}
              </h2>
              <p className="text-xs text-slate-300 truncate">
                {book.author} · ISBN {book.isbn}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Segmented Mode Switch */}
            <div className="inline-flex p-0.5 bg-[#07111E] border border-white/15 rounded-md text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMode('interactive')}
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                  mode === 'interactive' ? 'bg-[#C59B27] text-[#07111E]' : 'text-slate-300 hover:text-white'
                }`}
              >
                {language === 'hi' ? 'इंटरैक्टिव रीडर' : 'Interactive Reader'}
              </button>
              {book.has_sample_pdf && (
                <button
                  type="button"
                  onClick={() => setMode('pdf')}
                  className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                    mode === 'pdf' ? 'bg-[#C59B27] text-[#07111E]' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {language === 'hi' ? 'मूल PDF' : 'Sample PDF'}
                </button>
              )}
            </div>

            {book.has_sample_pdf && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#DFC166] border border-[#DFC166]/40 rounded hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'PDF खोलें' : 'Open PDF'}</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sample preview"
              className="p-2 text-slate-300 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Interactive Reader Mode */}
        {mode === 'interactive' ? (
          <div className="flex-1 flex flex-col min-h-0 bg-[#F3F5F8]">
            {/* Reader Toolbar */}
            <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
              {/* Chapter Jump Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {pages.map((p, idx) => (
                  <button
                    key={p.page_number}
                    type="button"
                    onClick={() => setPageIndex(idx)}
                    className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      pageIndex === idx
                        ? 'bg-[#0B192C] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {p.page_number}. {p.chapter_title}
                  </button>
                ))}
              </div>

              {/* Typography & Theme Controls */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="inline-flex items-center gap-1 border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50">
                  <Type className="w-3.5 h-3.5 text-slate-500 mr-1" />
                  {(['sm', 'md', 'lg'] as FontScale[]).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setFontScale(sz)}
                      className={`px-2 py-0.5 text-xs rounded font-semibold uppercase cursor-pointer ${
                        fontScale === sz
                          ? 'bg-[#0B192C] text-white'
                          : 'text-slate-600 hover:text-[#0B192C]'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>

                <div className="inline-flex items-center gap-1 border border-slate-200 rounded p-0.5 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setReaderTheme('paper')}
                    aria-label="Paper reading theme"
                    className={`px-2 py-1 text-xs font-medium rounded cursor-pointer ${
                      readerTheme === 'paper' ? 'bg-white shadow-xs text-[#0B192C]' : 'text-slate-600'
                    }`}
                  >
                    Paper
                  </button>
                  <button
                    type="button"
                    onClick={() => setReaderTheme('archival')}
                    aria-label="Archival cream reading theme"
                    className={`px-2 py-1 text-xs font-medium rounded cursor-pointer ${
                      readerTheme === 'archival'
                        ? 'bg-[#FAF6EE] shadow-xs text-[#1F1A14]'
                        : 'text-slate-600'
                    }`}
                  >
                    Sepia
                  </button>
                  <button
                    type="button"
                    onClick={() => setReaderTheme('navy')}
                    aria-label="Dark navy reading theme"
                    className={`px-2 py-1 text-xs font-medium rounded cursor-pointer ${
                      readerTheme === 'navy' ? 'bg-[#0B192C] text-white' : 'text-slate-600'
                    }`}
                  >
                    Navy
                  </button>
                </div>

                <button
                  type="button"
                  onClick={toggleBookmark}
                  aria-pressed={bookmarkedPage === pageIndex}
                  title="Bookmark current page"
                  className={`inline-flex items-center gap-1 px-2.5 py-1 border rounded text-xs font-medium cursor-pointer ${
                    bookmarkedPage === pageIndex
                      ? 'bg-[#C59B27] border-[#C59B27] text-[#07111E]'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" fill={bookmarkedPage === pageIndex ? 'currentColor' : 'none'} />
                  <span>{bookmarkedPage === pageIndex ? 'Bookmarked' : 'Bookmark'}</span>
                </button>
              </div>
            </div>

            {/* Book Spread Viewport */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-start justify-center">
              {loading ? (
                <div className="w-full max-w-4xl h-96 bg-white border border-slate-200 rounded-lg animate-pulse" />
              ) : !activePage ? (
                <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-lg p-10 text-center space-y-3">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm text-slate-600">
                    {language === 'hi'
                      ? 'डिजिटल प्रीव्यू लोड नहीं हो सका।'
                      : 'Unable to load interactive preview pages for this edition.'}
                  </p>
                </div>
              ) : (
                <div
                  className={`w-full max-w-4xl border rounded-lg shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[420px] transition-colors ${themeSurface[readerTheme]}`}
                >
                  {/* Left Cover / Edition Spine Panel */}
                  <div
                    className={`md:col-span-4 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r ${
                      readerTheme === 'navy'
                        ? 'border-white/10 bg-[#07111E]'
                        : readerTheme === 'archival'
                          ? 'border-[#E5DEC9] bg-[#F2EBD9]'
                          : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="aspect-[3/4] w-44 mx-auto rounded overflow-hidden border border-slate-200 shadow-xs">
                      <BookCoverImage src={book.cover_url} title={book.title} author={book.author} />
                    </div>
                    <div className="pt-5 text-center space-y-1 text-xs opacity-80">
                      <p className="font-serif font-semibold text-sm">{book.title}</p>
                      <p>{book.author}</p>
                      <p className="font-mono tabular-nums">ISBN {book.isbn}</p>
                    </div>
                  </div>

                  {/* Right Reading Page */}
                  <div className="md:col-span-8 p-6 sm:p-10 flex flex-col justify-between space-y-6">
                    <div className="space-y-5">
                      <div className="flex items-center justify-between text-xs uppercase tracking-wider font-semibold text-[#C59B27]">
                        <span>{activePage.chapter_title}</span>
                        <span className="font-mono tabular-nums">
                          Page {activePage.page_number} of {pages.length}
                        </span>
                      </div>

                      {activePage.kind === 'title' ? (
                        <div className="space-y-4 pt-4">
                          <h3 className="font-serif text-2xl sm:text-3xl font-bold leading-tight">
                            {activePage.paragraphs[0]}
                          </h3>
                          <div className="w-12 h-px bg-[#C59B27]" />
                          {activePage.paragraphs.slice(1).map((para, idx) => (
                            <p key={idx} className={`${textSizeClass[fontScale]} opacity-90`}>
                              {para}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {activePage.paragraphs.map((para, idx) => (
                            <p key={idx} className={`${textSizeClass[fontScale]} font-serif`}>
                              {para}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-current/10 flex items-center justify-between text-xs opacity-70">
                      <span>Bhagwati Publications · Sample Preview</span>
                      <span className="font-mono tabular-nums">
                        {pageIndex + 1} / {pages.length}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Page Controls */}
            <div className="bg-white border-t border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pageIndex <= 0}
                  onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 text-xs font-semibold text-[#0B192C] rounded-md hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{language === 'hi' ? 'पिछला पृष्ठ' : 'Previous Page'}</span>
                </button>
                <button
                  type="button"
                  disabled={pageIndex >= pages.length - 1}
                  onClick={() => setPageIndex((p) => Math.min(pages.length - 1, p + 1))}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 text-xs font-semibold text-[#0B192C] rounded-md hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <span>{language === 'hi' ? 'अगला पृष्ठ' : 'Next Page'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {onAddToCart && book.is_available && book.stock_quantity > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onAddToCart(book);
                    onClose();
                  }}
                  className="px-5 py-2 bg-[#C59B27] text-[#07111E] text-xs font-semibold rounded-md hover:bg-[#DFC166] transition-colors cursor-pointer"
                >
                  {language === 'hi' ? 'पूर्ण संस्करण बैग में जोड़ें' : 'Add Full Edition to Bag'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-slate-100 relative">
            <iframe
              src={`${pdfUrl}#toolbar=1&navpanes=0`}
              title={`Sample PDF preview for ${book.title}`}
              className="w-full h-full border-0"
            />
          </div>
        )}
      </div>
    </div>
  );
}
