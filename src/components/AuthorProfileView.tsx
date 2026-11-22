import { ArrowLeft, BookOpen, Globe2, GraduationCap, MapPin } from 'lucide-react';
import type { AuthorProfile, Book, CurrencyCode } from '../types';
import { useLanguage, LanguageToggle } from '../lib/i18n';
import { BookCard } from './BookCard';

interface AuthorProfileViewProps {
  author: AuthorProfile | null;
  books: Book[];
  loading: boolean;
  currency: CurrencyCode;
  wishlistIds: Set<number>;
  onToggleWishlist: (book: Book) => void;
  onBackToAuthors: () => void;
  onSelectBook: (book: Book) => void;
  onAddToCart: (book: Book) => void;
  onPreviewSample: (book: Book) => void;
}

export function AuthorProfileView({
  author,
  books,
  loading,
  currency,
  wishlistIds,
  onToggleWishlist,
  onBackToAuthors,
  onSelectBook,
  onAddToCart,
  onPreviewSample,
}: AuthorProfileViewProps) {
  const { language } = useLanguage();

  if (loading) {
    return (
      <div className="bg-[#F9FAFB] min-h-[75vh] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
          <div className="h-44 bg-white border border-slate-200 rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 bg-white border border-slate-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="bg-[#F9FAFB] min-h-[70vh] py-16 px-4">
        <div className="max-w-lg mx-auto bg-white border border-slate-200 rounded-lg p-10 text-center space-y-4">
          <h1 className="font-serif text-2xl font-bold text-[#0B192C]">
            {language === 'hi' ? 'लेखक प्रोफ़ाइल उपलब्ध नहीं है' : 'Author Profile Not Found'}
          </h1>
          <p className="text-sm text-slate-600">
            {language === 'hi'
              ? 'यह लेखक पृष्ठ उपलब्ध नहीं है या हटाया जा चुका है।'
              : 'The requested author profile could not be located in our catalog.'}
          </p>
          <button
            type="button"
            onClick={onBackToAuthors}
            className="px-5 py-2.5 bg-[#0B192C] text-white text-xs font-semibold rounded-md hover:bg-[#132642] cursor-pointer"
          >
            {language === 'hi' ? 'सभी लेखक देखें' : 'Return to Authors Directory'}
          </button>
        </div>
      </div>
    );
  }

  const subjects = author.subjects && author.subjects.length > 0 ? author.subjects : [];
  const languages = author.languages && author.languages.length > 0 ? author.languages : [];

  return (
    <div className="bg-[#F9FAFB] min-h-[75vh]">
      <section className="bg-[#0B192C] text-white py-12 border-b border-[#1D3557]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onBackToAuthors}
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-[#DFC166] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === 'hi' ? 'सभी लेखक' : 'All Published Authors'}</span>
            </button>
            <LanguageToggle variant="dark" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-[#132642] border border-[#C59B27]/50 text-[#DFC166] flex items-center justify-center font-serif text-2xl font-bold shrink-0">
                  {author.name
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w) => w[0]?.toUpperCase())
                    .join('')}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#DFC166]">
                    {language === 'hi' ? 'लेखक प्रोफ़ाइल' : 'Author & Editorial Profile'}
                  </p>
                  <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight mt-0.5">
                    {author.name}
                  </h1>
                </div>
              </div>

              {(author.credentials || author.affiliation || author.location) && (
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-300 pt-1">
                  {author.credentials && (
                    <span className="inline-flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-[#DFC166]" />
                      <span>{author.credentials}</span>
                    </span>
                  )}
                  {author.affiliation && (
                    <span className="inline-flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-[#DFC166]" />
                      <span>{author.affiliation}</span>
                    </span>
                  )}
                  {author.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#DFC166]" />
                      <span>{author.location}</span>
                    </span>
                  )}
                </div>
              )}

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
                {author.bio ||
                  (language === 'hi'
                    ? `${author.name} भगवती पब्लिकेशंस के प्रकाशित लेखक/संपादक हैं, जिनके कार्य ${
                        subjects.join(', ') || 'विभिन्न विषयों'
                      } पर केंद्रित हैं।`
                    : `${author.name} is a published author with Bhagwati Publications, contributing verified editions across ${
                        subjects.join(', ') || 'our core publishing catalog'
                      }.`)}
              </p>
            </div>

            <div className="lg:col-span-4 bg-[#132642] border border-white/10 rounded-lg p-5 space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-slate-300 text-xs">
                  {language === 'hi' ? 'प्रकाशित पुस्तकें' : 'Published Titles'}
                </span>
                <span className="font-mono font-bold text-white tabular-nums">
                  {books.length}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-2.5">
                <span className="text-slate-300 text-xs shrink-0">
                  {language === 'hi' ? 'विषय' : 'Subjects'}
                </span>
                <span className="text-right text-xs text-[#DFC166]">
                  {subjects.join(', ') || 'General'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-xs inline-flex items-center gap-1.5">
                  <Globe2 className="w-3.5 h-3.5 text-[#DFC166]" />
                  <span>{language === 'hi' ? 'भाषाएँ' : 'Languages'}</span>
                </span>
                <span className="text-xs text-white">{languages.join(', ') || 'English'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-7">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="font-serif text-2xl font-bold text-[#0B192C]">
              {language === 'hi'
                ? `${author.name} की प्रकाशित पुस्तकें`
                : `Published Works by ${author.name}`}
            </h2>
          </div>

          {books.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-sm text-slate-600">
              {language === 'hi'
                ? 'इस लेखक के लिए अभी कोई प्रकाशित पुस्तक उपलब्ध नहीं है।'
                : 'No currently published editions listed for this author.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  currency={currency}
                  isWishlisted={wishlistIds.has(book.id)}
                  onToggleWishlist={onToggleWishlist}
                  onSelectBook={onSelectBook}
                  onAddToCart={onAddToCart}
                  onPreviewSample={onPreviewSample}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
