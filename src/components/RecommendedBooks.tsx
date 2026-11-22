import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import type { Book, CurrencyCode } from '../types';
import { useLanguage } from '../lib/i18n';
import { BookCard } from './BookCard';

interface RecommendedBooksProps {
  allBooks: Book[];
  referenceBooks: Book[];
  excludeIds?: number[];
  title?: string;
  subtitle?: string;
  currency: CurrencyCode;
  wishlistIds: Set<number>;
  onToggleWishlist: (book: Book) => void;
  onSelectBook: (book: Book) => void;
  onAddToCart: (book: Book) => void;
  onPreviewSample: (book: Book) => void;
  onSelectAuthor?: (authorSlug: string) => void;
}

export function RecommendedBooks({
  allBooks,
  referenceBooks,
  excludeIds = [],
  title,
  subtitle,
  currency,
  wishlistIds,
  onToggleWishlist,
  onSelectBook,
  onAddToCart,
  onPreviewSample,
  onSelectAuthor,
}: RecommendedBooksProps) {
  const { language, t } = useLanguage();

  const recommendations = useMemo(() => {
    const excludeSet = new Set(excludeIds);
    const refCategoryIds = new Set(
      referenceBooks.map((b) => b.category_id).filter((id): id is number => id !== null)
    );
    const refAuthors = new Set(referenceBooks.map((b) => b.author.toLowerCase()));
    const refLanguages = new Set(referenceBooks.map((b) => b.language.toLowerCase()));

    return allBooks
      .filter((b) => !excludeSet.has(b.id) && b.is_published)
      .map((candidate) => {
        let score = 0;
        if (candidate.category_id && refCategoryIds.has(candidate.category_id)) score += 5;
        if (refAuthors.has(candidate.author.toLowerCase())) score += 4;
        if (refLanguages.has(candidate.language.toLowerCase())) score += 2;
        if (candidate.is_featured) score += 2;
        if (candidate.is_new_arrival) score += 1;
        score += (candidate.average_rating || 0) * 0.6;
        if (candidate.is_available && candidate.stock_quantity > 0) score += 1;
        return { book: candidate, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => x.book);
  }, [allBooks, referenceBooks, excludeIds]);

  if (recommendations.length === 0) return null;

  return (
    <section className="pt-8 border-t border-slate-200 space-y-6">
      <div className="space-y-1">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#9F7918]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{language === 'hi' ? 'चयनित अनुशंसाएँ' : 'Curated Recommendations'}</span>
        </p>
        <h2 className="font-serif text-2xl font-bold text-[#0B192C]">
          {title || t('recommendedTitle')}
        </h2>
        {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
        {recommendations.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            currency={currency}
            isWishlisted={wishlistIds.has(book.id)}
            onToggleWishlist={onToggleWishlist}
            onSelectBook={onSelectBook}
            onAddToCart={onAddToCart}
            onPreviewSample={onPreviewSample}
            onSelectAuthor={onSelectAuthor}
          />
        ))}
      </div>
    </section>
  );
}
