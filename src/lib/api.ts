import type {
  AdminAnalytics,
  AdminOverview,
  AdminSettings,
  AdminUser,
  AuthorProfile,
  Book,
  BookPreviewExcerpt,
  BookReviewsResponse,
  Category,
  CustomerUser,
  Inquiry,
  InquiryStatus,
  Order,
  OrderStatus,
  PaymentStatus,
  PublicationUpdate,
  StoreConfig,
  UpdateCategory,
} from '../types';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = (await response.json()) as { error?: string; message?: string };
      if (data.error) message = data.error;
      else if (data.message) message = data.message;
    } catch {
      // keep fallback message
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Public storefront
  getStoreConfig: () => request<StoreConfig>('/api/store/config'),

  getCategories: () => request<Category[]>('/api/categories'),

  getBooks: (params?: {
    category?: string;
    search?: string;
    featured?: boolean;
    new_arrival?: boolean;
    sort?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.featured) query.set('featured', 'true');
    if (params?.new_arrival) query.set('new_arrival', 'true');
    if (params?.sort) query.set('sort', params.sort);
    const qs = query.toString();
    return request<Book[]>(`/api/books${qs ? `?${qs}` : ''}`);
  },

  getBook: (idOrSlug: string | number) => request<Book>(`/api/books/${encodeURIComponent(String(idOrSlug))}`),

  getBookPreviewExcerpt: (bookId: number) =>
    request<BookPreviewExcerpt>(`/api/books/${bookId}/preview-excerpt`),

  getAuthors: () => request<AuthorProfile[]>('/api/authors'),

  getAuthorProfile: (slug: string) =>
    request<{ author: AuthorProfile; books: Book[] }>(
      `/api/authors/${encodeURIComponent(slug)}`
    ),

  getUpdates: () => request<PublicationUpdate[]>('/api/updates'),

  createOrder: (payload: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    shipping_address: string;
    city: string;
    state: string;
    postal_code: string;
    payment_method: string;
    payment_reference?: string;
    notes?: string;
    items: Array<{ book_id: number; quantity: number }>;
  }) => request<{ order: Order }>('/api/orders', { method: 'POST', body: JSON.stringify(payload) }),

  lookupOrder: (orderNumber: string, email: string) =>
    request<{ order: Order }>(
      `/api/orders/lookup?order_number=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email)}`
    ),

  createInquiry: (payload: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    book_id?: number | null;
    channel?: 'web' | 'whatsapp';
    message: string;
  }) => request<{ inquiry: Inquiry }>('/api/inquiries', { method: 'POST', body: JSON.stringify(payload) }),

  // Customer auth & reviews
  customerRegister: (payload: { name: string; email: string; password: string }) =>
    request<{ customer: CustomerUser }>('/api/customers/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  customerLogin: (payload: { email: string; password: string }) =>
    request<{ customer: CustomerUser }>('/api/customers/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  customerLogout: () => request<{ ok: boolean }>('/api/customers/logout', { method: 'POST' }),

  customerMe: () => request<{ customer: CustomerUser }>('/api/customers/me'),

  getBookReviews: (bookId: number) =>
    request<BookReviewsResponse>(`/api/books/${bookId}/reviews`),

  submitBookReview: (
    bookId: number,
    payload: { rating: number; title?: string; comment: string }
  ) =>
    request<BookReviewsResponse>(`/api/books/${bookId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteBookReview: (bookId: number, reviewId: number) =>
    request<BookReviewsResponse>(`/api/books/${bookId}/reviews/${reviewId}`, {
      method: 'DELETE',
    }),

  // Admin auth
  adminLogin: (email: string, password: string) =>
    request<{ admin: AdminUser }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  adminLogout: () => request<{ ok: boolean }>('/api/admin/logout', { method: 'POST' }),

  adminMe: () => request<{ admin: AdminUser }>('/api/admin/me'),

  adminOverview: () => request<AdminOverview>('/api/admin/overview'),

  adminAnalytics: () => request<AdminAnalytics>('/api/admin/analytics'),

  // Admin books
  adminGetBooks: () => request<Book[]>('/api/admin/books'),

  adminCreateBook: (formData: FormData) =>
    request<{ book: Book }>('/api/admin/books', { method: 'POST', body: formData }),

  adminUpdateBook: (id: number, formData: FormData) =>
    request<{ book: Book }>(`/api/admin/books/${id}`, { method: 'PUT', body: formData }),

  adminUpdateBookInventory: (
    id: number,
    payload: { stock_quantity: number; is_available: boolean; is_published: boolean }
  ) =>
    request<{ book: Book }>(`/api/admin/books/${id}/inventory`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  adminDeleteBook: (id: number) =>
    request<{ ok: boolean }>(`/api/admin/books/${id}`, { method: 'DELETE' }),

  // Admin categories
  adminGetCategories: () => request<Category[]>('/api/admin/categories'),

  adminCreateCategory: (payload: { name: string; description: string }) =>
    request<{ category: Category }>('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  adminUpdateCategory: (id: number, payload: { name: string; description: string }) =>
    request<{ category: Category }>(`/api/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  adminDeleteCategory: (id: number) =>
    request<{ ok: boolean }>(`/api/admin/categories/${id}`, { method: 'DELETE' }),

  // Admin orders
  adminGetOrders: () => request<Order[]>('/api/admin/orders'),

  adminUpdateOrder: (
    id: number,
    payload: { order_status?: OrderStatus; payment_status?: PaymentStatus }
  ) =>
    request<{ order: Order }>(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Admin inquiries
  adminGetInquiries: () => request<Inquiry[]>('/api/admin/inquiries'),

  adminUpdateInquiry: (
    id: number,
    payload: { status: InquiryStatus; admin_notes: string }
  ) =>
    request<{ inquiry: Inquiry }>(`/api/admin/inquiries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Admin settings
  adminGetSettings: () => request<AdminSettings>('/api/admin/settings'),

  adminUpdateSettings: (
    payload: Partial<AdminSettings> & {
      payment_gateway_secret_key?: string;
      new_admin_password?: string;
      current_admin_password?: string;
    }
  ) =>
    request<AdminSettings>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  adminUploadLeadershipPhoto: async (file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    const res = await fetch('/api/admin/leadership/photo', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to upload portrait');
    }
    return data as { founder_photo_url: string; settings: AdminSettings };
  },

  adminDeleteLeadershipPhoto: () =>
    request<{ founder_photo_url: string; settings: AdminSettings }>(
      '/api/admin/leadership/photo',
      { method: 'DELETE' }
    ),

  // Admin authors
  adminGetAuthors: () => request<AuthorProfile[]>('/api/admin/authors'),

  adminUpdateAuthor: (
    id: number,
    payload: { credentials: string; affiliation: string; location: string; bio: string }
  ) =>
    request<{ author: AuthorProfile }>(`/api/admin/authors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Admin updates & news
  adminGetUpdates: () => request<PublicationUpdate[]>('/api/admin/updates'),

  adminCreateUpdate: (payload: {
    title: string;
    category: UpdateCategory;
    summary: string;
    content: string;
    related_book_id: number | null;
    is_published: boolean;
  }) =>
    request<{ update: PublicationUpdate }>('/api/admin/updates', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  adminUpdateUpdate: (
    id: number,
    payload: {
      title: string;
      category: UpdateCategory;
      summary: string;
      content: string;
      related_book_id: number | null;
      is_published: boolean;
    }
  ) =>
    request<{ update: PublicationUpdate }>(`/api/admin/updates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  adminDeleteUpdate: (id: number) =>
    request<{ ok: boolean }>(`/api/admin/updates/${id}`, { method: 'DELETE' }),
};
