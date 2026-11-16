import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, Search, UserCheck } from 'lucide-react';
import type { Book, Category, CurrencyCode } from '../types';
import type { AppView } from './Navbar';
import { BookCard } from './BookCard';

interface HomeViewProps {
  viewMode: 'home' | 'catalog' | 'new-arrivals' | 'authors' | 'categories';
  books: Book[];
  categories: Category[];
  loading: boolean;
  currency: CurrencyCode;
  wishlistIds: Set<number>;
  onToggleWishlist: (book: Book) => void;
  onNavigate: (view: AppView) => void;
  onSelectBook: (book: Book) => void;
  onAddToCart: (book: Book) => void;
  onPreviewSample: (book: Book) => void;
}

interface AuthorSummary {
  name: string;
  books: Book[];
  subjects: string[];
}

export function HomeView({
  viewMode,
  books,
  categories,
  loading,
  currency,
  wishlistIds,
  onToggleWishlist,
  onNavigate,
  onSelectBook,
  onAddToCart,
  onPreviewSample,
}: HomeViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'title'>('newest');

  const newReleaseBooks = useMemo(
    () => books.filter((b) => b.is_new_arrival || b.is_featured).slice(0, 3),
    [books]
  );

  const authorsList = useMemo<AuthorSummary[]>(() => {
    const map = new Map<string, AuthorSummary>();
    for (const book of books) {
      const authorName = book.author.trim();
      if (!authorName) continue;
      const existing = map.get(authorName);
      if (existing) {
        existing.books.push(book);
        if (book.category_name && !existing.subjects.includes(book.category_name)) {
          existing.subjects.push(book.category_name);
        }
      } else {
        map.set(authorName, {
          name: authorName,
          books: [book],
          subjects: book.category_name ? [book.category_name] : [],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [books]);

  const filteredCatalogBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = books.filter((book) => {
      if (viewMode === 'new-arrivals' && !book.is_new_arrival) return false;
      if (selectedCategory !== 'all' && book.category_slug !== selectedCategory) return false;
      if (selectedAuthor !== 'all' && book.author !== selectedAuthor) return false;
      if (!q) return true;
      return (
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        book.isbn.toLowerCase().includes(q) ||
        book.category_name.toLowerCase().includes(q)
      );
    });

    list = [...list].sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return list;
  }, [books, viewMode, selectedCategory, selectedAuthor, searchQuery, sortBy]);

  const handleSelectAuthorFilter = (authorName: string) => {
    setSelectedAuthor(authorName);
    setSelectedCategory('all');
    if (viewMode !== 'catalog') {
      onNavigate('catalog');
    } else {
      const el = document.getElementById('catalog-section');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div>
      {/* Section 1: Corporate Editorial Split Hero (Homepage) */}
      {viewMode === 'home' && (
        <section className="bg-[#0B192C] text-white border-b border-[#1D3557]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-6 px-4 sm:px-6 lg:px-8 py-14 lg:py-20 flex flex-col justify-center space-y-6">
              <div className="w-14 h-px bg-[#C59B27]" />
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#DFC166]">
                Bhagwati Publications · Official Storefront
              </p>
              <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight leading-[1.12] text-white">
                Authoritative books crafted for scholars, institutions, and readers.
              </h1>
              <p className="text-base text-slate-300 leading-relaxed max-w-xl">
                Bhagwati Publications publishes and distributes verified editions across academic
                humanities, architecture, business strategy, and literature. Preview sample PDFs
                and order directly from the publisher.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('catalog')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#C59B27] text-[#07111E] text-sm font-semibold rounded-md hover:bg-[#DFC166] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Explore Book Catalog</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('new-arrivals')}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-white/25 text-white text-sm font-medium rounded-md hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>New Releases</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 relative min-h-[280px] sm:min-h-[360px] lg:min-h-full bg-[#07111E]">
              <img
                src="/src/assets/images/hero_publishing_books_1794839640362.jpg"
                alt="Curated hardcover editions published by Bhagwati Publications"
                referrerPolicy="no-referrer"
                className="w-full h-full lg:h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0B192C]/60 via-transparent to-transparent lg:block hidden pointer-events-none" />
            </div>
          </div>
        </section>
      )}

      {/* Non-Home Subpage Header */}
      {viewMode !== 'home' && (
        <section className="bg-[#0B192C] text-white py-12 border-b border-[#1D3557]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
            <div className="w-12 h-px bg-[#C59B27]" />
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
              {viewMode === 'new-arrivals'
                ? 'New Releases'
                : viewMode === 'authors'
                  ? 'Published Authors'
                  : viewMode === 'categories'
                    ? 'Browse by Category'
                    : 'Complete Book Catalog'}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
              {viewMode === 'new-arrivals'
                ? 'Recently published titles and featured editions from Bhagwati Publications.'
                : viewMode === 'authors'
                  ? 'Discover the scholars, editors, and authors behind our published catalog.'
                  : 'Search by book title, author, or ISBN-13, preview sample PDFs, and order direct.'}
            </p>
          </div>
        </section>
      )}

      {/* Section 2: Corporate Introduction & New Releases (Homepage) */}
      {viewMode === 'home' && (
        <section className="py-14 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
            {/* Company Introduction */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-12 border-b border-slate-200">
              <div className="lg:col-span-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#9F7918]">
                  About Bhagwati Publications
                </p>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B192C] leading-snug">
                  A modern publishing house built on editorial integrity and direct reader access.
                </h2>
              </div>
              <div className="lg:col-span-7 space-y-5">
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  Bhagwati Publications brings together rigorous editorial standards, durable book
                  production, and transparent digital distribution. Every title in our catalog is
                  accompanied by verified ISBN metadata, sample chapter PDF previews, real-time stock
                  availability, and direct inquiry support for individual readers and institutional
                  buyers.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[#0B192C]">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#9F7918] shrink-0" />
                    <span>Verified ISBN-13 Catalog Editions</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#9F7918] shrink-0" />
                    <span>Instant PDF Sample Chapter Previews</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#9F7918] shrink-0" />
                    <span>Direct Cart, Buy Now & Order Tracking</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#9F7918] shrink-0" />
                    <span>WhatsApp & Institutional Bulk Desk</span>
                  </div>
                </div>
              </div>
            </div>

            {/* New Releases Strip */}
            {newReleaseBooks.length > 0 && (
              <div className="space-y-7">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#9F7918]">
                      Recent Publications
                    </p>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B192C] mt-1">
                      New Releases
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('new-arrivals')}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B192C] hover:text-[#9F7918] transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <span>View All New Releases</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
                  {newReleaseBooks.map((book) => (
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
              </div>
            )}
          </div>
        </section>
      )}

      {/* Dedicated Authors Directory (Shown on 'authors' view AND compactly on 'home') */}
      {(viewMode === 'authors' || viewMode === 'home') && authorsList.length > 0 && (
        <section
          className={`py-14 border-b border-slate-200 ${
            viewMode === 'authors' ? 'bg-[#F9FAFB]' : 'bg-[#F3F5F8]'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#9F7918]">
                  Editorial Roster
                </p>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B192C] mt-1">
                  Our Authors & Editors
                </h2>
              </div>
              {viewMode === 'home' && (
                <button
                  type="button"
                  onClick={() => onNavigate('authors')}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B192C] hover:text-[#9F7918] transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <span>Explore All Authors</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {authorsList.map((author) => (
                <div
                  key={author.name}
                  className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between gap-4 hover:border-[#0B192C]/40 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-md bg-[#0B192C] text-[#DFC166] flex items-center justify-center">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <h3 className="font-serif text-lg font-bold text-[#0B192C] leading-snug">
                      {author.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {author.subjects.join(' · ') || 'Published Author'}
                    </p>
                    <p className="text-xs text-slate-600 pt-1 line-clamp-2">
                      Featured title: <span className="font-medium">{author.books[0]?.title}</span>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-500 tabular-nums">
                      {author.books.length} {author.books.length === 1 ? 'Title' : 'Titles'}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        author.books.length === 1
                          ? onSelectBook(author.books[0])
                          : handleSelectAuthorFilter(author.name)
                      }
                      className="font-semibold text-[#0B192C] hover:text-[#9F7918] cursor-pointer"
                    >
                      View Titles →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Section 3: Complete Searchable Book Catalogue */}
      {viewMode !== 'authors' && (
        <section id="catalog-section" className="py-14 bg-[#F9FAFB]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B192C]">
                  {viewMode === 'new-arrivals' ? 'New Releases Catalog' : 'Complete Book Catalog'}
                </h2>
                <p className="text-sm text-slate-600 mt-1 tabular-nums">
                  Showing {filteredCatalogBooks.length}{' '}
                  {filteredCatalogBooks.length === 1 ? 'edition' : 'editions'}
                  {selectedAuthor !== 'all' ? ` by ${selectedAuthor}` : ''}
                </p>
              </div>

              {/* Search & Sort Controls */}
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search title, author, or ISBN..."
                    aria-label="Search books by title, author, or ISBN"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-md text-sm text-[#0B192C] placeholder:text-slate-400 focus:border-[#0B192C] focus:outline-none"
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  aria-label="Sort books"
                  className="px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-sm text-[#0B192C] focus:border-[#0B192C] focus:outline-none cursor-pointer"
                >
                  <option value="newest">Sort: Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="title">Title: A to Z</option>
                </select>
              </div>
            </div>

            {/* Interactive Category Filter Bar */}
            <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Book categories">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedAuthor('all');
                }}
                className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer border ${
                  selectedCategory === 'all' && selectedAuthor === 'all'
                    ? 'bg-[#0B192C] text-white border-[#0B192C]'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                }`}
              >
                All Subjects ({books.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.slug);
                    setSelectedAuthor('all');
                  }}
                  className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer border ${
                    selectedCategory === cat.slug
                      ? 'bg-[#0B192C] text-white border-[#0B192C]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {cat.name} ({cat.book_count})
                </button>
              ))}
              {selectedAuthor !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedAuthor('all')}
                  className="px-3.5 py-2 rounded-md text-xs font-semibold bg-[#C59B27] text-[#07111E] cursor-pointer"
                >
                  Author: {selectedAuthor} ×
                </button>
              )}
            </div>

            {/* Catalog Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
                {[1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200 rounded-lg overflow-hidden animate-pulse"
                  >
                    <div className="aspect-[3/4] bg-slate-200" />
                    <div className="p-5 space-y-3">
                      <div className="h-3 bg-slate-200 rounded w-1/3" />
                      <div className="h-5 bg-slate-200 rounded w-3/4" />
                      <div className="h-4 bg-slate-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredCatalogBooks.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-3">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto" strokeWidth={1.5} />
                <h3 className="font-serif text-xl font-semibold text-[#0B192C]">
                  No matching books found
                </h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Try clearing your search filter or choosing a different subject category.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedAuthor('all');
                  }}
                  className="mt-2 px-4 py-2 bg-[#0B192C] text-white text-xs font-semibold rounded-md hover:bg-[#132642] cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
                {filteredCatalogBooks.map((book) => (
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
      )}
    </div>
  );
}
