export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export type PaymentGatewayProvider = 'none' | 'razorpay' | 'stripe' | 'custom';

export interface StoreConfig {
  publisher_name: string;
  support_email: string;
  support_phone: string;
  whatsapp_number: string;
  business_address: string;
  currency: CurrencyCode;
  free_shipping_threshold: number;
  standard_shipping_fee: number;
  payment_cod_enabled: boolean;
  payment_upi_enabled: boolean;
  payment_upi_id: string;
  payment_gateway_provider: PaymentGatewayProvider;
  payment_gateway_public_key: string;
  payment_gateway_mode: 'test' | 'live';
  founder_name: string;
  founder_designation: string;
  founder_credentials: string;
  founder_bio: string;
  founder_photo_url: string;
}

export interface AdminSettings extends StoreConfig {
  has_payment_gateway_secret: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  book_count: number;
  created_at?: string;
}

export interface Book {
  id: number;
  title: string;
  slug: string;
  author: string;
  author_slug?: string;
  isbn: string;
  description: string;
  price: number;
  category_id: number | null;
  category_name: string;
  category_slug: string;
  cover_url: string;
  has_sample_pdf: boolean;
  has_private_pdf?: boolean;
  pages: number;
  language: string;
  binding: string;
  publication_year: number;
  stock_quantity: number;
  is_available: boolean;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_published: boolean;
  average_rating?: number;
  review_count?: number;
  units_sold?: number;
  created_at: string;
  updated_at?: string;
}

export interface CartItem {
  book: Book;
  quantity: number;
}

export interface OrderItem {
  id: number;
  book_id: number | null;
  book_title: string;
  book_isbn: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  city: string;
  state: string;
  postal_code: string;
  payment_method: string;
  payment_status: PaymentStatus;
  payment_reference: string;
  order_status: OrderStatus;
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  notes: string;
  created_at: string;
  items: OrderItem[];
}

export type InquiryStatus = 'new' | 'in_progress' | 'resolved';

export interface Inquiry {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  book_id: number | null;
  book_title: string;
  channel: 'web' | 'whatsapp';
  message: string;
  status: InquiryStatus;
  admin_notes: string;
  created_at: string;
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
}

export interface AdminOverview {
  total_books: number;
  published_books: number;
  out_of_stock_books: number;
  total_orders: number;
  pending_orders: number;
  total_revenue: number;
  open_inquiries: number;
}

export interface AdminAnalytics {
  kpis: {
    net_revenue: number;
    avg_order_value: number;
    total_units_sold: number;
    total_stock_units: number;
    inventory_retail_value: number;
    low_stock_titles: number;
    total_reviews: number;
    average_rating: number;
  };
  monthly_revenue: Array<{ month: string; order_count: number; revenue: number }>;
  order_status_breakdown: Array<{ status: string; count: number }>;
  payment_method_breakdown: Array<{ method: string; count: number; revenue: number }>;
  category_performance: Array<{
    id: number;
    name: string;
    book_count: number;
    stock_units: number;
    units_sold: number;
    revenue: number;
  }>;
  top_books: Array<{
    id: number;
    title: string;
    author: string;
    price: number;
    stock_quantity: number;
    units_sold: number;
    revenue: number;
    average_rating: number;
    review_count: number;
  }>;
  inquiry_channels: Array<{ channel: string; count: number }>;
}

export interface AuthorProfile {
  id: number;
  name: string;
  slug: string;
  credentials: string;
  affiliation: string;
  location: string;
  bio: string;
  book_count: number;
  subjects?: string[];
  languages?: string[];
  featured_title?: string;
  created_at: string;
}

export type UpdateCategory = 'new-release' | 'announcement' | 'event' | 'press';

export interface PublicationUpdate {
  id: number;
  title: string;
  slug: string;
  category: UpdateCategory;
  summary: string;
  content: string;
  related_book_id: number | null;
  related_book_title?: string | null;
  related_book_slug?: string | null;
  is_published: boolean;
  published_at: string;
  created_at: string;
}

export interface BookPreviewPage {
  page_number: number;
  chapter_title: string;
  kind: 'title' | 'synopsis' | 'excerpt';
  paragraphs: string[];
}

export interface BookPreviewExcerpt {
  book_id: number;
  title: string;
  author: string;
  isbn: string;
  has_sample_pdf: boolean;
  pages: BookPreviewPage[];
}

export interface CustomerUser {
  id: number;
  name: string;
  email: string;
}

export interface BookReview {
  id: number;
  book_id: number;
  customer_id: number;
  customer_name: string;
  rating: number;
  title: string;
  comment: string;
  verified_purchase: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookReviewSummary {
  average_rating: number;
  total_reviews: number;
  breakdown: Record<'5' | '4' | '3' | '2' | '1', number>;
}

export interface BookReviewsResponse {
  summary: BookReviewSummary;
  reviews: BookReview[];
}
