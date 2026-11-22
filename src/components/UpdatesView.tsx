import { useState } from 'react';
import { ArrowRight, BookOpen, Newspaper } from 'lucide-react';
import type { Book, PublicationUpdate, UpdateCategory } from '../types';
import { formatDate } from '../lib/currency';
import { LanguageToggle, useLanguage } from '../lib/i18n';

interface UpdatesViewProps {
  updates: PublicationUpdate[];
  books: Book[];
  loading: boolean;
  onSelectBook: (book: Book) => void;
}

const CATEGORY_LABELS: Record<UpdateCategory, { en: string; hi: string }> = {
  'new-release': { en: 'New Release', hi: 'नया प्रकाशन' },
  announcement: { en: 'Announcement', hi: 'घोषणा' },
  event: { en: 'Event & Fair', hi: 'कार्यक्रम' },
  press: { en: 'Press & Platform', hi: 'प्रेस विज्ञप्ति' },
};

export function UpdatesView({ updates, books, loading, onSelectBook }: UpdatesViewProps) {
  const { language, t } = useLanguage();
  const [filterCat, setFilterCat] = useState<'all' | UpdateCategory>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = updates.filter((u) => filterCat === 'all' || u.category === filterCat);

  const findBook = (bookId: number | null) =>
    bookId ? books.find((b) => b.id === bookId) || null : null;

  return (
    <div className="bg-[#F9FAFB] min-h-[75vh]">
      <section className="bg-[#0B192C] text-white py-12 border-b border-[#1D3557]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="w-12 h-px bg-[#C59B27]" />
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
              {t('updatesPageHeading')}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
              {t('updatesPageSubtitle')}
            </p>
          </div>
          <LanguageToggle variant="dark" />
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Interactive Category Filter */}
          <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filter updates">
            <button
              type="button"
              onClick={() => setFilterCat('all')}
              className={`px-3.5 py-2 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                filterCat === 'all'
                  ? 'bg-[#0B192C] text-white border-[#0B192C]'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
              }`}
            >
              {language === 'hi' ? 'सभी अपडेट' : 'All Updates'} ({updates.length})
            </button>
            {(['new-release', 'announcement', 'event', 'press'] as UpdateCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCat(cat)}
                className={`px-3.5 py-2 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                  filterCat === cat
                    ? 'bg-[#0B192C] text-white border-[#0B192C]'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                }`}
              >
                {CATEGORY_LABELS[cat][language]}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 bg-white border border-slate-200 rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-3">
              <Newspaper className="w-10 h-10 text-slate-300 mx-auto" strokeWidth={1.5} />
              <h2 className="font-serif text-xl font-bold text-[#0B192C]">
                {language === 'hi' ? 'कोई अपडेट उपलब्ध नहीं है' : 'No Publication Updates Yet'}
              </h2>
              <p className="text-sm text-slate-600">
                {language === 'hi'
                  ? 'प्रकाशक द्वारा नई घोषणाएँ जोड़ने पर वे यहाँ दिखाई देंगी।'
                  : 'Editorial announcements and release notices published by the team will appear here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filtered.map((item) => {
                const isExpanded = expandedId === item.id;
                const linkedBook = findBook(item.related_book_id);
                const catLabel = CATEGORY_LABELS[item.category]?.[language] || item.category;

                return (
                  <article
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-lg p-6 sm:p-7 space-y-4"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="uppercase tracking-wider font-semibold text-[#9F7918]">
                        {catLabel}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{formatDate(item.published_at)}</span>
                    </div>

                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#0B192C] leading-snug">
                      {item.title}
                    </h2>

                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      {item.summary}
                    </p>

                    {isExpanded && (
                      <div className="pt-4 border-t border-slate-100 text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                        {item.content}
                      </div>
                    )}

                    <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B192C] hover:text-[#9F7918] cursor-pointer"
                      >
                        <span>
                          {isExpanded
                            ? language === 'hi'
                              ? 'कम पढ़ें'
                              : 'Collapse Dispatch'
                            : language === 'hi'
                              ? 'पूरा विवरण पढ़ें'
                              : 'Read Full Dispatch'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {linkedBook && (
                        <button
                          type="button"
                          onClick={() => onSelectBook(linkedBook)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B192C] text-white text-xs font-semibold rounded-md hover:bg-[#132642] transition-colors cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-[#DFC166]" />
                          <span>
                            {language === 'hi' ? 'पुस्तक देखें:' : 'View Edition:'}{' '}
                            {linkedBook.title}
                          </span>
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
