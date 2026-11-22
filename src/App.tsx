import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AdminUser,
  AuthorProfile,
  Book,
  CartItem,
  Category,
  CustomerUser,
  PublicationUpdate,
  StoreConfig,
} from './types';
import { api } from './lib/api';
import { applySeoMetadata } from './lib/seo';
import { Navbar, type AppView } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { BookDetailView } from './components/BookDetailView';
import { AuthorProfileView } from './components/AuthorProfileView';
import { UpdatesView } from './components/UpdatesView';
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
  founder_name: 'Dr. S.B. Saraswat',
  founder_designation: 'Director & Managing Head · Bhagwati Publications',
  founder_credentials:
    'Ph.D. · B.E. (Electrical & Industrial Engineering) · PG in ADR, Public Administration & Materials Management · ISO-9000 & High-Tension Electrical Certified',
  founder_bio:
    'Dr. S.B. Saraswat brings decades of international industrial leadership, institutional governance, and technical scholarship to Bhagwati Publications. He serves as Resident Director at Danieli Corus (Netherlands) and previously held senior executive appointments as Joint Director (Technical/Materials) at Steel Authority of India Limited (SAIL) and Director of Supply Chain Management at Global Steel Sofia (Europe).\n\nUnder his editorial stewardship, Bhagwati Publications advances rigorous academic, engineering, heritage, and management publishing for scholars, universities, and professional libraries.',
  founder_photo_url: '',
};

const CART_STORAGE_KEY = 'bhagwati_publications_cart_v1';
const WISHLIST_STORAGE_KEY = 'bhagwati_publications_wishlist_v1';

const VIEW_TO_PATH: Record<Exclude<AppView, 'book' | 'author'>, string> = {
  home: '/',
  catalog: '/catalog',
  'new-arrivals': '/new-releases',
  authors: '/authors',
  updates: '/updates',
  wishlist: '/wishlist',
  categories: '/categories',
  support: '/support',
  admin: '/admin',
};

function parseRouteFromLocation(): {
  view: AppView;
  bookSlugOrId: string | null;
  authorSlug: string | null;
} {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path.startsWith('/books/')) {
    const slugOrId = decodeURIComponent(path.slice('/books/'.length));
    if (slugOrId) return { view: 'book', bookSlugOrId: slugOrId, authorSlug: null };
  }
  if (path.startsWith('/authors/')) {
    const authorSlug = decodeURIComponent(path.slice('/authors/'.length));
    if (authorSlug) return { view: 'author', bookSlugOrId: null, authorSlug };
  }
  if (path === '/catalog') return { view: 'catalog', bookSlugOrId: null, authorSlug: null };
  if (path === '/new-releases' || path === '/new-arrivals') {
    return { view: 'new-arrivals', bookSlugOrId: null, authorSlug: null };
  }
  if (path === '/authors') return { view: 'authors', bookSlugOrId: null, authorSlug: null };
  if (path === '/updates' || path.startsWith('/updates/')) {
    return { view: 'updates', bookSlugOrId: null, authorSlug: null };
  }
  if (path === '/wishlist') return { view: 'wishlist', bookSlugOrId: null, authorSlug: null };
  if (path === '/categories') return { view: 'categories', bookSlugOrId: null, authorSlug: null };
  if (path === '/support' || path === '/track-order') {
    return { view: 'support', bookSlugOrId: null, authorSlug: null };
  }
  if (path === '/admin') return { view: 'admin', bookSlugOrId: null, authorSlug: null };
  return { view: 'home', bookSlugOrId: null, authorSlug: null };
}

export default function App() {
  const initialRoute = useMemo(() => parseRouteFromLocation(), []);
  const [currentView, setCurrentView] = useState<AppView>(initialRoute.view);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [pendingBookSlug, setPendingBookSlug] = useState<string | null>(initialRoute.bookSlugOrId);
  const [selectedAuthor, setSelectedAuthor] = useState<AuthorProfile | null>(null);
  const [selectedAuthorBooks, setSelectedAuthorBooks] = useState<Book[]>([]);
  const [pendingAuthorSlug, setPendingAuthorSlug] = useState<string | null>(
    initialRoute.authorSlug
  );
  const [loadingAuthor, setLoadingAuthor] = useState(false);

  const [storeConfig, setStoreConfig] = useState<StoreConfig>(DEFAULT_STORE_CONFIG);
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<AuthorProfile[]>([]);
  const [updates, setUpdates] = useState<PublicationUpdate[]>([]);
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
      const [configRes, booksRes, categoriesRes, authorsRes, updatesRes] = await Promise.all([
        api.getStoreConfig(),
        api.getBooks(),
        api.getCategories(),
        api.getAuthors().catch(() => [] as AuthorProfile[]),
        api.getUpdates().catch(() => [] as PublicationUpdate[]),
      ]);
      setStoreConfig(configRes);
      setBooks(booksRes);
      setCategories(categoriesRes);
      setAuthors(authorsRes);
      setUpdates(updatesRes);
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

  // Resolve deep-linked /authors/:slug on initial load or popstate
  useEffect(() => {
    if (!pendingAuthorSlug) return;
    let cancelled = false;
    setLoadingAuthor(true);
    api
      .getAuthorProfile(pendingAuthorSlug)
      .then((res) => {
        if (!cancelled) {
          setSelectedAuthor(res.author);
          setSelectedAuthorBooks(res.books);
          setCurrentView('author');
          setPendingAuthorSlug(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSelectedAuthor(null);
          setSelectedAuthorBooks([]);
          setPendingAuthorSlug(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingAuthor(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pendingAuthorSlug]);

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
      if (route.view === 'author' && route.authorSlug) {
        setPendingAuthorSlug(route.authorSlug);
      } else {
        setPendingAuthorSlug(null);
        setSelectedAuthor(null);
        setSelectedAuthorBooks([]);
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
      author: selectedAuthor,
      storeConfig,
    });
  }, [currentView, selectedBook, selectedAuthor, storeConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore quota errors
    }
  }, [cart]);

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    if (view !== 'book' && view !== 'author') {
      setSelectedBook(null);
      setPendingBookSlug(null);
      setSelectedAuthor(null);
      setPendingAuthorSlug(null);
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
    setSelectedAuthor(null);
    setPendingAuthorSlug(null);
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

  const handleSelectAuthor = async (authorSlug: string) => {
    if (!authorSlug) return;
    setSelectedBook(null);
    setPendingBookSlug(null);
    setCurrentView('author');
    setLoadingAuthor(true);
    const localAuthor = authors.find((a) => a.slug === authorSlug) || null;
    if (localAuthor) {
      setSelectedAuthor(localAuthor);
      setSelectedAuthorBooks(books.filter((b) => b.author_slug === authorSlug));
    }
    const nextPath = `/authors/${encodeURIComponent(authorSlug)}`;
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const res = await api.getAuthorProfile(authorSlug);
      setSelectedAuthor(res.author);
      setSelectedAuthorBooks(res.books);
    } catch {
      if (!localAuthor) {
        setSelectedAuthor(null);
        setSelectedAuthorBooks([]);
      }
    } finally {
      setLoadingAuthor(false);
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
            storeConfig={storeConfig}
            books={books}
            categories={categories}
            authors={authors}
            updates={updates}
            loading={loadingCatalog}
            currency={storeConfig.currency}
            wishlistIds={wishlistIds}
            onToggleWishlist={toggleWishlist}
            onNavigate={handleNavigate}
            onSelectBook={handleSelectBook}
            onSelectAuthor={handleSelectAuthor}
            onAddToCart={(b) => addToCart(b, 1)}
            onPreviewSample={(b) => setPreviewBook(b)}
          />
        )}

        {currentView === 'author' && (
          <AuthorProfileView
            author={selectedAuthor}
            books={selectedAuthorBooks}
            loading={loadingAuthor}
            currency={storeConfig.currency}
            wishlistIds={wishlistIds}
            onToggleWishlist={toggleWishlist}
            onBackToAuthors={() => handleNavigate('authors')}
            onSelectBook={handleSelectBook}
            onAddToCart={(b) => addToCart(b, 1)}
            onPreviewSample={(b) => setPreviewBook(b)}
          />
        )}

        {currentView === 'updates' && (
          <UpdatesView
            updates={updates}
            books={books}
            loading={loadingCatalog}
            onSelectBook={handleSelectBook}
          />
        )}

        {currentView === 'wishlist' && (
          <WishlistView
            books={wishlist}
            allBooks={books}
            currency={storeConfig.currency}
            wishlistIds={wishlistIds}
            onNavigate={handleNavigate}
            onSelectBook={handleSelectBook}
            onSelectAuthor={handleSelectAuthor}
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
            allBooks={books}
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
            onSelectAuthor={handleSelectAuthor}
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

      <PdfPreviewModal
        book={previewBook}
        onClose={() => setPreviewBook(null)}
        onAddToCart={(b) => addToCart(b, 1)}
      />

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
