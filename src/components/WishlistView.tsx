import { BookOpen, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import type { Book, CurrencyCode } from '../types';
import type { AppView } from './Navbar';
import { BookCard } from './BookCard';

interface WishlistViewProps {
  books: Book[];
  currency: CurrencyCode;
  onNavigate: (view: AppView) => void;
  onSelectBook: (book: Book) => void;
  onAddToCart: (book: Book) => void;
  onPreviewSample: (book: Book) => void;
  onToggleWishlist: (book: Book) => void;
  onClearWishlist: () => void;
  onAddAllAvailableToCart: () => void;
}

export function WishlistView({
  books,
  currency,
  onNavigate,
  onSelectBook,
  onAddToCart,
  onPreviewSample,
  onToggleWishlist,
  onClearWishlist,
  onAddAllAvailableToCart,
}: WishlistViewProps) {
  const availableCount = books.filter((b) => b.is_available && b.stock_quantity > 0).length;

  return (
    <div className="bg-[#F9FAFB] min-h-[75vh]">
      <section className="bg-[#0B192C] text-white py-12 border-b border-[#1D3557]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="w-12 h-px bg-[#C59B27]" />
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
              My Wishlist
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
              Your saved editions are stored locally in this browser so you can revisit sample
              previews and order whenever ready.
            </p>
          </div>

          {books.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {availableCount > 0 && (
                <button
                  type="button"
                  onClick={onAddAllAvailableToCart}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C59B27] text-[#07111E] text-xs font-semibold rounded-md hover:bg-[#DFC166] transition-colors whitespace-nowrap cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add All Available ({availableCount})</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClearWishlist}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-white/25 text-white text-xs font-medium rounded-md hover:bg-white/10 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Wishlist</span>
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {books.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-4 max-w-xl mx-auto">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-[#9F7918] flex items-center justify-center mx-auto">
                <Heart className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <div className="space-y-1.5">
                <h2 className="font-serif text-2xl font-bold text-[#0B192C]">
                  Your wishlist is empty
                </h2>
                <p className="text-sm text-slate-600">
                  Tap the heart icon on any book card or details page to save favorite editions here
                  for later.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('catalog')}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0B192C] text-white text-sm font-semibold rounded-md hover:bg-[#132642] transition-colors cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-[#DFC166]" />
                <span>Browse Book Catalog</span>
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <p className="text-sm text-slate-600 tabular-nums">
                  Saved Editions:{' '}
                  <span className="font-semibold text-[#0B192C] font-mono">{books.length}</span>
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('catalog')}
                  className="text-xs font-semibold text-[#0B192C] hover:text-[#9F7918] cursor-pointer"
                >
                  Continue Browsing Catalog →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
                {books.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    currency={currency}
                    isWishlisted={true}
                    onToggleWishlist={onToggleWishlist}
                    onSelectBook={onSelectBook}
                    onAddToCart={onAddToCart}
                    onPreviewSample={onPreviewSample}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
