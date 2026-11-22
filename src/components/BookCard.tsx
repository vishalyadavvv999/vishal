import { Eye, Heart, ShoppingBag, Star } from 'lucide-react';
import type { Book, CurrencyCode } from '../types';
import { formatPrice } from '../lib/currency';
import { useLanguage } from '../lib/i18n';
import { BookCoverImage } from './BookCoverImage';

interface BookCardProps {
  book: Book;
  currency: CurrencyCode;
  isWishlisted?: boolean;
  onToggleWishlist?: (book: Book) => void;
  onSelectBook: (book: Book) => void;
  onAddToCart: (book: Book) => void;
  onPreviewSample?: (book: Book) => void;
  onSelectAuthor?: (authorSlug: string) => void;
}

export function BookCard({
  book,
  currency,
  isWishlisted = false,
  onToggleWishlist,
  onSelectBook,
  onAddToCart,
  onPreviewSample,
  onSelectAuthor,
}: BookCardProps) {
  const { t } = useLanguage();
  const inStock = book.is_available && book.stock_quantity > 0;
  const hasRating = (book.review_count || 0) > 0 && (book.average_rating || 0) > 0;

  return (
    <article className="group flex flex-col bg-white border border-slate-200 rounded-lg overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Cover Frame (65-75% visual focus) */}
      <div className="relative aspect-[3/4] w-full bg-[#F3F5F8] overflow-hidden">
        <button
          type="button"
          onClick={() => onSelectBook(book)}
          aria-label={`View details for ${book.title}`}
          className="w-full h-full block text-left cursor-pointer"
        >
          <BookCoverImage
            src={book.cover_url}
            title={book.title}
            author={book.author}
            className="transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </button>

        {onToggleWishlist && (
          <button
            type="button"
            onClick={() => onToggleWishlist(book)}
            aria-label={isWishlisted ? `Remove ${book.title} from wishlist` : `Save ${book.title} to wishlist`}
            aria-pressed={isWishlisted}
            title={isWishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
            className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center border transition-colors cursor-pointer shadow-xs ${
              isWishlisted
                ? 'bg-[#0B192C] border-[#C59B27] text-[#DFC166]'
                : 'bg-white/90 border-slate-200 text-[#0B192C] hover:bg-white hover:border-[#0B192C]'
            }`}
          >
            <Heart
              className="w-4 h-4"
              fill={isWishlisted ? 'currentColor' : 'none'}
              strokeWidth={1.9}
            />
          </button>
        )}

        {onPreviewSample && (
          <button
            type="button"
            onClick={() => onPreviewSample(book)}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0B192C]/90 text-white text-xs font-medium rounded hover:bg-[#0B192C] transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-[#DFC166]" />
            <span>{t('samplePreview')}</span>
          </button>
        )}
      </div>

      {/* Editorial Metadata & Purchase Row */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
        <div>
          {/* Zero-pill inline metadata */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5 truncate">
            <span className="uppercase tracking-wider font-medium text-[#9F7918]">
              {book.category_name || 'Publication'}
            </span>
            {book.is_new_arrival && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#0B192C] font-medium">New Arrival</span>
              </>
            )}
            {hasRating && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-0.5 text-[#0B192C] font-mono tabular-nums">
                  <Star className="w-3 h-3 text-[#C59B27]" fill="currentColor" />
                  <span>{book.average_rating!.toFixed(1)}</span>
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => onSelectBook(book)}
            className="text-left block w-full cursor-pointer"
          >
            <h3 className="font-serif text-lg font-semibold text-[#0B192C] leading-snug line-clamp-2 group-hover:text-[#1D3557] transition-colors">
              {book.title}
            </h3>
          </button>

          {onSelectAuthor && book.author_slug ? (
            <button
              type="button"
              onClick={() => onSelectAuthor(book.author_slug!)}
              className="text-sm text-slate-600 hover:text-[#9F7918] mt-1 truncate block text-left transition-colors cursor-pointer"
            >
              {book.author}
            </button>
          ) : (
            <p className="text-sm text-slate-600 mt-1 truncate">{book.author}</p>
          )}
          <p className="font-mono text-[11px] text-slate-400 mt-1 tabular-nums">
            ISBN {book.isbn} · {book.language}
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-[#0B192C] tabular-nums">
              {formatPrice(book.price, currency)}
            </p>
            <p className={`text-xs ${inStock ? 'text-emerald-700' : 'text-rose-700'}`}>
              {inStock ? t('inStock') : t('outOfStock')}
            </p>
          </div>

          <button
            type="button"
            disabled={!inStock}
            onClick={() => onAddToCart(book)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed bg-[#0B192C] text-white hover:bg-[#132642]"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#DFC166]" />
            <span>{inStock ? t('addToBag') : t('unavailable')}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
