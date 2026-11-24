import { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  BookCopy,
  Check,
  Edit3,
  FileLock2,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Newspaper,
  Package,
  Plus,
  Search,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import type {
  AdminOverview,
  AdminSettings,
  AdminUser,
  Book,
  Category,
  Inquiry,
  InquiryStatus,
  Order,
  OrderStatus,
  PaymentStatus,
} from '../../types';
import { api } from '../../lib/api';
import { formatDate, formatPrice } from '../../lib/currency';
import { BookCoverImage } from '../BookCoverImage';
import { AdminBookModal } from './AdminBookModal';
import { AdminSettingsTab } from './AdminSettingsTab';
import { AdminAnalyticsTab } from './AdminAnalyticsTab';
import { AdminEditorialTab } from './AdminEditorialTab';

type AdminTab =
  | 'overview'
  | 'analytics'
  | 'books'
  | 'categories'
  | 'editorial'
  | 'orders'
  | 'inquiries'
  | 'settings';

interface AdminDashboardProps {
  admin: AdminUser;
  onLogout: () => void;
  onStorefrontDataChanged: () => void;
}

export function AdminDashboard({
  admin,
  onLogout,
  onStorefrontDataChanged,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);

  // Book Search & Modal
  const [bookSearch, setBookSearch] = useState('');
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [confirmDeleteBookId, setConfirmDeleteBookId] = useState<number | null>(null);

  // Category Form
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [editingCatDesc, setEditingCatDesc] = useState('');

  // Selected Order Detail
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  // Inquiry Notes Drafts
  const [inquiryNotes, setInquiryNotes] = useState<Record<number, string>>({});

  const loadAllAdminData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ov, bks, cats, ords, inqs, setts] = await Promise.all([
        api.adminOverview(),
        api.adminGetBooks(),
        api.adminGetCategories(),
        api.adminGetOrders(),
        api.adminGetInquiries(),
        api.adminGetSettings(),
      ]);
      setOverview(ov);
      setBooks(bks);
      setCategories(cats);
      setOrders(ords);
      setInquiries(inqs);
      setSettings(setts);
      const noteDrafts: Record<number, string> = {};
      for (const inq of inqs) {
        noteDrafts[inq.id] = inq.admin_notes || '';
      }
      setInquiryNotes(noteDrafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin workspace');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllAdminData();
  }, [loadAllAdminData]);

  const currency = settings?.currency || 'INR';

  const handleInventoryToggle = async (
    book: Book,
    patch: Partial<{ stock_quantity: number; is_available: boolean; is_published: boolean }>
  ) => {
    setError('');
    setNotice('');
    try {
      await api.adminUpdateBookInventory(book.id, {
        stock_quantity: patch.stock_quantity ?? book.stock_quantity,
        is_available: patch.is_available ?? book.is_available,
        is_published: patch.is_published ?? book.is_published,
      });
      await loadAllAdminData();
      onStorefrontDataChanged();
      setNotice(`Updated inventory for "${book.title}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update inventory');
    }
  };

  const handleDeleteBook = async (id: number) => {
    setError('');
    setNotice('');
    try {
      await api.adminDeleteBook(id);
      setConfirmDeleteBookId(null);
      await loadAllAdminData();
      onStorefrontDataChanged();
      setNotice('Book removed from catalog.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete book');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setError('');
    setNotice('');
    try {
      await api.adminCreateCategory({
        name: newCategoryName.trim(),
        description: newCategoryDesc.trim(),
      });
      setNewCategoryName('');
      setNewCategoryDesc('');
      await loadAllAdminData();
      onStorefrontDataChanged();
      setNotice('Category created.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
    }
  };

  const handleUpdateCategory = async (id: number) => {
    setError('');
    setNotice('');
    try {
      await api.adminUpdateCategory(id, {
        name: editingCatName.trim(),
        description: editingCatDesc.trim(),
      });
      setEditingCatId(null);
      await loadAllAdminData();
      onStorefrontDataChanged();
      setNotice('Category updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    setError('');
    setNotice('');
    try {
      await api.adminDeleteCategory(id);
      await loadAllAdminData();
      onStorefrontDataChanged();
      setNotice('Category deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  const handleOrderUpdate = async (
    orderId: number,
    patch: { order_status?: OrderStatus; payment_status?: PaymentStatus }
  ) => {
    setError('');
    setNotice('');
    try {
      await api.adminUpdateOrder(orderId, patch);
      await loadAllAdminData();
      setNotice('Order status updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
    }
  };

  const handleInquiryUpdate = async (id: number, status: InquiryStatus) => {
    setError('');
    setNotice('');
    try {
      await api.adminUpdateInquiry(id, {
        status,
        admin_notes: inquiryNotes[id] || '',
      });
      await loadAllAdminData();
      setNotice('Inquiry updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update inquiry');
    }
  };

  const filteredBooks = books.filter((b) => {
    const q = bookSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.isbn.toLowerCase().includes(q)
    );
  });

  const sidebarLinks: Array<{ id: AdminTab; label: string; icon: typeof LayoutDashboard }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'books', label: 'Books & Inventory', icon: BookCopy },
    { id: 'categories', label: 'Categories', icon: FolderKanban },
    { id: 'editorial', label: 'Authors & Updates', icon: Newspaper },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'inquiries', label: 'Inquiries', icon: MessageSquare },
    { id: 'settings', label: 'Store & Payment', icon: Settings },
  ];

  return (
    <div className="min-h-[82vh] bg-[#F8FAFC] flex flex-col lg:flex-row">
      {/* Sidebar Navigation (240px–260px) */}
      <aside className="w-full lg:w-64 bg-[#0B192C] text-slate-300 border-b lg:border-b-0 lg:border-r border-[#1D3557] shrink-0 flex flex-col justify-between">
        <div className="p-4 sm:p-5 space-y-5">
          <div className="pb-4 border-b border-white/10">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#DFC166]">
              Publisher Workspace
            </p>
            <p className="text-sm font-semibold text-white mt-0.5 truncate">{admin.name}</p>
            <p className="text-xs text-slate-400 truncate">{admin.email}</p>
          </div>

          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
            {sidebarLinks.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#C59B27] text-[#07111E] font-semibold'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-white/10 hidden lg:block">
          <button
            type="button"
            onClick={onLogout}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 border border-white/20 text-xs font-medium text-slate-200 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Contextual Top Bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500">
              Admin Portal /{' '}
              <span className="font-medium text-[#0B192C]">
                {sidebarLinks.find((l) => l.id === activeTab)?.label}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setEditingBook(null);
                setBookModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B192C] text-white text-xs font-semibold rounded-md hover:bg-[#132642] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#DFC166]" />
              <span>Upload New Book</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 text-xs font-medium text-slate-700 rounded-md hover:bg-slate-50 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Viewport Body */}
        <div className="p-6 space-y-6 flex-1">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-md flex items-center justify-between gap-3">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError('')}
                aria-label="Dismiss error"
                className="text-rose-700 hover:text-rose-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {notice && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-md flex items-center justify-between gap-3">
              <span>{notice}</span>
              <button
                type="button"
                onClick={() => setNotice('')}
                aria-label="Dismiss notice"
                className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 bg-white border border-slate-200 rounded-lg" />
                ))}
              </div>
              <div className="h-64 bg-white border border-slate-200 rounded-lg" />
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && overview && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200 rounded-lg p-5">
                      <p className="text-xs font-medium text-slate-500">Catalog Titles</p>
                      <p className="text-2xl font-bold text-[#0B192C] mt-1 tabular-nums font-mono">
                        {overview.total_books}
                      </p>
                      <p className="text-xs text-slate-600 mt-1 tabular-nums">
                        {overview.published_books} published · {overview.out_of_stock_books} out of stock
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-5">
                      <p className="text-xs font-medium text-slate-500">Total Orders</p>
                      <p className="text-2xl font-bold text-[#0B192C] mt-1 tabular-nums font-mono">
                        {overview.total_orders}
                      </p>
                      <p className="text-xs text-amber-700 mt-1 tabular-nums">
                        {overview.pending_orders} pending fulfillment
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-5">
                      <p className="text-xs font-medium text-slate-500">Gross Order Value</p>
                      <p className="text-2xl font-bold text-[#0B192C] mt-1 tabular-nums font-mono">
                        {formatPrice(overview.total_revenue, currency)}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">Excluding cancelled orders</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-5">
                      <p className="text-xs font-medium text-slate-500">Open Inquiries</p>
                      <p className="text-2xl font-bold text-[#0B192C] mt-1 tabular-nums font-mono">
                        {overview.open_inquiries}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">Web & WhatsApp messages</p>
                    </div>
                  </div>

                  {/* Recent Orders Quick Table */}
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                      <h2 className="font-serif text-base font-bold text-[#0B192C]">
                        Recent Customer Orders
                      </h2>
                      <button
                        type="button"
                        onClick={() => setActiveTab('orders')}
                        className="text-xs font-medium text-[#9F7918] hover:underline cursor-pointer"
                      >
                        Manage All Orders
                      </button>
                    </div>
                    {orders.length === 0 ? (
                      <p className="p-6 text-sm text-slate-500">No customer orders placed yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                            <tr>
                              <th className="px-4 py-2.5 font-semibold">Order</th>
                              <th className="px-4 py-2.5 font-semibold">Customer</th>
                              <th className="px-4 py-2.5 font-semibold">Status</th>
                              <th className="px-4 py-2.5 font-semibold text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {orders.slice(0, 5).map((ord) => (
                              <tr key={ord.id} className="hover:bg-slate-50">
                                <td className="px-4 py-2.5 font-mono font-medium text-[#0B192C]">
                                  {ord.order_number}
                                </td>
                                <td className="px-4 py-2.5 text-slate-700">{ord.customer_name}</td>
                                <td className="px-4 py-2.5 capitalize text-slate-700">
                                  {ord.order_status}
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono tabular-nums font-semibold text-[#0B192C]">
                                  {formatPrice(ord.total_amount, currency)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: BOOKS & INVENTORY */}
              {activeTab === 'books' && (
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="font-serif text-lg font-bold text-[#0B192C]">
                      Catalog & Inventory ({books.length})
                    </h2>
                    <div className="relative w-full sm:w-72">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="search"
                        value={bookSearch}
                        onChange={(e) => setBookSearch(e.target.value)}
                        placeholder="Filter by title, author, ISBN..."
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-xs focus:border-[#0B192C] focus:outline-none"
                      />
                    </div>
                  </div>

                  {filteredBooks.length === 0 ? (
                    <div className="p-10 text-center space-y-2">
                      <p className="text-sm text-slate-600">No books match your filter.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBook(null);
                          setBookModalOpen(true);
                        }}
                        className="px-4 py-2 bg-[#0B192C] text-white text-xs font-semibold rounded-md cursor-pointer"
                      >
                        Upload First Book
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Edition</th>
                            <th className="px-4 py-3 font-semibold">ISBN</th>
                            <th className="px-4 py-3 font-semibold">Category</th>
                            <th className="px-4 py-3 font-semibold text-right">Price</th>
                            <th className="px-4 py-3 font-semibold">Stock</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">PDF Files</th>
                            <th className="px-4 py-3 font-semibold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredBooks.map((book) => (
                            <tr key={book.id} className="hover:bg-slate-50/70">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3 min-w-[200px]">
                                  <div className="w-10 aspect-[3/4] rounded overflow-hidden border border-slate-200 shrink-0">
                                    <BookCoverImage src={book.cover_url} title={book.title} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-[#0B192C] truncate max-w-[220px]">
                                      {book.title}
                                    </p>
                                    <p className="text-slate-500 truncate max-w-[220px]">
                                      {book.author}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 font-mono text-slate-600 tabular-nums whitespace-nowrap">
                                {book.isbn}
                              </td>
                              <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                                {book.category_name || '—'}
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-semibold text-[#0B192C] tabular-nums whitespace-nowrap">
                                {formatPrice(book.price, currency)}
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  min="0"
                                  defaultValue={book.stock_quantity}
                                  onBlur={(e) => {
                                    const next = Number(e.target.value);
                                    if (!Number.isNaN(next) && next !== book.stock_quantity) {
                                      handleInventoryToggle(book, { stock_quantity: next });
                                    }
                                  }}
                                  aria-label={`Stock for ${book.title}`}
                                  className="w-16 px-2 py-1 border border-slate-300 rounded text-xs font-mono tabular-nums"
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex flex-col gap-1">
                                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={book.is_published}
                                      onChange={(e) =>
                                        handleInventoryToggle(book, {
                                          is_published: e.target.checked,
                                        })
                                      }
                                      className="accent-[#0B192C]"
                                    />
                                    <span>{book.is_published ? 'Published' : 'Draft'}</span>
                                  </label>
                                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={book.is_available}
                                      onChange={(e) =>
                                        handleInventoryToggle(book, {
                                          is_available: e.target.checked,
                                        })
                                      }
                                      className="accent-[#0B192C]"
                                    />
                                    <span>{book.is_available ? 'In Stock' : 'Disabled'}</span>
                                  </label>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="space-y-1">
                                  <p className="text-slate-600">
                                    Sample: {book.has_sample_pdf ? 'Yes' : 'None'}
                                  </p>
                                  {book.has_private_pdf ? (
                                    <a
                                      href={`/api/admin/books/${book.id}/private-pdf`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[#9F7918] hover:underline font-medium"
                                    >
                                      <FileLock2 className="w-3.5 h-3.5" />
                                      <span>Private PDF</span>
                                    </a>
                                  ) : (
                                    <p className="text-slate-400">Private: None</p>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingBook(book);
                                      setBookModalOpen(true);
                                    }}
                                    className="p-1.5 text-slate-600 hover:text-[#0B192C] border border-slate-200 rounded hover:bg-slate-100 cursor-pointer"
                                    title="Edit book"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>

                                  {confirmDeleteBookId === book.id ? (
                                    <div className="inline-flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteBook(book.id)}
                                        className="px-2 py-1 bg-rose-700 text-white text-[11px] font-semibold rounded cursor-pointer"
                                      >
                                        Confirm
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setConfirmDeleteBookId(null)}
                                        className="px-2 py-1 border border-slate-300 text-slate-700 text-[11px] font-medium rounded hover:bg-slate-100 cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteBookId(book.id)}
                                      className="p-1.5 text-rose-700 border border-slate-200 rounded hover:bg-rose-50 cursor-pointer"
                                      title="Delete book"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CATEGORIES */}
              {activeTab === 'categories' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <form
                    onSubmit={handleCreateCategory}
                    className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-5 space-y-4 h-fit"
                  >
                    <h2 className="font-serif text-lg font-bold text-[#0B192C]">
                      Add Book Category
                    </h2>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Category Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="e.g. Literature & Essays"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={newCategoryDesc}
                        onChange={(e) => setNewCategoryDesc(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#0B192C] text-white text-xs font-semibold rounded-md hover:bg-[#132642] cursor-pointer"
                    >
                      Create Category
                    </button>
                  </form>

                  <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-200">
                      <h2 className="font-serif text-lg font-bold text-[#0B192C]">
                        Existing Categories ({categories.length})
                      </h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {categories.map((cat) => (
                        <div key={cat.id} className="p-4 flex items-center justify-between gap-4">
                          {editingCatId === cat.id ? (
                            <div className="flex-1 flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                value={editingCatName}
                                onChange={(e) => setEditingCatName(e.target.value)}
                                className="px-2.5 py-1.5 border border-slate-300 rounded text-sm flex-1"
                              />
                              <input
                                type="text"
                                value={editingCatDesc}
                                onChange={(e) => setEditingCatDesc(e.target.value)}
                                placeholder="Description"
                                className="px-2.5 py-1.5 border border-slate-300 rounded text-sm flex-1"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateCategory(cat.id)}
                                className="px-3 py-1.5 bg-[#0B192C] text-white text-xs font-semibold rounded inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Save</span>
                              </button>
                            </div>
                          ) : (
                            <div>
                              <p className="font-semibold text-sm text-[#0B192C]">
                                {cat.name}{' '}
                                <span className="font-mono text-xs text-slate-500 font-normal tabular-nums">
                                  ({cat.book_count} books)
                                </span>
                              </p>
                              {cat.description && (
                                <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCatId(cat.id);
                                setEditingCatName(cat.name);
                                setEditingCatDesc(cat.description);
                              }}
                              className="p-1.5 text-slate-600 border border-slate-200 rounded hover:bg-slate-100 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="p-1.5 text-rose-700 border border-slate-200 rounded hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: ORDERS */}
              {activeTab === 'orders' && (
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200">
                    <h2 className="font-serif text-lg font-bold text-[#0B192C]">
                      Customer Orders ({orders.length})
                    </h2>
                  </div>

                  {orders.length === 0 ? (
                    <div className="p-10 text-center text-sm text-slate-500">
                      No orders have been placed yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {orders.map((order) => {
                        const isExpanded = expandedOrderId === order.id;
                        return (
                          <div key={order.id} className="p-4 sm:p-5 space-y-3">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2.5 text-sm">
                                  <span className="font-mono font-bold text-[#0B192C]">
                                    {order.order_number}
                                  </span>
                                  <span className="text-slate-400">·</span>
                                  <span className="font-medium text-slate-800">
                                    {order.customer_name}
                                  </span>
                                  <span className="text-slate-400">·</span>
                                  <span className="text-xs text-slate-500">
                                    {formatDate(order.created_at)}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600">
                                  {order.customer_email} · {order.customer_phone} ·{' '}
                                  <span className="uppercase">{order.payment_method}</span>
                                  {order.payment_reference ? ` (${order.payment_reference})` : ''}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-3">
                                <span className="font-mono text-sm font-bold text-[#0B192C] tabular-nums mr-2">
                                  {formatPrice(order.total_amount, currency)}
                                </span>

                                <select
                                  value={order.order_status}
                                  onChange={(e) =>
                                    handleOrderUpdate(order.id, {
                                      order_status: e.target.value as OrderStatus,
                                    })
                                  }
                                  aria-label={`Order status for ${order.order_number}`}
                                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium"
                                >
                                  <option value="pending">Order: Pending</option>
                                  <option value="confirmed">Order: Confirmed</option>
                                  <option value="shipped">Order: Shipped</option>
                                  <option value="delivered">Order: Delivered</option>
                                  <option value="cancelled">Order: Cancelled</option>
                                </select>

                                <select
                                  value={order.payment_status}
                                  onChange={(e) =>
                                    handleOrderUpdate(order.id, {
                                      payment_status: e.target.value as PaymentStatus,
                                    })
                                  }
                                  aria-label={`Payment status for ${order.order_number}`}
                                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium"
                                >
                                  <option value="pending">Payment: Pending</option>
                                  <option value="paid">Payment: Paid</option>
                                  <option value="failed">Payment: Failed</option>
                                  <option value="refunded">Payment: Refunded</option>
                                </select>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedOrderId(isExpanded ? null : order.id)
                                  }
                                  className="px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                                >
                                  {isExpanded ? 'Hide Items' : 'View Items'}
                                </button>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="p-4 bg-slate-50 border border-slate-200 rounded-md grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div>
                                  <p className="font-semibold text-[#0B192C] mb-1">
                                    Shipping Address
                                  </p>
                                  <p className="text-slate-700">{order.shipping_address}</p>
                                  <p className="text-slate-700">
                                    {order.city}, {order.state} {order.postal_code}
                                  </p>
                                  {order.notes && (
                                    <p className="mt-2 text-slate-600">Notes: {order.notes}</p>
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-[#0B192C] mb-1">Books Ordered</p>
                                  <ul className="space-y-1">
                                    {order.items.map((item) => (
                                      <li key={item.id} className="flex justify-between">
                                        <span>
                                          {item.book_title} × {item.quantity}
                                        </span>
                                        <span className="font-mono tabular-nums">
                                          {formatPrice(item.line_total, currency)}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: INQUIRIES */}
              {activeTab === 'inquiries' && (
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200">
                    <h2 className="font-serif text-lg font-bold text-[#0B192C]">
                      Customer Inquiries ({inquiries.length})
                    </h2>
                  </div>

                  {inquiries.length === 0 ? (
                    <div className="p-10 text-center text-sm text-slate-500">
                      No customer inquiries received yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {inquiries.map((inq) => (
                        <div key={inq.id} className="p-5 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-[#0B192C]">
                                {inq.subject}{' '}
                                <span className="text-xs font-normal text-slate-500">
                                  ({inq.channel.toUpperCase()})
                                </span>
                              </p>
                              <p className="text-xs text-slate-600 mt-0.5">
                                {inq.name} · {inq.email}
                                {inq.phone ? ` · ${inq.phone}` : ''} · {formatDate(inq.created_at)}
                              </p>
                              {inq.book_title && (
                                <p className="text-xs text-[#9F7918] mt-0.5">
                                  Regarding: {inq.book_title}
                                </p>
                              )}
                            </div>

                            <select
                              value={inq.status}
                              onChange={(e) =>
                                handleInquiryUpdate(inq.id, e.target.value as InquiryStatus)
                              }
                              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium self-start sm:self-auto"
                            >
                              <option value="new">New</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                            </select>
                          </div>

                          <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded p-3">
                            {inq.message}
                          </p>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={inquiryNotes[inq.id] ?? ''}
                              onChange={(e) =>
                                setInquiryNotes((prev) => ({
                                  ...prev,
                                  [inq.id]: e.target.value,
                                }))
                              }
                              placeholder="Internal publisher follow-up notes..."
                              className="flex-1 px-3 py-1.5 border border-slate-300 rounded text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => handleInquiryUpdate(inq.id, inq.status)}
                              className="px-4 py-1.5 bg-[#0B192C] text-white text-xs font-semibold rounded hover:bg-[#132642] cursor-pointer"
                            >
                              Save Note
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 1B: ANALYTICS */}
              {activeTab === 'analytics' && <AdminAnalyticsTab currency={currency} />}

              {/* TAB 5B: EDITORIAL (AUTHORS & UPDATES) */}
              {activeTab === 'editorial' && (
                <AdminEditorialTab
                  books={books}
                  onStorefrontDataChanged={onStorefrontDataChanged}
                />
              )}

              {/* TAB 6: STORE & PAYMENT SETTINGS */}
              {activeTab === 'settings' && settings && (
                <AdminSettingsTab
                  settings={settings}
                  onUpdated={(updated) => {
                    setSettings(updated);
                    onStorefrontDataChanged();
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>

      {bookModalOpen && (
        <AdminBookModal
          open={bookModalOpen}
          editingBook={editingBook}
          categories={categories}
          onClose={() => {
            setBookModalOpen(false);
            setEditingBook(null);
          }}
          onSaved={async () => {
            const wasEditing = Boolean(editingBook);
            setBookModalOpen(false);
            setEditingBook(null);
            await loadAllAdminData();
            onStorefrontDataChanged();
            setNotice(wasEditing ? 'Book details updated.' : 'New book published.');
          }}
        />
      )}
    </div>
  );
}
