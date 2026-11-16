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
