import { useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';

export type AppView =
  | 'home'
  | 'catalog'
  | 'new-arrivals'
  | 'authors'
  | 'wishlist'
  | 'categories'
  | 'book'
  | 'support'
  | 'admin';

interface NavbarProps {
  currentView: AppView;
  cartCount: number;
  wishlistCount: number;
  onNavigate: (view: AppView) => void;
  onOpenCart: () => void;
}

export function Navbar({
  currentView,
  cartCount,
  wishlistCount,
  onNavigate,
  onOpenCart,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: Array<{ id: AppView; label: string }> = [
    { id: 'catalog', label: 'Catalog' },
    { id: 'new-arrivals', label: 'New Releases' },
    { id: 'authors', label: 'Authors' },
    {
      id: 'wishlist',
      label: wishlistCount > 0 ? `My Wishlist (${wishlistCount})` : 'My Wishlist',
    },
    { id: 'support', label: 'Support' },
    { id: 'admin', label: 'Admin' },
  ];

  const handleNav = (view: AppView) => {
    setMobileOpen(false);
    onNavigate(view);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="font-serif text-xl font-bold tracking-tight text-[#0B192C] hover:text-[#132642] transition-colors whitespace-nowrap shrink-0 text-left cursor-pointer"
        >
          Bhagwati Publications
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav aria-label="Primary Navigation" className="hidden lg:flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
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

        {/* Zone 3: Primary Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B192C] text-white text-sm font-medium rounded-md hover:bg-[#132642] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-[#DFC166]" strokeWidth={1.75} />
            <span>Bag</span>
            <span className="font-mono text-xs tabular-nums text-[#DFC166]">({cartCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="lg:hidden p-2.5 text-[#0B192C] border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className={`block w-full text-left px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer ${
                currentView === item.id
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
