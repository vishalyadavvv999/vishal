import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, LogOut, Star, Trash2 } from 'lucide-react';
import type { BookReview, BookReviewSummary, CustomerUser } from '../types';
import { api } from '../lib/api';
import { formatDate } from '../lib/currency';

interface BookReviewsSectionProps {
  bookId: number;
  bookTitle: string;
  customer: CustomerUser | null;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
  onCustomerLogout: () => void;
}

const EMPTY_SUMMARY: BookReviewSummary = {
  average_rating: 0,
  total_reviews: 0,
  breakdown: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
};

function StarDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${cls} ${
            star <= Math.round(rating) ? 'text-[#C59B27]' : 'text-slate-300'
          }`}
          fill={star <= Math.round(rating) ? 'currentColor' : 'none'}
          strokeWidth={1.75}
        />
      ))}
    </div>
  );
}

export function BookReviewsSection({
  bookId,
  bookTitle,
  customer,
  onOpenAuthModal,
  onCustomerLogout,
}: BookReviewsSectionProps) {
  const [summary, setSummary] = useState<BookReviewSummary>(EMPTY_SUMMARY);
  const [reviews, setReviews] = useState<BookReview[]>([]);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [savedBanner, setSavedBanner] = useState('');

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getBookReviews(bookId);
      setSummary(data.summary);
      setReviews(data.reviews);
    } catch {
      setSummary(EMPTY_SUMMARY);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    setSavedBanner('');
    setError('');
    loadReviews();
  }, [loadReviews]);

  const existingOwnReview = customer
    ? reviews.find((r) => r.customer_id === customer.id) || null
    : null;

  useEffect(() => {
    if (existingOwnReview) {
      setRating(existingOwnReview.rating);
      setTitle(existingOwnReview.title);
      setComment(existingOwnReview.comment);
    } else {
      setRating(5);
      setTitle('');
      setComment('');
    }
  }, [existingOwnReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSavedBanner('');
    setSubmitting(true);
    try {
      const updated = await api.submitBookReview(bookId, {
        rating,
        title: title.trim(),
        comment: comment.trim(),
      });
      setSummary(updated.summary);
      setReviews(updated.reviews);
      setSavedBanner(
        existingOwnReview ? 'Your review has been updated.' : 'Thank you. Your review is published.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOwn = async (reviewId: number) => {
    setError('');
    setSavedBanner('');
    try {
      const updated = await api.deleteBookReview(bookId, reviewId);
      setSummary(updated.summary);
      setReviews(updated.reviews);
      setRating(5);
      setTitle('');
      setComment('');
      setSavedBanner('Your review was removed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete review');
    }
  };

  const activeStarValue = hoverRating || rating;

  return (
    <section
      aria-labelledby="reader-reviews-heading"
      className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 space-y-8"
    >
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9F7918]">
            Reader Feedback
          </p>
          <h2 id="reader-reviews-heading" className="font-serif text-2xl font-bold text-[#0B192C] mt-1">
            Customer Reviews
          </h2>
        </div>

        {customer && (
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span>
              Signed in as <strong className="text-[#0B192C]">{customer.name}</strong>
            </span>
            <button
              type="button"
              onClick={onCustomerLogout}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-[#0B192C] underline underline-offset-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {/* Top Grid: Rating Breakdown + Review Submission Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-8 border-b border-slate-200">
        {/* Rating Breakdown */}
        <div className="lg:col-span-5 space-y-5">
          <div className="flex items-baseline gap-4">
            <span className="font-mono text-4xl font-bold text-[#0B192C] tabular-nums">
              {summary.total_reviews > 0 ? summary.average_rating.toFixed(1) : '—'}
            </span>
            <div className="space-y-1">
              <StarDisplay rating={summary.average_rating} size="md" />
              <p className="text-xs text-slate-600 tabular-nums">
                {summary.total_reviews === 0
                  ? 'No ratings yet'
                  : `Based on ${summary.total_reviews} ${
                      summary.total_reviews === 1 ? 'review' : 'reviews'
                    }`}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {(['5', '4', '3', '2', '1'] as const).map((starKey) => {
              const count = summary.breakdown[starKey] || 0;
              const pct =
                summary.total_reviews > 0
                  ? Math.round((count / summary.total_reviews) * 100)
                  : 0;
              return (
                <div key={starKey} className="flex items-center gap-3 text-xs">
                  <span className="w-12 font-mono text-slate-600 tabular-nums shrink-0">
                    {starKey} star
                  </span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#C59B27] transition-all duration-200"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-mono text-slate-500 tabular-nums shrink-0">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Write / Edit Review Panel */}
        <div className="lg:col-span-7">
          {!customer ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4">
              <div className="space-y-1.5">
                <h3 className="font-serif text-lg font-semibold text-[#0B192C]">
                  Share your thoughts on {bookTitle}
                </h3>
                <p className="text-sm text-slate-600">
                  Sign in with a verified reader account to leave a star rating and review.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('login')}
                  className="px-5 py-2.5 bg-[#0B192C] text-white text-xs font-semibold rounded-md hover:bg-[#132642] transition-colors cursor-pointer"
                >
                  Sign In to Review
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('register')}
                  className="px-5 py-2.5 bg-white border border-slate-300 text-[#0B192C] text-xs font-semibold rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Create Reader Account
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-serif text-lg font-semibold text-[#0B192C]">
                  {existingOwnReview ? 'Edit Your Review' : 'Write a Review'}
                </h3>
                {existingOwnReview && (
                  <button
                    type="button"
                    onClick={() => handleDeleteOwn(existingOwnReview.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 hover:underline cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Review</span>
                  </button>
                )}
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-md">
                  {error}
                </div>
              )}

              {savedBanner && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-md flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{savedBanner}</span>
                </div>
              )}

              <div>
                <span className="block text-xs font-medium text-slate-700 mb-1.5">
                  Your Rating *
                </span>
                <div
                  className="inline-flex items-center gap-1"
                  onMouseLeave={() => setHoverRating(0)}
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onMouseEnter={() => setHoverRating(value)}
                      onClick={() => setRating(value)}
                      aria-label={`Rate ${value} out of 5 stars`}
                      aria-pressed={rating === value}
                      className="p-1.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          value <= activeStarValue ? 'text-[#C59B27]' : 'text-slate-300'
                        }`}
                        fill={value <= activeStarValue ? 'currentColor' : 'none'}
                        strokeWidth={1.75}
                      />
                    </button>
                  ))}
                  <span className="ml-2 font-mono text-xs text-slate-600 tabular-nums">
                    {activeStarValue}/5
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Review Headline (Optional)
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarize your impression"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Your Review *
                </label>
                <textarea
                  required
                  minLength={5}
                  maxLength={2000}
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share thoughts on content, scholarship, print quality, or readability..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-[#0B192C] text-white text-xs font-semibold rounded-md hover:bg-[#132642] transition-colors disabled:opacity-60 cursor-pointer"
              >
                {submitting
                  ? 'Saving Review...'
                  : existingOwnReview
                    ? 'Update Review'
                    : 'Publish Review'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-5">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-md" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">
            No reader reviews yet for this edition. Be the first authenticated reader to share a
            review.
          </p>
        ) : (
          <div className="divide-y divide-slate-200">
            {reviews.map((rev) => (
              <article key={rev.id} className="py-5 first:pt-0 last:pb-0 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span className="font-semibold text-sm text-[#0B192C]">
                      {rev.customer_name}
                    </span>
                    {rev.verified_purchase && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-emerald-700">Verified Purchase</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{formatDate(rev.updated_at || rev.created_at)}</span>
                  </div>
                  <StarDisplay rating={rev.rating} />
                </div>

                {rev.title && (
                  <h4 className="font-serif text-base font-semibold text-[#0B192C]">
                    {rev.title}
                  </h4>
                )}

                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {rev.comment}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
