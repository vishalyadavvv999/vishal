import { useState } from 'react';
import {
  ArrowLeft,
  Check,
  FileText,
  Heart,
  MessageSquare,
  Minus,
  Plus,
  ShoppingBag,
  Zap,
} from 'lucide-react';
import type { Book, CurrencyCode, CustomerUser } from '../types';
import { formatPrice } from '../lib/currency';
import { BookCoverImage } from './BookCoverImage';
import { BookCard } from './BookCard';
import { BookReviewsSection } from './BookReviewsSection';

interface BookDetailViewProps {
  book: Book;
  relatedBooks: Book[];
  currency: CurrencyCode;
  wishlistIds: Set<number>;
  customer: CustomerUser | null;
  onOpenCustomerAuth: (mode: 'login' | 'register') => void;
  onCustomerLogout: () => void;
  onToggleWishlist: (book: Book) => void;
  onBack: () => void;
  onSelectBook: (book: Book) => void;
  onAddToCart: (book: Book, quantity: number) => void;
  onBuyNow: (book: Book, quantity: number) => void;
  onPreviewSample: (book: Book) => void;
  onOpenWhatsAppInquiry: (book: Book) => void;
}

export function BookDetailView({
  book,
  relatedBooks,
  currency,
  wishlistIds,
  customer,
  onOpenCustomerAuth,
  onCustomerLogout,
  onToggleWishlist,
  onBack,
  onSelectBook,
  onAddToCart,
  onBuyNow,
  onPreviewSample,
  onOpenWhatsAppInquiry,
}: BookDetailViewProps) {
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const isWishlisted = wishlistIds.has(book.id);

  const inStock = book.is_available && book.stock_quantity > 0;

  const handleAdd = () => {
    onAddToCart(book, quantity);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1800);
  };

  return (
    <div className="bg-[#F9FAFB] min-h-[75vh] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Back Breadcrumb */}
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#0B192C] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Catalog</span>
          </button>
        </div>

        {/* Contiguous PDP Layout: Sticky Gallery Left, Contiguous Purchase Module Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Cover & Sample PDF Trigger */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <div className="aspect-[3/4] w-full max-w-md mx-auto bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              <BookCoverImage src={book.cover_url} title={book.title} author={book.author} />
            </div>

            {book.has_sample_pdf && (
              <div className="max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => onPreviewSample(book)}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-white border border-[#0B192C] text-[#0B192C] text-sm font-semibold rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-[#9F7918]" />
                  <span>Preview Sample PDF</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Contiguous Purchase Module + Description */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6 sm:p-8 space-y-7">
            <div className="space-y-3 border-b border-slate-200 pb-6">
              {/* Zero-pill unboxed metadata */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="uppercase tracking-wider font-semibold text-[#9F7918]">
                  {book.category_name || 'Publication'}
                </span>
                {book.is_new_arrival && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-[#0B192C]">New Arrival</span>
                  </>
                )}
                {book.is_featured && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-[#0B192C]">Featured Edition</span>
                  </>
                )}
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#0B192C] leading-tight">
                {book.title}
              </h1>
              <p className="text-base text-slate-700">
                By <span className="font-semibold text-[#0B192C]">{book.author}</span>
              </p>

              <div className="pt-2 flex flex-wrap items-baseline justify-between gap-4">
                <p className="text-2xl sm:text-3xl font-bold text-[#0B192C] tabular-nums">
                  {formatPrice(book.price, currency)}
                </p>
                <p
                  className={`text-sm font-medium ${
                    inStock ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {inStock
                    ? `In Stock (${book.stock_quantity} available)`
                    : 'Currently Out of Stock'}
                </p>
              </div>
            </div>

            {/* Purchase Actions */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="inline-flex items-center border border-slate-300 rounded-md bg-white">
                  <button
                    type="button"
                    disabled={!inStock || quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="p-3 text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm font-mono font-semibold tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={!inStock || quantity >= book.stock_quantity}
                    onClick={() => setQuantity((q) => Math.min(book.stock_quantity, q + 1))}
                    aria-label="Increase quantity"
                    className="p-3 text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={!inStock}
                  onClick={handleAdd}
                  className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#0B192C] text-white text-sm font-semibold rounded-md hover:bg-[#132642] transition-colors disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                >
                  {addedFeedback ? (
                    <>
                      <Check className="w-4 h-4 text-[#DFC166]" />
                      <span>Added to Bag</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 text-[#DFC166]" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={!inStock}
                  onClick={() => onBuyNow(book, quantity)}
                  className="flex-1 min-w-[150px] inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#C59B27] text-[#07111E] text-sm font-semibold rounded-md hover:bg-[#DFC166] transition-colors disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>Buy Now</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onOpenWhatsAppInquiry(book)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-emerald-700 text-emerald-800 text-sm font-semibold rounded-md hover:bg-emerald-50 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Inquire on WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => onToggleWishlist(book)}
                  aria-pressed={isWishlisted}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 border text-sm font-semibold rounded-md transition-colors cursor-pointer ${
                    isWishlisted
                      ? 'bg-[#0B192C] border-[#0B192C] text-[#DFC166]'
                      : 'border-slate-300 text-[#0B192C] hover:bg-slate-50'
                  }`}
                >
                  <Heart
                    className="w-4 h-4"
                    fill={isWishlisted ? 'currentColor' : 'none'}
                  />
                  <span>{isWishlisted ? 'Saved in Wishlist' : 'Save to Wishlist'}</span>
                </button>
              </div>
            </div>

            {/* Editorial Description */}
            <div className="pt-4 border-t border-slate-200 space-y-2.5">
              <h2 className="font-serif text-lg font-semibold text-[#0B192C]">
                About This Edition
              </h2>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {book.description}
              </p>
            </div>

            {/* Bibliographic Details Grid */}
            <div className="pt-4 border-t border-slate-200">
              <h2 className="font-serif text-lg font-semibold text-[#0B192C] mb-3">
                Bibliographic Specifications
              </h2>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                  <dt className="text-xs text-slate-500">ISBN-13</dt>
                  <dd className="font-mono font-medium text-[#0B192C] mt-0.5 tabular-nums">
                    {book.isbn}
                  </dd>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                  <dt className="text-xs text-slate-500">Binding</dt>
                  <dd className="font-medium text-[#0B192C] mt-0.5">{book.binding || 'Hardcover'}</dd>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                  <dt className="text-xs text-slate-500">Language</dt>
                  <dd className="font-medium text-[#0B192C] mt-0.5">{book.language || 'English'}</dd>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                  <dt className="text-xs text-slate-500">Pages</dt>
                  <dd className="font-mono font-medium text-[#0B192C] mt-0.5 tabular-nums">
                    {book.pages || '—'}
                  </dd>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                  <dt className="text-xs text-slate-500">Publication Year</dt>
                  <dd className="font-mono font-medium text-[#0B192C] mt-0.5 tabular-nums">
                    {book.publication_year || '—'}
                  </dd>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                  <dt className="text-xs text-slate-500">Subject</dt>
                  <dd className="font-medium text-[#0B192C] mt-0.5">
                    {book.category_name || 'General'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Customer Reviews & Ratings */}
        <BookReviewsSection
          bookId={book.id}
          bookTitle={book.title}
          customer={customer}
          onOpenAuthModal={onOpenCustomerAuth}
          onCustomerLogout={onCustomerLogout}
        />

        {/* Related Editions */}
        {relatedBooks.length > 0 && (
          <section className="pt-6 border-t border-slate-200 space-y-6">
            <h2 className="font-serif text-2xl font-bold text-[#0B192C]">
              More from Bhagwati Publications
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {relatedBooks.slice(0, 3).map((rel) => (
                <BookCard
                  key={rel.id}
                  book={rel}
                  currency={currency}
                  isWishlisted={wishlistIds.has(rel.id)}
                  onToggleWishlist={onToggleWishlist}
                  onSelectBook={onSelectBook}
                  onAddToCart={(b) => onAddToCart(b, 1)}
                  onPreviewSample={onPreviewSample}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
