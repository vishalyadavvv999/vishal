import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AdminUser,
  Book,
  CartItem,
  Category,
  CustomerUser,
  StoreConfig,
} from './types';
import { api } from './lib/api';
import { applySeoMetadata } from './lib/seo';
import { Navbar, type AppView } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { BookDetailView } from './components/BookDetailView';
import { WishlistView } from './components/WishlistView';
import { SupportView } from './components/SupportView';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { PdfPreviewModal } from './components/PdfPreviewModal';
import { WhatsAppInquiryModal } from './components/WhatsAppInquiryModal';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';

const DEFAULT_STORE_CONFIG: StoreConfig = {
  publisher_name: 'Bhagwati Publications',
  support_email: '',
  support_phone: '',
  whatsapp_number: '',
  business_address: '',
  currency: 'INR',
  free_shipping_threshold: 999,
  standard_shipping_fee: 60,
  payment_cod_enabled: true,
  payment_upi_enabled: false,
  payment_upi_id: '',
  payment_gateway_provider: 'none',
  payment_gateway_public_key: '',
  payment_gateway_mode: 'test',
};

const CART_STORAGE_KEY = 'bhagwati_publications_cart_v1';
const WISHLIST_STORAGE_KEY = 'bhagwati_publications_wishlist_v1';

const VIEW_TO_PATH: Record<Exclude<AppView, 'book'>, string> = {
  home: '/',
  catalog: '/catalog',
  'new-arrivals': '/new-releases',
  authors: '/authors',
  wishlist: '/wishlist',
  categories: '/categories',
  support: '/support',
  admin: '/admin',
};

function parseRouteFromLocation(): { view: AppView; bookSlugOrId: string | null } {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path.startsWith('/books/')) {
    const slugOrId = decodeURIComponent(path.slice('/books/'.length));
    if (slugOrId) return { view: 'book', bookSlugOrId: slugOrId };
  }
  if (path === '/catalog') return { view: 'catalog', bookSlugOrId: null };
  if (path === '/new-releases' || path === '/new-arrivals') {
    return { view: 'new-arrivals', bookSlugOrId: null };
  }
  if (path === '/authors') return { view: 'authors', bookSlugOrId: null };
  if (path === '/wishlist') return { view: 'wishlist', bookSlugOrId: null };
  if (path === '/categories') return { view: 'categories', bookSlugOrId: null };
  if (path === '/support') return { view: 'support', bookSlugOrId: null };
  if (path === '/admin') return { view: 'admin', bookSlugOrId: null };
  return { view: 'home', bookSlugOrId: null };
}

export default function App() {
  const initialRoute = useMemo(() => parseRouteFromLocation(), []);
  const [currentView, setCurrentView] = useState<AppView>(initialRoute.view);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [pendingBookSlug, setPendingBookSlug] = useState<string | null>(initialRoute.bookSlugOrId);

  const [storeConfig, setStoreConfig] = useState<StoreConfig>(DEFAULT_STORE_CONFIG);
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) return JSON.parse(raw) as CartItem[];
    } catch {
      // ignore storage issues
    }
    return [];
  });

  const [wishlist, setWishlist] = useState<Book[]>(() => {
    try {
      const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (raw) return JSON.parse(raw) as Book[];
    } catch {
      // ignore storage issues
    }
    return [];
  });

  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [previewBook, setPreviewBook] = useState<Book | null>(null);
  const [whatsAppBook, setWhatsAppBook] = useState<Book | null>(null);

  // Admin auth state
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(false);

  // Customer reader auth state
  const [customerUser, setCustomerUser] = useState<CustomerUser | null>(null);
  const [customerAuthOpen, setCustomerAuthOpen] = useState(false);
  const [customerAuthMode, setCustomerAuthMode] = useState<'login' | 'register'>('login');

  const checkAdminSession = useCallback(async () => {
    setCheckingAuth(true);
    try {
      const res = await api.adminMe();
      setAdminUser(res.admin);
    } catch {
      setAdminUser(null);
    } finally {
      setCheckingAuth(false);
    }
  }, []);

  const loadStorefront = useCallback(async () => {
    setLoadingCatalog(true);
    try {
      const [configRes, booksRes, categoriesRes] = await Promise.all([
        api.getStoreConfig(),
        api.getBooks(),
        api.getCategories(),
      ]);
      setStoreConfig(configRes);
      setBooks(booksRes);
      setCategories(categoriesRes);
      setSelectedBook((prev) => {
        if (!prev) return null;
        return booksRes.find((b) => b.id === prev.id) || prev;
      });
      setWishlist((prev) =>
        prev
          .map((saved) => booksRes.find((b) => b.id === saved.id))
          .filter((b): b is Book => Boolean(b))
      );
    } catch {
      // Graceful fallback while server initializes
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    loadStorefront();
    api
      .customerMe()
      .then((res) => setCustomerUser(res.customer))
      .catch(() => setCustomerUser(null));
    if (initialRoute.view === 'admin') {
      checkAdminSession();
    }
  }, [loadStorefront, checkAdminSession, initialRoute.view]);

  // Resolve deep-linked /books/:slug on initial load or popstate
  useEffect(() => {
    if (!pendingBookSlug) return;
    let cancelled = false;
    const matched = books.find(
      (b) => b.slug === pendingBookSlug || String(b.id) === pendingBookSlug
    );
    if (matched) {
      setSelectedBook(matched);
      setPendingBookSlug(null);
      return;
    }
    api
      .getBook(pendingBookSlug)
      .then((fresh) => {
        if (!cancelled) {
          setSelectedBook(fresh);
          setCurrentView('book');
          setPendingBookSlug(null);
        }
      })
      .catch(() => {
        if (!cancelled && !loadingCatalog) {
          setPendingBookSlug(null);
          setCurrentView('catalog');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [pendingBookSlug, books, loadingCatalog]);

  // Browser back/forward button support
  useEffect(() => {
    const onPopState = () => {
      const route = parseRouteFromLocation();
      setCurrentView(route.view);
      if (route.view === 'book' && route.bookSlugOrId) {
        setPendingBookSlug(route.bookSlugOrId);
      } else {
        setPendingBookSlug(null);
        setSelectedBook(null);
      }
      if (route.view === 'admin') {
        checkAdminSession();
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [checkAdminSession]);

  // Dynamically update document title, meta description, Open Graph, Twitter cards, and JSON-LD
  useEffect(() => {
    applySeoMetadata({
      view: currentView,
      book: selectedBook,
      storeConfig,
    });
  }, [currentView, selectedBook, storeConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore quota errors
    }
  }, [cart]);

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    if (view !== 'book') {
      setSelectedBook(null);
      setPendingBookSlug(null);
      const nextPath = VIEW_TO_PATH[view];
      if (window.location.pathname !== nextPath) {
        window.history.pushState({}, '', nextPath);
      }
    }
    if (view === 'admin') {
      checkAdminSession();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectBook = async (book: Book) => {
    setSelectedBook(book);
    setPendingBookSlug(null);
    setCurrentView('book');
    const nextPath = `/books/${encodeURIComponent(book.slug)}`;
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const fresh = await api.getBook(book.id);
      setSelectedBook(fresh);
    } catch {
      // keep existing book snapshot
    }
  };

  const addToCart = (book: Book, quantity = 1) => {
    if (!book.is_available || book.stock_quantity <= 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.book.id === book.id);
      if (existing) {
        return prev.map((i) =>
          i.book.id === book.id
            ? { ...i, quantity: Math.min(book.stock_quantity, i.quantity + quantity) }
            : i
        );
      }
      return [...prev, { book, quantity: Math.min(book.stock_quantity, quantity) }];
    });
    setCartOpen(true);
  };

  const handleBuyNow = (book: Book, quantity = 1) => {
    if (!book.is_available || book.stock_quantity <= 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.book.id === book.id);
      if (existing) {
        return prev.map((i) =>
          i.book.id === book.id
            ? { ...i, quantity: Math.min(book.stock_quantity, i.quantity + quantity) }
            : i
        );
      }
      return [...prev, { book, quantity: Math.min(book.stock_quantity, quantity) }];
    });
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const updateCartQuantity = (bookId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.book.id !== bookId));
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.book.id === bookId
          ? { ...i, quantity: Math.min(i.book.stock_quantity, quantity) }
          : i
      )
    );
  };

  const removeFromCart = (bookId: number) => {
    setCart((prev) => prev.filter((i) => i.book.id !== bookId));
  };

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch {
      // ignore quota errors
    }
  }, [wishlist]);

  const wishlistIds = useMemo(() => new Set(wishlist.map((b) => b.id)), [wishlist]);

  const toggleWishlist = (book: Book) => {
    setWishlist((prev) => {
      if (prev.some((b) => b.id === book.id)) {
        return prev.filter((b) => b.id !== book.id);
      }
      return [book, ...prev];
    });
  };

  const clearWishlist = () => {
    setWishlist([]);
  };

  const addAllWishlistToCart = () => {
    const available = wishlist.filter((b) => b.is_available && b.stock_quantity > 0);
    if (available.length === 0) return;
    setCart((prev) => {
      const next = [...prev];
      for (const book of available) {
        const idx = next.findIndex((i) => i.book.id === book.id);
        if (idx >= 0) {
          next[idx] = {
            ...next[idx],
            quantity: Math.min(book.stock_quantity, next[idx].quantity + 1),
          };
        } else {
          next.push({ book, quantity: 1 });
        }
      }
      return next;
    });
    setCartOpen(true);
  };

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart]
  );

  const relatedBooks = useMemo(() => {
    if (!selectedBook) return [];
    return books
      .filter((b) => b.id !== selectedBook.id)
      .sort((a, b) => {
        const aSame = a.category_id === selectedBook.category_id ? 0 : 1;
        const bSame = b.category_id === selectedBook.category_id ? 0 : 1;
        return aSame - bSame;
      })
      .slice(0, 3);
  }, [books, selectedBook]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-[#0B192C]">
      <Navbar
        currentView={currentView}
        cartCount={cartCount}
        wishlistCount={wishlist.length}
        onNavigate={handleNavigate}
        onOpenCart={() => setCartOpen(true)}
      />

      <main className="flex-1">
        {(currentView === 'home' ||
          currentView === 'catalog' ||
          currentView === 'new-arrivals' ||
          currentView === 'authors' ||
          currentView === 'categories') && (
          <HomeView
            viewMode={currentView}
            books={books}
            categories={categories}
            loading={loadingCatalog}
            currency={storeConfig.currency}
            wishlistIds={wishlistIds}
            onToggleWishlist={toggleWishlist}
            onNavigate={handleNavigate}
            onSelectBook={handleSelectBook}
            onAddToCart={(b) => addToCart(b, 1)}
            onPreviewSample={(b) => setPreviewBook(b)}
          />
        )}

        {currentView === 'wishlist' && (
          <WishlistView
            books={wishlist}
            currency={storeConfig.currency}
            onNavigate={handleNavigate}
            onSelectBook={handleSelectBook}
            onAddToCart={(b) => addToCart(b, 1)}
            onPreviewSample={(b) => setPreviewBook(b)}
            onToggleWishlist={toggleWishlist}
            onClearWishlist={clearWishlist}
            onAddAllAvailableToCart={addAllWishlistToCart}
          />
        )}

        {currentView === 'book' && selectedBook && (
          <BookDetailView
            book={selectedBook}
            relatedBooks={relatedBooks}
            currency={storeConfig.currency}
            wishlistIds={wishlistIds}
            customer={customerUser}
            onOpenCustomerAuth={(mode) => {
              setCustomerAuthMode(mode);
              setCustomerAuthOpen(true);
            }}
            onCustomerLogout={async () => {
              try {
                await api.customerLogout();
              } finally {
                setCustomerUser(null);
              }
            }}
            onToggleWishlist={toggleWishlist}
            onBack={() => handleNavigate('catalog')}
            onSelectBook={handleSelectBook}
            onAddToCart={addToCart}
            onBuyNow={handleBuyNow}
            onPreviewSample={(b) => setPreviewBook(b)}
            onOpenWhatsAppInquiry={(b) => setWhatsAppBook(b)}
          />
        )}

        {currentView === 'support' && (
          <SupportView books={books} storeConfig={storeConfig} />
        )}

        {currentView === 'admin' && (
          <>
            {checkingAuth ? (
              <div className="min-h-[70vh] flex items-center justify-center text-sm text-slate-600">
                Verifying owner session...
              </div>
            ) : adminUser ? (
              <AdminDashboard
                admin={adminUser}
                onLogout={async () => {
                  await api.adminLogout();
                  setAdminUser(null);
                  handleNavigate('home');
                }}
                onStorefrontDataChanged={loadStorefront}
              />
            ) : (
              <AdminLogin
                onLoginSuccess={(user) => setAdminUser(user)}
                onBackToStore={() => handleNavigate('home')}
              />
            )}
          </>
        )}
      </main>

      {currentView !== 'admin' && (
        <Footer storeConfig={storeConfig} onNavigate={handleNavigate} />
      )}

      <CartDrawer
        open={cartOpen}
        items={cart}
        storeConfig={storeConfig}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onProceedToCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        open={checkoutOpen}
        items={cart}
        storeConfig={storeConfig}
        onClose={() => setCheckoutOpen(false)}
        onOrderSuccess={() => {
          setCart([]);
          loadStorefront();
        }}
      />

      <PdfPreviewModal book={previewBook} onClose={() => setPreviewBook(null)} />

      <WhatsAppInquiryModal
        book={whatsAppBook}
        storeConfig={storeConfig}
        onClose={() => setWhatsAppBook(null)}
      />

      {customerAuthOpen && (
        <CustomerAuthModal
          key={customerAuthMode}
          open={customerAuthOpen}
          initialMode={customerAuthMode}
          onClose={() => setCustomerAuthOpen(false)}
          onAuthenticated={(customer) => setCustomerUser(customer)}
        />
      )}
    </div>
  );
}
