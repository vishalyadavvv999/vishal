import { useMemo, useState } from 'react';
import { CheckCircle2, CreditCard, Lock, ShieldCheck, X } from 'lucide-react';
import type { CartItem, Order, StoreConfig } from '../types';
import { formatPrice } from '../lib/currency';
import { api } from '../lib/api';

interface CheckoutModalProps {
  open: boolean;
  items: CartItem[];
  storeConfig: StoreConfig;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export function CheckoutModal({
  open,
  items,
  storeConfig,
  onClose,
  onOrderSuccess,
}: CheckoutModalProps) {
  const paymentOptions = useMemo(() => {
    const opts: Array<{ id: string; label: string; description: string }> = [];
    if (storeConfig.payment_cod_enabled) {
      opts.push({
        id: 'cod',
        label: 'Cash on Delivery (COD)',
        description: 'Pay upon physical delivery of your books.',
      });
    }
    if (storeConfig.payment_upi_enabled) {
      opts.push({
        id: 'upi',
        label: 'Direct UPI Transfer',
        description: storeConfig.payment_upi_id
          ? `Transfer to UPI ID: ${storeConfig.payment_upi_id} and enter your reference below.`
          : 'Pay via UPI and provide your transaction reference.',
      });
    }
    if (
      storeConfig.payment_gateway_provider !== 'none' &&
      storeConfig.payment_gateway_public_key
    ) {
      const providerTitle =
        storeConfig.payment_gateway_provider.charAt(0).toUpperCase() +
        storeConfig.payment_gateway_provider.slice(1);
      opts.push({
        id: `gateway_${storeConfig.payment_gateway_provider}`,
        label: `Online Payment (${providerTitle})`,
        description: `Configured ${storeConfig.payment_gateway_mode.toUpperCase()} gateway integration.`,
      });
    }
    if (opts.length === 0) {
      opts.push({
        id: 'cod',
        label: 'Pay on Delivery / Publisher Invoice',
        description: 'Direct order confirmation with publisher dispatch.',
      });
    }
    return opts;
  }, [storeConfig]);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(paymentOptions[0]?.id || 'cod');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  if (!open) return null;

  const subtotal = items.reduce((sum, item) => sum + item.book.price * item.quantity, 0);
  const shippingFee =
    subtotal === 0 ||
    (storeConfig.free_shipping_threshold > 0 && subtotal >= storeConfig.free_shipping_threshold)
      ? 0
      : storeConfig.standard_shipping_fee;
  const total = subtotal + shippingFee;

  const activeMethod = paymentOptions.find((p) => p.id === paymentMethod) ? paymentMethod : paymentOptions[0].id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await api.createOrder({
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim(),
        shipping_address: shippingAddress.trim(),
        city: city.trim(),
        state: stateName.trim(),
        postal_code: postalCode.trim(),
        payment_method: activeMethod,
        payment_reference: paymentReference.trim(),
        notes: notes.trim(),
        items: items.map((i) => ({ book_id: i.book.id, quantity: i.quantity })),
      });
      setConfirmedOrder(result.order);
      onOrderSuccess(result.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#07111E]/75 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-3xl my-auto overflow-hidden">
        <div className="px-6 py-4 bg-[#0B192C] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-[#DFC166]" />
            <h2 id="checkout-modal-title" className="font-serif text-lg font-semibold">
              {confirmedOrder ? 'Order Confirmation Receipt' : 'Complete Your Order'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setConfirmedOrder(null);
              onClose();
            }}
            aria-label="Close checkout"
            className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmedOrder ? (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-start gap-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-semibold text-[#0B192C]">
                  Order {confirmedOrder.order_number} Confirmed
                </h3>
                <p className="text-sm text-slate-700">
                  Thank you, {confirmedOrder.customer_name}. Save your order number{' '}
                  <span className="font-mono font-semibold text-[#0B192C]">
                    {confirmedOrder.order_number}
                  </span>{' '}
                  to track fulfillment status on our Support page.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm border-b border-slate-200 pb-6">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Delivery Address
                </h4>
                <p className="font-medium text-[#0B192C]">{confirmedOrder.customer_name}</p>
                <p className="text-slate-600">{confirmedOrder.shipping_address}</p>
                <p className="text-slate-600">
                  {confirmedOrder.city}, {confirmedOrder.state} {confirmedOrder.postal_code}
                </p>
                <p className="text-slate-600 mt-1 tabular-nums">{confirmedOrder.customer_phone}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Payment & Status
                </h4>
                <p className="text-slate-700">
                  Method: <span className="font-medium uppercase">{confirmedOrder.payment_method}</span>
                </p>
                <p className="text-slate-700">
                  Order Status: <span className="font-medium capitalize">{confirmedOrder.order_status}</span>
                </p>
                <p className="text-slate-700">
                  Payment Status: <span className="font-medium capitalize">{confirmedOrder.payment_status}</span>
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Items Ordered
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-md">
                {confirmedOrder.items.map((item) => (
                  <div key={item.id} className="px-4 py-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-[#0B192C]">{item.book_title}</p>
                      <p className="text-xs text-slate-500 font-mono">
                        ISBN {item.book_isbn} · Qty {item.quantity}
                      </p>
                    </div>
                    <span className="font-semibold text-[#0B192C] tabular-nums">
                      {formatPrice(item.line_total, storeConfig.currency)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-2 text-base font-semibold text-[#0B192C]">
                <span>Total Amount</span>
                <span className="tabular-nums">
                  {formatPrice(confirmedOrder.total_amount, storeConfig.currency)}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setConfirmedOrder(null);
                  onClose();
                }}
                className="px-6 py-2.5 bg-[#0B192C] text-white text-sm font-semibold rounded-md hover:bg-[#132642] cursor-pointer"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 lg:grid-cols-5 gap-6 max-h-[82vh] overflow-y-auto">
            <div className="lg:col-span-3 space-y-5">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-md">
                  {error}
                </div>
              )}

              <div>
                <h3 className="font-serif text-base font-semibold text-[#0B192C] mb-3">
                  1. Recipient & Shipping Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">State *</label>
                      <input
                        type="text"
                        required
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Postal Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-serif text-base font-semibold text-[#0B192C] mb-3">
                  2. Payment Method
                </h3>
                <div className="space-y-2.5">
                  {paymentOptions.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-start gap-3 p-3.5 border rounded-md cursor-pointer transition-colors ${
                        activeMethod === option.id
                          ? 'border-[#0B192C] bg-slate-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value={option.id}
                        checked={activeMethod === option.id}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mt-1 accent-[#0B192C]"
                      />
                      <div className="text-sm">
                        <p className="font-semibold text-[#0B192C]">{option.label}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {activeMethod === 'upi' && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      UPI Transaction / UTR Reference (Optional if paying on verification)
                    </label>
                    <input
                      type="text"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="e.g. 429108374621"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono focus:border-[#0B192C] focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Delivery Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special shipping instructions"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
                />
              </div>
            </div>

            {/* Order Summary Column */}
            <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-lg p-5 flex flex-col justify-between space-y-5 h-fit">
              <div className="space-y-4">
                <h3 className="font-serif text-base font-semibold text-[#0B192C]">
                  Order Summary
                </h3>
                <div className="space-y-3 divide-y divide-slate-200">
                  {items.map(({ book, quantity }) => (
                    <div key={book.id} className="pt-2.5 first:pt-0 flex justify-between gap-2 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-[#0B192C] truncate">{book.title}</p>
                        <p className="text-xs text-slate-500 tabular-nums">Qty: {quantity}</p>
                      </div>
                      <span className="font-medium text-[#0B192C] tabular-nums shrink-0">
                        {formatPrice(book.price * quantity, storeConfig.currency)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-200 space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{formatPrice(subtotal, storeConfig.currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Shipping</span>
                    <span className="tabular-nums">
                      {shippingFee === 0 ? 'Free' : formatPrice(shippingFee, storeConfig.currency)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-semibold text-[#0B192C]">
                    <span>Total</span>
                    <span className="tabular-nums">{formatPrice(total, storeConfig.currency)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={submitting || items.length === 0}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[#0B192C] text-white text-sm font-semibold rounded-md hover:bg-[#132642] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 text-[#DFC166]" />
                  <span>{submitting ? 'Placing Order...' : 'Confirm & Place Order'}</span>
                </button>
                <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-[#9F7918]" />
                  <span>Server-verified pricing & stock check</span>
                </p>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
