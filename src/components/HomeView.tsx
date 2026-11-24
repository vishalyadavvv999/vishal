import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Newspaper,
  Search,
  SlidersHorizontal,
  UserCheck,
  X,
} from 'lucide-react';
import type {
  AuthorProfile,
  Book,
  Category,
  CurrencyCode,
  PublicationUpdate,
  StoreConfig,
} from '../types';
import { formatDate } from '../lib/currency';
import { LanguageToggle, useLanguage } from '../lib/i18n';
import type { AppView } from './Navbar';
import { BookCard } from './BookCard';
import { LeadershipSection } from './LeadershipSection';
import { RecommendedBooks } from './RecommendedBooks';

interface HomeViewProps {
  viewMode: 'home' | 'catalog' | 'new-arrivals' | 'authors' | 'categories';
  storeConfig: StoreConfig;
  books: Book[];
  categories: Category[];
  authors: AuthorProfile[];
  updates: PublicationUpdate[];
  loading: boolean;
  currency: CurrencyCode;
  wishlistIds: Set<number>;
  externalSearchQuery?: string;
  externalSearchTrigger?: number;
  onToggleWishlist: (book: Book) => void;
  onNavigate: (view: AppView) => void;
  onSelectBook: (book: Book) => void;
  onSelectAuthor: (authorSlug: string) => void;
  onAddToCart: (book: Book) => void;
  onPreviewSample: (book: Book) => void;
}

export function HomeView({
  viewMode,
  storeConfig,
  books,
  categories,
  authors,
  updates,
  loading,
  currency,
  wishlistIds,
  externalSearchQuery,
  externalSearchTrigger,
  onToggleWishlist,
  onNavigate,
  onSelectBook,
  onSelectAuthor,
  onAddToCart,
  onPreviewSample,
}: HomeViewProps) {
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedBinding, setSelectedBinding] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<
    'newest' | 'bestselling' | 'rating' | 'price_asc' | 'price_desc' | 'title'
  >('newest');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);

  useEffect(() => {
    if (!externalSearchTrigger) return;
    setSearchQuery(externalSearchQuery || '');
    setSelectedCategory('all');
    setSelectedAuthor('all');
    setSelectedLanguage('all');
    setSelectedBinding('all');
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setCurrentPage(1);
  }, [externalSearchTrigger, externalSearchQuery]);

  const newReleaseBooks = useMemo(
    () => books.filter((b) => b.is_new_arrival).slice(0, 3),
    [books]
  );

  const featuredBooks = useMemo(
    () => books.filter((b) => b.is_featured).slice(0, 3),
    [books]
  );

  const hasOrderSales = useMemo(
    () => books.some((b) => (b.units_sold || 0) > 0),
    [books]
  );

  const bestSellerBooks = useMemo(() => {
    const sorted = [...books].sort((a, b) => {
      const salesDiff = (b.units_sold || 0) - (a.units_sold || 0);
      if (salesDiff !== 0) return salesDiff;
      const revDiff = (b.review_count || 0) - (a.review_count || 0);
      if (revDiff !== 0) return revDiff;
      const ratingDiff = (b.average_rating || 0) - (a.average_rating || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return Number(b.is_featured) - Number(a.is_featured);
    });
    return sorted.slice(0, 3);
  }, [books]);

  const availableLanguages = useMemo(() => {
    const set = new Set<string>();
    for (const b of books) {
      if (b.language?.trim()) set.add(b.language.trim());
    }
    return Array.from(set).sort();
  }, [books]);

  const availableBindings = useMemo(() => {
    const set = new Set<string>();
    for (const b of books) {
      if (b.binding?.trim()) set.add(b.binding.trim());
    }
    return Array.from(set).sort();
  }, [books]);

  // Display authors backed by the database `authors` list, enriched with catalog books
  const displayAuthors = useMemo(() => {
    if (authors.length > 0) {
      return authors.map((auth) => {
        const authBooks = books.filter(
          (b) =>
            (b.author_slug && b.author_slug === auth.slug) ||
            b.author.trim().toLowerCase() === auth.name.trim().toLowerCase()
        );
        const existingSubjects = auth.subjects ?? [];
        return {
          ...auth,
          books: authBooks,
          subjects: existingSubjects.length
            ? existingSubjects
            : Array.from(new Set(authBooks.map((b) => b.category_name).filter(Boolean))),
        };
      });
    }

    const map = new Map<
      string,
      AuthorProfile & { books: Book[]; subjects: string[] }
    >();
    for (const book of books) {
      const name = book.author.trim();
      if (!name) continue;
      const slug = book.author_slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const existing = map.get(name);
      if (existing) {
        existing.books.push(book);
        existing.book_count += 1;
        if (book.category_name && !existing.subjects.includes(book.category_name)) {
          existing.subjects.push(book.category_name);
        }
      } else {
        map.set(name, {
          id: book.id,
          name,
          slug,
          credentials: '',
          affiliation: '',
          location: '',
          bio: '',
          book_count: 1,
          subjects: book.category_name ? [book.category_name] : [],
          languages: book.language ? [book.language] : [],
          created_at: book.created_at,
          books: [book],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [authors, books]);

  const activeAdvancedFilterCount = useMemo(() => {
    let count = 0;
    if (selectedLanguage !== 'all') count++;
    if (selectedBinding !== 'all') count++;
    if (minPrice.trim() !== '') count++;
    if (maxPrice.trim() !== '') count++;
    if (inStockOnly) count++;
    return count;
  }, [selectedLanguage, selectedBinding, minPrice, maxPrice, inStockOnly]);

  const filteredCatalogBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const minVal = minPrice.trim() !== '' ? Number(minPrice) : null;
    const maxVal = maxPrice.trim() !== '' ? Number(maxPrice) : null;

    let list = books.filter((book) => {
      if (viewMode === 'new-arrivals' && !book.is_new_arrival) return false;
      if (selectedCategory !== 'all' && book.category_slug !== selectedCategory) return false;
      if (selectedAuthor !== 'all' && book.author !== selectedAuthor) return false;
      if (
        selectedLanguage !== 'all' &&
        book.language.toLowerCase() !== selectedLanguage.toLowerCase()
      ) {
        return false;
      }
      if (
        selectedBinding !== 'all' &&
        book.binding.toLowerCase() !== selectedBinding.toLowerCase()
      ) {
        return false;
      }
      if (inStockOnly && (!book.is_available || book.stock_quantity <= 0)) return false;
      if (minVal !== null && !Number.isNaN(minVal) && book.price < minVal) return false;
      if (maxVal !== null && !Number.isNaN(maxVal) && book.price > maxVal) return false;
      if (!q) return true;
      return (
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        book.isbn.toLowerCase().includes(q) ||
        book.category_name.toLowerCase().includes(q) ||
        book.description.toLowerCase().includes(q)
      );
    });

    list = [...list].sort((a, b) => {
      if (sortBy === 'bestselling') {
        const salesDiff = (b.units_sold || 0) - (a.units_sold || 0);
        if (salesDiff !== 0) return salesDiff;
        const ratingDiff = (b.average_rating || 0) - (a.average_rating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        return (b.review_count || 0) - (a.review_count || 0);
      }
      if (sortBy === 'rating') {
        const rDiff = (b.average_rating ?? 0) - (a.average_rating ?? 0);
        if (rDiff !== 0) return rDiff;
        return (b.review_count ?? 0) - (a.review_count ?? 0);
      }
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return list;
  }, [
    books,
    viewMode,
    selectedCategory,
    selectedAuthor,
    selectedLanguage,
    selectedBinding,
    inStockOnly,
    minPrice,
    maxPrice,
    searchQuery,
    sortBy,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    viewMode,
    searchQuery,
    selectedCategory,
    selectedAuthor,
    selectedLanguage,
    selectedBinding,
    minPrice,
    maxPrice,
    inStockOnly,
    sortBy,
    pageSize,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredCatalogBooks.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedCatalogBooks = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredCatalogBooks.slice(start, start + pageSize);
  }, [filteredCatalogBooks, safePage, pageSize]);

  const handlePageChange = (nextPage: number) => {
    setCurrentPage(nextPage);
    const el = document.getElementById('catalog-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedAuthor('all');
    setSelectedLanguage('all');
    setSelectedBinding('all');
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setSortBy('newest');
    setCurrentPage(1);
  };

  const recentUpdates = useMemo(() => updates.slice(0, 3), [updates]);

  return (
    <div>
      {/* Section 1: Corporate Editorial Split Hero (Homepage) */}
      {viewMode === 'home' && (
        <section className="bg-[#0B192C] text-white border-b border-[#1D3557]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-6 px-4 sm:px-6 lg:px-8 py-14 lg:py-20 flex flex-col justify-center space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="w-14 h-px bg-[#C59B27]" />
                <LanguageToggle variant="dark" />
              </div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#DFC166]">
                {t('heroEyebrow')}
              </p>
              <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight leading-[1.12] text-white">
                {t('heroTitle')}
              </h1>
              <p className="text-base text-slate-300 leading-relaxed max-w-xl">
                {t('heroSubtitle')}
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('catalog')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#C59B27] text-[#07111E] text-sm font-semibold rounded-md hover:bg-[#DFC166] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>{t('heroExploreCatalog')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('new-arrivals')}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-white/25 text-white text-sm font-medium rounded-md hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>{t('heroNewReleases')}</span>
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="w-12 h-px bg-[#C59B27]" />
              <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
                {viewMode === 'new-arrivals'
                  ? t('newReleasesTitle')
                  : viewMode === 'authors'
                    ? t('ourAuthorsTitle')
                    : viewMode === 'categories'
                      ? language === 'hi'
                        ? 'विषय अनुसार पुस्तकें'
                        : 'Browse by Category'
                      : t('catalogTitle')}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
                {viewMode === 'new-arrivals'
                  ? language === 'hi'
                    ? 'भगवती पब्लिकेशंस के नवीनतम प्रकाशित संस्करण और प्रमुख पुस्तकें।'
                    : 'Recently published titles and featured editions from Bhagwati Publications.'
                  : viewMode === 'authors'
                    ? language === 'hi'
                      ? 'हमारी प्रकाशित पुस्तकों के विद्वानों, संपादकों और लेखकों से मिलें।'
                      : 'Discover the scholars, editors, and authors behind our published catalog.'
                    : language === 'hi'
                      ? 'शीर्षक, लेखक, भाषा, मूल्य या ISBN-13 द्वारा खोजें और इंटरैक्टिव प्रीव्यू पढ़ें।'
                      : 'Search by title, author, language, binding, or ISBN-13, preview chapters, and order direct.'}
              </p>
            </div>
            <LanguageToggle variant="dark" />
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
                  {t('aboutEyebrow')}
                </p>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B192C] leading-snug">
                  {t('aboutHeading')}
                </h2>
              </div>
              <div className="lg:col-span-7 space-y-5">
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {t('aboutBody')}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[#0B192C]">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#9F7918] shrink-0" />
                    <span>{t('aboutPoint1')}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#9F7918] shrink-0" />
                    <span>{t('aboutPoint2')}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#9F7918] shrink-0" />
                    <span>{t('aboutPoint3')}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#9F7918] shrink-0" />
                    <span>{t('aboutPoint4')}</span>
                  </div>
                </div>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => onNavigate('about')}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B192C] hover:text-[#9F7918] transition-colors cursor-pointer"
                  >
                    <span>
                      {language === 'hi'
                        ? 'हमारे बारे में और नेतृत्व परिचय देखें'
                        : 'About Us & Leadership'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* New Releases Strip */}
            {newReleaseBooks.length > 0 && (
              <div className="space-y-7">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#9F7918]">
                      {t('recentPublications')}
                    </p>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B192C] mt-1">
                      {t('newReleasesTitle')}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('new-arrivals')}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B192C] hover:text-[#9F7918] transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <span>{t('viewAllNewReleases')}</span>
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
                      onSelectAuthor={onSelectAuthor}
                      onAddToCart={onAddToCart}
                      onPreviewSample={onPreviewSample}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Featured Books Strip */}
            {featuredBooks.length > 0 && (
              <div className="space-y-7 pt-10 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#9F7918]">
                      {t('featuredEyebrow')}
                    </p>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B192C] mt-1">
                      {t('featuredTitle')}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('catalog')}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B192C] hover:text-[#9F7918] transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <span>{t('heroExploreCatalog')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
                  {featuredBooks.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      currency={currency}
                      isWishlisted={wishlistIds.has(book.id)}
                      onToggleWishlist={onToggleWishlist}
                      onSelectBook={onSelectBook}
                      onSelectAuthor={onSelectAuthor}
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

      {/* Section 2A: Best Sellers & Recommended Books (Homepage) */}
      {viewMode === 'home' && books.length > 0 && (
        <section className="py-14 bg-[#F3F5F8] border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            {bestSellerBooks.length > 0 && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#9F7918]">
                      {t('bestSellersEyebrow')}
                    </p>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B192C] mt-1">
                      {t('bestSellersTitle')}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      {hasOrderSales
                        ? language === 'hi'
                          ? 'लाइव ग्राहक ऑर्डर और पाठक रेटिंग के आधार पर क्रमबद्ध।'
                          : 'Ranked by verified customer orders and reader ratings.'
                        : language === 'hi'
                          ? 'पाठकों की रेटिंग और प्रमुख संस्करणों के आधार पर क्रमबद्ध (ऑर्डर प्राप्त होने पर बिक्री क्रम स्वतः अपडेट होता है)।'
                          : 'Ranked by reader ratings and flagship editions (updates automatically as customer orders are placed).'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy('bestselling');
                      const el = document.getElementById('catalog-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B192C] hover:text-[#9F7918] transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <span>{t('sortBestselling')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
                  {bestSellerBooks.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      currency={currency}
                      isWishlisted={wishlistIds.has(book.id)}
                      onToggleWishlist={onToggleWishlist}
                      onSelectBook={onSelectBook}
                      onSelectAuthor={onSelectAuthor}
                      onAddToCart={onAddToCart}
                      onPreviewSample={onPreviewSample}
                    />
                  ))}
                </div>
              </div>
            )}

            <RecommendedBooks
              allBooks={books}
              referenceBooks={featuredBooks.length > 0 ? featuredBooks : books.slice(0, 2)}
              excludeIds={[]}
              title={t('recommendedTitle')}
              subtitle={
                language === 'hi'
                  ? 'विषय, लेखक और पाठक रेटिंग के आधार पर आपके संग्रह के लिए चयनित।'
                  : 'Curated from matching academic subjects, authors, and reader ratings across our catalog.'
              }
              currency={currency}
              wishlistIds={wishlistIds}
              onToggleWishlist={onToggleWishlist}
              onSelectBook={onSelectBook}
              onAddToCart={onAddToCart}
              onPreviewSample={onPreviewSample}
              onSelectAuthor={onSelectAuthor}
            />
          </div>
        </section>
      )}

      {/* Section 2B: About the Founder / Leadership Profile (Homepage) */}
      {viewMode === 'home' && <LeadershipSection storeConfig={storeConfig} />}

      {/* Dedicated Authors Directory (Shown on 'authors' view AND compactly on 'home') */}
      {(viewMode === 'authors' || viewMode === 'home') && displayAuthors.length > 0 && (
        <section
          className={`py-14 border-b border-slate-200 ${
            viewMode === 'authors' ? 'bg-[#F9FAFB]' : 'bg-[#F3F5F8]'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#9F7918]">
                  {t('editorialRoster')}
                </p>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B192C] mt-1">
                  {t('ourAuthorsTitle')}
                </h2>
              </div>
              {viewMode === 'home' && (
                <button
                  type="button"
                  onClick={() => onNavigate('authors')}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B192C] hover:text-[#9F7918] transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <span>{t('exploreAllAuthors')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayAuthors.map((author) => (
                <div
                  key={author.slug}
                  className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between gap-4 hover:border-[#0B192C]/40 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-md bg-[#0B192C] text-[#DFC166] flex items-center justify-center">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectAuthor(author.slug)}
                      className="text-left font-serif text-lg font-bold text-[#0B192C] hover:text-[#9F7918] leading-snug transition-colors cursor-pointer"
                    >
                      {author.name}
                    </button>
                    {author.credentials && (
                      <p className="text-xs font-medium text-[#9F7918]">{author.credentials}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      {author.subjects.join(' · ') || 'Published Author'}
                    </p>
                    {author.books[0] && (
                      <p className="text-xs text-slate-600 pt-1 line-clamp-2">
                        {language === 'hi' ? 'प्रमुख पुस्तक:' : 'Featured:'}{' '}
                        <span className="font-medium">{author.books[0].title}</span>
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-500 tabular-nums">
                      {author.book_count}{' '}
                      {language === 'hi'
                        ? 'पुस्तकें'
                        : author.book_count === 1
                          ? 'Title'
                          : 'Titles'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectAuthor(author.slug)}
                      className="font-semibold text-[#0B192C] hover:text-[#9F7918] cursor-pointer"
                    >
                      {t('viewProfile')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Homepage News & Publication Updates Preview */}
      {viewMode === 'home' && recentUpdates.length > 0 && (
        <section className="py-12 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#9F7918]">
                  {t('updatesEyebrow')}
                </p>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B192C] mt-1">
                  {t('updatesTitle')}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('updates')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B192C] hover:text-[#9F7918] transition-colors cursor-pointer self-start sm:self-auto"
              >
                <span>{t('viewAllUpdates')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentUpdates.map((upd) => {
                const linkedBook = upd.related_book_id
                  ? books.find((b) => b.id === upd.related_book_id) || null
                  : null;
                return (
                  <article
                    key={upd.id}
                    className="bg-[#F9FAFB] border border-slate-200 rounded-lg p-5 flex flex-col justify-between gap-4 hover:border-[#0B192C]/35 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                        <Newspaper className="w-3.5 h-3.5 text-[#9F7918]" />
                        <span className="uppercase font-semibold text-[#9F7918]">
                          {upd.category}
                        </span>
                        <span>·</span>
                        <span>{formatDate(upd.published_at)}</span>
                      </div>
                      <h3 className="font-serif text-lg font-bold text-[#0B192C] leading-snug">
                        {upd.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {upd.summary}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => onNavigate('updates')}
                        className="font-semibold text-[#0B192C] hover:text-[#9F7918] cursor-pointer"
                      >
                        {language === 'hi' ? 'पूरा पढ़ें →' : 'Read Dispatch →'}
                      </button>
                      {linkedBook && (
                        <button
                          type="button"
                          onClick={() => onSelectBook(linkedBook)}
                          className="text-slate-600 hover:text-[#0B192C] truncate max-w-[140px] cursor-pointer"
                          title={linkedBook.title}
                        >
                          {linkedBook.title}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Category Directory Cards (when visiting /categories) */}
      {viewMode === 'categories' && categories.length > 0 && (
        <section className="py-12 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9F7918]">
                {language === 'hi' ? 'प्रकाशन विषय' : 'Subject Disciplines'}
              </p>
              <h2 className="font-serif text-2xl font-bold text-[#0B192C] mt-1">
                {t('browseCategoriesTitle')}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {categories.map((cat) => {
                const active = selectedCategory === cat.slug;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.slug);
                      setSelectedAuthor('all');
                      const el = document.getElementById('catalog-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className={`text-left p-5 rounded-lg border transition-colors flex flex-col justify-between gap-4 cursor-pointer ${
                      active
                        ? 'bg-[#0B192C] text-white border-[#0B192C]'
                        : 'bg-[#F9FAFB] text-[#0B192C] border-slate-200 hover:border-[#0B192C]/40'
                    }`}
                  >
                    <div className="space-y-2">
                      <FolderOpen
                        className={`w-5 h-5 ${active ? 'text-[#DFC166]' : 'text-[#9F7918]'}`}
                      />
                      <h3 className="font-serif text-lg font-bold leading-snug">{cat.name}</h3>
                      {cat.description && (
                        <p
                          className={`text-xs leading-relaxed line-clamp-3 ${
                            active ? 'text-slate-300' : 'text-slate-600'
                          }`}
                        >
                          {cat.description}
                        </p>
                      )}
                    </div>
                    <p
                      className={`text-xs font-mono tabular-nums ${
                        active ? 'text-[#DFC166]' : 'text-slate-500'
                      }`}
                    >
                      {cat.book_count}{' '}
                      {language === 'hi'
                        ? 'पुस्तकें'
                        : cat.book_count === 1
                          ? 'Edition'
                          : 'Editions'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Section 3: Complete Searchable Book Catalogue with Advanced Filters & Pagination */}
      {viewMode !== 'authors' && (
        <section id="catalog-section" className="py-14 bg-[#F9FAFB]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B192C]">
                  {viewMode === 'new-arrivals'
                    ? t('newReleasesCatalogTitle')
                    : t('catalogTitle')}
                </h2>
                <p className="text-sm text-slate-600 mt-1 tabular-nums">
                  {filteredCatalogBooks.length === 0
                    ? language === 'hi'
                      ? '0 संस्करण प्रदर्शित'
                      : 'Showing 0 editions'
                    : language === 'hi'
                      ? `${filteredCatalogBooks.length} में से ${(safePage - 1) * pageSize + 1}–${Math.min(
                          safePage * pageSize,
                          filteredCatalogBooks.length
                        )} संस्करण`
                      : `Showing ${(safePage - 1) * pageSize + 1}–${Math.min(
                          safePage * pageSize,
                          filteredCatalogBooks.length
                        )} of ${filteredCatalogBooks.length} ${
                          filteredCatalogBooks.length === 1 ? 'edition' : 'editions'
                        }`}
                  {selectedAuthor !== 'all' ? ` · ${selectedAuthor}` : ''}
                </p>
              </div>

              {/* Search, Filters Toggle & Sort Controls */}
              <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full lg:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                    aria-label="Search books by title, author, ISBN, or topic"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-md text-sm text-[#0B192C] placeholder:text-slate-400 focus:border-[#0B192C] focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setFiltersOpen((o) => !o)}
                  aria-expanded={filtersOpen}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 border rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    filtersOpen || activeAdvancedFilterCount > 0
                      ? 'bg-[#0B192C] text-white border-[#0B192C]'
                      : 'bg-white text-[#0B192C] border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>{t('advancedFilters')}</span>
                  {activeAdvancedFilterCount > 0 && (
                    <span className="font-mono text-xs text-[#DFC166] tabular-nums">
                      ({activeAdvancedFilterCount})
                    </span>
                  )}
                </button>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  aria-label="Sort books"
                  className="px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-sm text-[#0B192C] focus:border-[#0B192C] focus:outline-none cursor-pointer"
                >
                  <option value="newest">{t('sortNewest')}</option>
                  <option value="bestselling">{t('sortBestselling')}</option>
                  <option value="rating">{t('sortRating')}</option>
                  <option value="price_asc">{t('sortPriceAsc')}</option>
                  <option value="price_desc">{t('sortPriceDesc')}</option>
                  <option value="title">{t('sortTitle')}</option>
                </select>
              </div>
            </div>

            {/* Expandable Advanced Filter Bar */}
            {filtersOpen && (
              <div className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {language === 'hi' ? 'भाषा' : 'Language'}
                  </label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-[#0B192C]"
                  >
                    <option value="all">{t('allLanguages')}</option>
                    {availableLanguages.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {language === 'hi' ? 'संस्करण / बाइंडिंग' : 'Binding Format'}
                  </label>
                  <select
                    value={selectedBinding}
                    onChange={(e) => setSelectedBinding(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-[#0B192C]"
                  >
                    <option value="all">{t('allBindings')}</option>
                    {availableBindings.map((bind) => (
                      <option key={bind} value={bind}>
                        {bind}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {t('minPrice')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {t('maxPrice')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="5000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono tabular-nums"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-[#0B192C] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="accent-[#0B192C]"
                    />
                    <span>{t('inStockOnly')}</span>
                  </label>

                  {(activeAdvancedFilterCount > 0 ||
                    searchQuery ||
                    selectedCategory !== 'all' ||
                    selectedAuthor !== 'all') && (
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-800 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{t('resetFilters')}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

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
                {t('allSubjects')} ({books.length})
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
                  {selectedAuthor} ×
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
                  {language === 'hi' ? 'कोई मेल खाने वाली पुस्तक नहीं मिली' : 'No matching books found'}
                </h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  {language === 'hi'
                    ? 'कृपया खोज फ़िल्टर हटाएँ या अन्य विषय/भाषा चुनें।'
                    : 'Try clearing your search filters or choosing a different subject, language, or price range.'}
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="mt-2 px-4 py-2 bg-[#0B192C] text-white text-xs font-semibold rounded-md hover:bg-[#132642] cursor-pointer"
                >
                  {t('resetFilters')}
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
                  {paginatedCatalogBooks.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      currency={currency}
                      isWishlisted={wishlistIds.has(book.id)}
                      onToggleWishlist={onToggleWishlist}
                      onSelectBook={onSelectBook}
                      onSelectAuthor={onSelectAuthor}
                      onAddToCart={onAddToCart}
                      onPreviewSample={onPreviewSample}
                    />
                  ))}
                </div>

                {/* Catalog Pagination Controls */}
                <nav
                  aria-label="Catalog pagination"
                  className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-3 text-slate-600">
                    <span className="tabular-nums">
                      {language === 'hi'
                        ? `पृष्ठ ${safePage} / ${totalPages}`
                        : `Page ${safePage} of ${totalPages}`}
                    </span>
                    <span aria-hidden="true">·</span>
                    <label className="inline-flex items-center gap-1.5">
                      <span>{t('perPage')}:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        aria-label="Books per page"
                        className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono text-[#0B192C] cursor-pointer"
                      >
                        <option value={3}>3</option>
                        <option value={6}>6</option>
                        <option value={12}>12</option>
                        <option value={24}>24</option>
                      </select>
                    </label>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={safePage <= 1}
                      onClick={() => handlePageChange(safePage - 1)}
                      className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-slate-300 rounded-md font-semibold text-[#0B192C] hover:bg-slate-50 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>{t('prevPage')}</span>
                    </button>

                    {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        aria-current={pageNum === safePage ? 'page' : undefined}
                        className={`w-8 h-8 rounded-md font-mono font-semibold tabular-nums border transition-colors cursor-pointer ${
                          pageNum === safePage
                            ? 'bg-[#0B192C] text-white border-[#0B192C]'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={safePage >= totalPages}
                      onClick={() => handlePageChange(safePage + 1)}
                      className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-slate-300 rounded-md font-semibold text-[#0B192C] hover:bg-slate-50 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <span>{t('nextPage')}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </nav>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
