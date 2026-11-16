import { useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Mail,
  MapPin,
  MessageSquare,
  PackageSearch,
  Phone,
  Send,
} from 'lucide-react';
import type { Book, Order, StoreConfig } from '../types';
import { api } from '../lib/api';
import { formatDate, formatPrice } from '../lib/currency';

interface SupportViewProps {
  books: Book[];
  storeConfig: StoreConfig;
}

export function SupportView({ books, storeConfig }: SupportViewProps) {
  // Contact Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [bookId, setBookId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [inquiryError, setInquiryError] = useState('');
  const [inquirySuccess, setInquirySuccess] = useState(false);

  // Order Lookup State
  const [orderNumber, setOrderNumber] = useState('');
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);

  const sanitizedWhatsapp = storeConfig.whatsapp_number.replace(/[^\d]/g, '');

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInquiryError('');
    setSubmitting(true);
    try {
      await api.createInquiry({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        subject: subject.trim(),
        book_id: bookId ? Number(bookId) : null,
        channel: 'web',
        message: message.trim(),
      });
      setInquirySuccess(true);
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setBookId('');
      setMessage('');
    } catch (err) {
      setInquiryError(err instanceof Error ? err.message : 'Failed to submit inquiry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOrderLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError('');
    setFoundOrder(null);
    setLookupLoading(true);
    try {
      const res = await api.lookupOrder(orderNumber.trim(), lookupEmail.trim());
      setFoundOrder(res.order);
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'Order not found');
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="bg-[#F9FAFB] min-h-[75vh]">
      <section className="bg-[#0B192C] text-white py-12 border-b border-[#1D3557]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="w-12 h-px bg-[#C59B27]" />
          <h1 className="font-serif text-3xl sm:text-4xl font-bold">
            Customer Contact & Support
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
            Send an inquiry directly to the Bhagwati Publications team, initiate a WhatsApp book
            query, or check the fulfillment status of your existing order.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Customer Contact Form */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#0B192C]">Send a Message</h2>
            <p className="text-sm text-slate-600 mt-1">
              Questions regarding bulk orders, book availability, or publishing inquiries.
            </p>
          </div>

          {inquirySuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-sm text-emerald-900">
                <p className="font-semibold">Inquiry submitted successfully.</p>
                <p className="mt-0.5">
                  Our editorial and customer support desk has received your message and will respond shortly.
                </p>
              </div>
            </div>
          )}

          {inquiryError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-md">
              {inquiryError}
            </div>
          )}

          <form onSubmit={handleInquirySubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Phone / WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Related Book (Optional)
                </label>
                <select
                  value={bookId}
                  onChange={(e) => setBookId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
                >
                  <option value="">General Inquiry</option>
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Subject *</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Order assistance, bulk copy quote, or title inquiry"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Message *</label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message here..."
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0B192C] text-white text-sm font-semibold rounded-md hover:bg-[#132642] transition-colors disabled:opacity-60 cursor-pointer"
            >
              <Send className="w-4 h-4 text-[#DFC166]" />
              <span>{submitting ? 'Sending...' : 'Submit Inquiry'}</span>
            </button>
          </form>
        </div>

        {/* Right: Order Tracking + Direct Contact Info */}
        <div className="lg:col-span-5 space-y-6">
          {/* Order Status Lookup */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <PackageSearch className="w-5 h-5 text-[#9F7918]" />
              <h2 className="font-serif text-xl font-bold text-[#0B192C]">Track Your Order</h2>
            </div>
            <p className="text-xs text-slate-600">
              Enter your order reference number (e.g. BP-1001) and the email used at checkout.
            </p>

            <form onSubmit={handleOrderLookup} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Order Number *
                </label>
                <input
                  type="text"
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="BP-..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono focus:border-[#0B192C] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Order Email *
                </label>
                <input
                  type="email"
                  required
                  value={lookupEmail}
                  onChange={(e) => setLookupEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={lookupLoading}
                className="w-full py-2.5 bg-[#0B192C] text-white text-sm font-semibold rounded-md hover:bg-[#132642] transition-colors cursor-pointer"
              >
                {lookupLoading ? 'Checking...' : 'Check Order Status'}
              </button>
            </form>

            {lookupError && (
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded">
                {lookupError}
              </p>
            )}

            {foundOrder && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-semibold text-[#0B192C]">
                    {foundOrder.order_number}
                  </span>
                  <span className="text-xs font-semibold uppercase text-[#9F7918]">
                    {foundOrder.order_status}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Placed on {formatDate(foundOrder.created_at)} · Payment:{' '}
                  <span className="capitalize">{foundOrder.payment_status}</span>
                </p>
                <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
                  {foundOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span className="truncate pr-2">
                        {item.book_title} × {item.quantity}
                      </span>
                      <span className="font-mono tabular-nums">
                        {formatPrice(item.line_total, storeConfig.currency)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-semibold text-[#0B192C]">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {formatPrice(foundOrder.total_amount, storeConfig.currency)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Direct Publisher Contact Card */}
          <div className="bg-[#0B192C] text-white rounded-lg p-6 space-y-4">
            <h2 className="font-serif text-xl font-bold">Direct Publisher Desk</h2>
            <div className="space-y-3 text-sm text-slate-300">
              {storeConfig.support_email && (
                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-[#DFC166] shrink-0 mt-0.5" />
                  <span>{storeConfig.support_email}</span>
                </div>
              )}
              {storeConfig.support_phone && (
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-[#DFC166] shrink-0 mt-0.5" />
                  <span className="tabular-nums">{storeConfig.support_phone}</span>
                </div>
              )}
              {storeConfig.business_address && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#DFC166] shrink-0 mt-0.5" />
                  <span>{storeConfig.business_address}</span>
                </div>
              )}

              {!storeConfig.support_email &&
                !storeConfig.support_phone &&
                !storeConfig.business_address && (
                  <p className="text-xs text-slate-400">
                    Use the contact form on this page to reach the owner directly. Storefront phone,
                    email, and office address can be configured in the Admin Store Settings.
                  </p>
                )}
            </div>

            {sanitizedWhatsapp && (
              <a
                href={`https://wa.me/${sanitizedWhatsapp}?text=${encodeURIComponent(
                  'Hello Bhagwati Publications, I have an inquiry regarding your books.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-700 text-white text-sm font-semibold rounded-md hover:bg-emerald-800 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
