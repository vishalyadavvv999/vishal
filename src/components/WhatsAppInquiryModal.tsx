import { useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, MessageSquare, X } from 'lucide-react';
import type { Book, StoreConfig } from '../types';
import { api } from '../lib/api';

interface WhatsAppInquiryModalProps {
  book: Book | null;
  storeConfig: StoreConfig;
  onClose: () => void;
}

export function WhatsAppInquiryModal({ book, storeConfig, onClose }: WhatsAppInquiryModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(
    book
      ? `Hello Bhagwati Publications, I would like to inquire about "${book.title}" (ISBN: ${book.isbn}).`
      : ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (book) {
      setMessage(
        `Hello Bhagwati Publications, I would like to inquire about "${book.title}" (ISBN: ${book.isbn}).`
      );
      setSubmitted(false);
      setError('');
    }
  }, [book]);

  if (!book) return null;

  const sanitizedWhatsapp = storeConfig.whatsapp_number.replace(/[^\d]/g, '');
  const whatsappHref = sanitizedWhatsapp
    ? `https://wa.me/${sanitizedWhatsapp}?text=${encodeURIComponent(
        `${message}\n\nCustomer: ${name || 'Reader'}${phone ? ` (${phone})` : ''}`
      )}`
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.createInquiry({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        subject: `Book Inquiry: ${book.title}`,
        book_id: book.id,
        channel: 'whatsapp',
        message: message.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send inquiry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#07111E]/70 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wa-inquiry-title"
    >
      <div className="bg-white border border-slate-200 rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 bg-[#0B192C] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-[#DFC166]" />
            <h2 id="wa-inquiry-title" className="font-serif text-lg font-semibold">
              WhatsApp & Direct Book Inquiry
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close inquiry modal"
            className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="space-y-4 text-center py-4">
              <CheckCircle2 className="w-11 h-11 text-emerald-700 mx-auto" />
              <div className="space-y-1.5">
                <h3 className="font-serif text-xl font-semibold text-[#0B192C]">
                  Inquiry Recorded
                </h3>
                <p className="text-sm text-slate-600">
                  Your inquiry regarding <span className="font-medium text-[#0B192C]">{book.title}</span> has been sent to the publisher desk.
                </p>
              </div>

              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full px-5 py-2.5 bg-emerald-700 text-white text-sm font-semibold rounded-md hover:bg-emerald-800 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Continue Chat on WhatsApp</span>
                </a>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600 space-y-0.5">
                <p className="font-semibold text-[#0B192C] text-sm">{book.title}</p>
                <p>
                  {book.author} · <span className="font-mono">ISBN {book.isbn}</span>
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-md">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 ..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
                  />
                </div>
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
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Inquiry Message *
                </label>
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-[#0B192C] text-white text-sm font-semibold rounded-md hover:bg-[#132642] transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Send Inquiry'}
                </button>
                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-emerald-700 text-emerald-800 text-sm font-semibold rounded-md hover:bg-emerald-50 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open WhatsApp</span>
                  </a>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
