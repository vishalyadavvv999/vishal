import { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ExternalLink,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  PackageSearch,
  Phone,
  Send,
  Truck,
  XCircle,
} from 'lucide-react';
import type { Book, Order, OrderStatus, StoreConfig } from '../types';
import { api } from '../lib/api';
import { formatDate, formatPrice } from '../lib/currency';
import { LanguageToggle, useLanguage } from '../lib/i18n';

interface SupportViewProps {
  books: Book[];
  storeConfig: StoreConfig;
  initialOrderNumber?: string;
}

const ORDER_STEPS: Array<{ key: OrderStatus; en: string; hi: string }> = [
  { key: 'pending', en: 'Order Placed', hi: 'ऑर्डर प्राप्त' },
  { key: 'confirmed', en: 'Confirmed', hi: 'पुष्टिकृत' },
  { key: 'shipped', en: 'Shipped', hi: 'भेजा गया' },
  { key: 'delivered', en: 'Delivered', hi: 'वितरित' },
];

export function SupportView({ books, storeConfig, initialOrderNumber = '' }: SupportViewProps) {
  const { language, t } = useLanguage();

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
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [lookupContact, setLookupContact] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (initialOrderNumber) {
      setOrderNumber(initialOrderNumber);
    }
  }, [initialOrderNumber]);

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
      const res = await api.lookupOrder(orderNumber.trim(), lookupContact.trim());
      setFoundOrder(res.order);
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'Order not found');
    } finally {
      setLookupLoading(false);
    }
  };

  const getStepIndex = (status: OrderStatus): number => {
    const idx = ORDER_STEPS.findIndex((s) => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  return (
    <div className="bg-[#F9FAFB] min-h-[75vh]">
      <section className="bg-[#0B192C] text-white py-12 border-b border-[#1D3557]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="w-12 h-px bg-[#C59B27]" />
            <h1 className="font-serif text-3xl sm:text-4xl font-bold">{t('supportHeading')}</h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
              {t('supportSubtitle')}
            </p>
          </div>
          <LanguageToggle variant="dark" />
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Customer Order Tracking + Contact Form */}
        <div className="lg:col-span-7 space-y-8">
          {/* Interactive Order Tracking Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-2.5">
              <PackageSearch className="w-5 h-5 text-[#9F7918]" />
              <div>
                <h2 className="font-serif text-2xl font-bold text-[#0B192C]">
                  {t('trackOrderHeading')}
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">{t('trackOrderHelp')}</p>
              </div>
            </div>

            <form onSubmit={handleOrderLookup} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-4">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {language === 'hi' ? 'ऑर्डर नंबर *' : 'Order Number *'}
                </label>
                <input
                  type="text"
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="BP-..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm font-mono focus:border-[#0B192C] focus:outline-none"
                />
              </div>
              <div className="sm:col-span-5">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {language === 'hi' ? 'ईमेल या फ़ोन नंबर *' : 'Order Email or Phone *'}
                </label>
                <input
                  type="text"
                  required
                  value={lookupContact}
                  onChange={(e) => setLookupContact(e.target.value)}
                  placeholder="you@example.com / +91..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
                />
              </div>
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="w-full py-2.5 bg-[#0B192C] text-white text-sm font-semibold rounded-md hover:bg-[#132642] transition-colors cursor-pointer whitespace-nowrap"
                >
                  {lookupLoading
                    ? language === 'hi'
                      ? 'जाँच रहा है...'
                      : 'Checking...'
                    : language === 'hi'
                      ? 'ऑर्डर ट्रैक करें'
                      : 'Track Order'}
                </button>
              </div>
            </form>

            {lookupError && (
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded">
                {lookupError}
              </p>
            )}

            {foundOrder && (
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg space-y-5 text-sm">
                <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <span className="font-mono text-base font-bold text-[#0B192C]">
                      {foundOrder.order_number}
                    </span>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {language === 'hi' ? 'तिथि:' : 'Placed on'} {formatDate(foundOrder.created_at)} ·{' '}
                      {language === 'hi' ? 'भुगतान:' : 'Payment:'}{' '}
                      <span className="capitalize font-medium text-[#0B192C]">
                        {foundOrder.payment_status}
                      </span>{' '}
                      ({foundOrder.payment_method.toUpperCase()})
                    </p>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#9F7918]">
                    {foundOrder.order_status}
                  </span>
                </div>

                {/* Visual Fulfillment Timeline */}
                {foundOrder.order_status === 'cancelled' ? (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-md flex items-center gap-2.5 text-xs text-rose-800">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>
                      {language === 'hi'
                        ? 'यह ऑर्डर रद्द कर दिया गया है। किसी भी सहायता के लिए कृपया हमारे सहायता डेस्क से संपर्क करें।'
                        : 'This order has been cancelled. Contact our publisher desk if you need assistance.'}
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {ORDER_STEPS.map((step, idx) => {
                      const currentIdx = getStepIndex(foundOrder.order_status);
                      const completed = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;
                      return (
                        <div
                          key={step.key}
                          className={`p-3 rounded-md border text-xs ${
                            completed
                              ? 'bg-white border-[#C59B27] text-[#0B192C]'
                              : 'bg-slate-100 border-slate-200 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono tabular-nums">0{idx + 1}</span>
                            {completed ? (
                              step.key === 'shipped' ? (
                                <Truck className="w-3.5 h-3.5 text-[#9F7918]" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-emerald-700" />
                              )
                            ) : (
                              <Package className="w-3.5 h-3.5 text-slate-300" />
                            )}
                          </div>
                          <p className={`font-semibold ${isCurrent ? 'text-[#0B192C]' : ''}`}>
                            {step[language]}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 pt-1">
                  <div>
                    <p className="font-semibold text-[#0B192C] mb-1">
                      {language === 'hi' ? 'डिलीवरी पता' : 'Shipping Destination'}
                    </p>
                    <p>{foundOrder.customer_name}</p>
                    <p>
                      {foundOrder.shipping_address}, {foundOrder.city}, {foundOrder.state}{' '}
                      {foundOrder.postal_code}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-[#0B192C] mb-1">
                      {language === 'hi' ? 'ऑर्डर आइटम' : 'Ordered Editions'}
                    </p>
                    {foundOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between gap-2">
                        <span className="truncate">
                          {item.book_title} × {item.quantity}
                        </span>
                        <span className="font-mono tabular-nums shrink-0">
                          {formatPrice(item.line_total, storeConfig.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="font-semibold text-[#0B192C] text-sm">
                    {language === 'hi' ? 'कुल राशि:' : 'Total Amount:'}{' '}
                    <span className="font-mono tabular-nums">
                      {formatPrice(foundOrder.total_amount, storeConfig.currency)}
                    </span>
                  </div>

                  {sanitizedWhatsapp && (
                    <a
                      href={`https://wa.me/${sanitizedWhatsapp}?text=${encodeURIComponent(
                        `Hello Bhagwati Publications, I am checking on Order ${foundOrder.order_number} (Status: ${foundOrder.order_status}).`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-md hover:bg-emerald-800 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>
                        {language === 'hi'
                          ? 'ऑर्डर सहायता (WhatsApp)'
                          : 'Order Support on WhatsApp'}
                      </span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Customer Contact Form */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#0B192C]">
                {t('sendMessageHeading')}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {language === 'hi'
                  ? 'थोक ऑर्डर, पुस्तक उपलब्धता या प्रकाशन संबंधी प्रश्नों के लिए संपर्क करें।'
                  : 'Questions regarding bulk orders, book availability, or publishing inquiries.'}
              </p>
            </div>

            {inquirySuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-sm text-emerald-900">
                  <p className="font-semibold">
                    {language === 'hi'
                      ? 'आपका संदेश सफलतापूर्वक भेज दिया गया है।'
                      : 'Inquiry submitted successfully.'}
                  </p>
                  <p className="mt-0.5">
                    {language === 'hi'
                      ? 'हमारी संपादकीय एवं सहायता टीम शीघ्र ही आपसे संपर्क करेगी।'
                      : 'Our editorial and customer support desk has received your message and will respond shortly.'}
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
                    {language === 'hi' ? 'आपका नाम *' : 'Your Name *'}
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
                    {language === 'hi' ? 'ईमेल पता *' : 'Email Address *'}
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
                    {language === 'hi' ? 'फ़ोन / व्हाट्सएप नंबर' : 'Phone / WhatsApp Number'}
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
                    {language === 'hi' ? 'संबंधित पुस्तक (वैकल्पिक)' : 'Related Book (Optional)'}
                  </label>
                  <select
                    value={bookId}
                    onChange={(e) => setBookId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
                  >
                    <option value="">{language === 'hi' ? 'सामान्य पूछताछ' : 'General Inquiry'}</option>
                    {books.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {language === 'hi' ? 'विषय *' : 'Subject *'}
                </label>
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
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {language === 'hi' ? 'संदेश *' : 'Message *'}
                </label>
                <textarea
                  required
                  rows={4}
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
                <span>
                  {submitting
                    ? language === 'hi'
                      ? 'भेजा जा रहा है...'
                      : 'Sending...'
                    : language === 'hi'
                      ? 'पूछताछ भेजें'
                      : 'Submit Inquiry'}
                </span>
              </button>
            </form>
          </div>
        </div>

        {/* Right: Direct Publisher Contact Card + WhatsApp Integration */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0B192C] text-white rounded-lg p-6 sm:p-7 space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#DFC166]">
                {t('footerPublisherDesk')}
              </p>
              <h2 className="font-serif text-2xl font-bold mt-1">
                {language === 'hi' ? 'सीधा प्रकाशक संपर्क' : 'Direct Publisher Desk'}
              </h2>
            </div>

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
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {language === 'hi'
                      ? 'प्रकाशक से सीधे संपर्क करने के लिए बाईं ओर दिया गया फ़ॉर्म उपयोग करें। फ़ोन, ईमेल और कार्यालय का पता एडमिन सेटिंग्स से जोड़ा जा सकता है।'
                      : 'Use the contact form on this page to reach the publisher directly. Phone, email, and office address can be configured in Admin Store Settings.'}
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
                className="inline-flex items-center justify-center gap-2 w-full py-3 bg-emerald-700 text-white text-sm font-semibold rounded-md hover:bg-emerald-800 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{language === 'hi' ? 'व्हाट्सएप पर चैट करें' : 'Chat on WhatsApp'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
