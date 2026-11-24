import { useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';
import type { AuthorProfile, Book, CurrencyCode } from '../types';
import { useLanguage } from '../lib/i18n';
import { GlobalSearchBar } from './GlobalSearchBar';

export type AppView =
  | 'home'
  | 'catalog'
  | 'new-arrivals'
  | 'authors'
  | 'author'
  | 'updates'
  | 'about'
  | 'wishlist'
  | 'categories'
  | 'book'
  | 'support'
  | 'admin';

interface NavbarProps {
  currentView: AppView;
  cartCount: number;
  wishlistCount: number;
  books: Book[];
  authors: AuthorProfile[];
  currency: CurrencyCode;
  onNavigate: (view: AppView) => void;
  onSelectBook: (book: Book) => void;
  onSelectAuthor: (authorSlug: string) => void;
  onSubmitGlobalSearch: (query: string) => void;
  onOpenCart: () => void;
}

export function Navbar({
  currentView,
  cartCount,
  wishlistCount,
  books,
  authors,
  currency,
  onNavigate,
  onSelectBook,
  onSelectAuthor,
  onSubmitGlobalSearch,
  onOpenCart,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLanguage();

  const navItems: Array<{ id: AppView; label: string }> = [
    { id: 'catalog', label: t('navCatalog') },
    { id: 'new-arrivals', label: t('navNewReleases') },
    { id: 'authors', label: t('navAuthors') },
    { id: 'updates', label: t('navUpdates') },
    { id: 'about', label: t('navAbout') },
    {
      id: 'wishlist',
      label: wishlistCount > 0 ? `${t('navWishlist')} (${wishlistCount})` : t('navWishlist'),
    },
    { id: 'support', label: t('navSupport') },
    { id: 'admin', label: t('navAdmin') },
  ];

  const handleNav = (view: AppView) => {
    setMobileOpen(false);
    onNavigate(view);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 xl:gap-5">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="font-serif text-base sm:text-lg xl:text-xl font-bold tracking-tight text-[#0B192C] hover:text-[#132642] transition-colors whitespace-nowrap shrink-0 text-left cursor-pointer"
        >
          {t('brandName')}
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden lg:flex items-center gap-2.5 xl:gap-4"
        >
          {navItems.map((item) => {
            const isActive =
              currentView === item.id || (item.id === 'authors' && currentView === 'author');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`text-[13px] xl:text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#0B192C] border-[#B8860B]'
                    : 'text-slate-600 border-transparent hover:text-[#0B192C] hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Global Header Search + Bag Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="hidden lg:block">
            <GlobalSearchBar
              books={books}
              authors={authors}
              currency={currency}
              variant="desktop"
              onSelectBook={onSelectBook}
              onSelectAuthor={onSelectAuthor}
              onSubmitSearch={onSubmitGlobalSearch}
              onAfterNavigate={() => setMobileOpen(false)}
            />
          </div>

          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-[#0B192C] text-white text-sm font-medium rounded-md hover:bg-[#132642] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-[#DFC166]" strokeWidth={1.75} />
            <span>{t('navBag')}</span>
            <span className="font-mono text-xs tabular-nums text-[#DFC166]">({cartCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="lg:hidden p-2 text-[#0B192C] border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Global Header Search Strip */}
      <div className="lg:hidden border-t border-slate-100 bg-slate-50/75 px-4 sm:px-6 py-2">
        <GlobalSearchBar
          books={books}
          authors={authors}
          currency={currency}
          variant="mobile"
          onSelectBook={onSelectBook}
          onSelectAuthor={onSelectAuthor}
          onSubmitSearch={onSubmitGlobalSearch}
          onAfterNavigate={() => setMobileOpen(false)}
        />
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className={`block w-full text-left px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer ${
                currentView === item.id || (item.id === 'authors' && currentView === 'author')
                  ? 'bg-[#0B192C] text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
