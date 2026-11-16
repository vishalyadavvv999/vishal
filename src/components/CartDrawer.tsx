import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import type { CartItem, StoreConfig } from '../types';
import { formatPrice } from '../lib/currency';
import { BookCoverImage } from './BookCoverImage';

interface CartDrawerProps {
  open: boolean;
  items: CartItem[];
  storeConfig: StoreConfig;
  onClose: () => void;
  onUpdateQuantity: (bookId: number, quantity: number) => void;
  onRemoveItem: (bookId: number) => void;
  onProceedToCheckout: () => void;
}

export function CartDrawer({
  open,
  items,
  storeConfig,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}: CartDrawerProps) {
  if (!open) return null;

  const subtotal = items.reduce((sum, item) => sum + item.book.price * item.quantity, 0);
  const freeThreshold = storeConfig.free_shipping_threshold;
  const standardFee = storeConfig.standard_shipping_fee;
  const shippingFee =
    subtotal === 0 || (freeThreshold > 0 && subtotal >= freeThreshold) ? 0 : standardFee;
  const total = subtotal + shippingFee;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#07111E]/60 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl border-l border-slate-200"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Bag"
      >
        <div className="px-6 py-4 bg-[#0B192C] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#DFC166]" />
            <h2 className="font-serif text-lg font-semibold">
              Shopping Bag ({items.reduce((acc, i) => acc + i.quantity, 0)})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close bag"
            className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-3">
              <ShoppingBag className="w-10 h-10 text-slate-300" strokeWidth={1.5} />
              <h3 className="font-serif text-lg font-semibold text-[#0B192C]">Your bag is empty</h3>
              <p className="text-sm text-slate-500 max-w-xs">
                Explore our catalog of editions and add titles to begin your order.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-5 py-2.5 bg-[#0B192C] text-white text-sm font-medium rounded-md hover:bg-[#132642] cursor-pointer"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            items.map(({ book, quantity }) => (
              <div
                key={book.id}
                className="flex gap-4 pb-5 border-b border-slate-100 last:border-b-0"
              >
                <div className="w-20 aspect-[3/4] shrink-0 rounded overflow-hidden border border-slate-200 bg-slate-50">
                  <BookCoverImage src={book.cover_url} title={book.title} author={book.author} />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif text-sm font-semibold text-[#0B192C] line-clamp-2">
                        {book.title}
                      </h3>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(book.id)}
                        aria-label={`Remove ${book.title}`}
                        className="p-1 text-slate-400 hover:text-rose-700 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{book.author}</p>
                    <p className="font-mono text-[11px] text-slate-400 mt-0.5">ISBN {book.isbn}</p>
                  </div>

                  <div className="flex items-center justify-between gap-3 mt-3">
                    <div className="inline-flex items-center border border-slate-200 rounded-md">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(book.id, quantity - 1)}
                        aria-label="Decrease quantity"
                        className="p-1.5 text-slate-600 hover:bg-slate-50 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 text-xs font-mono font-medium tabular-nums">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        disabled={quantity >= book.stock_quantity}
                        onClick={() => onUpdateQuantity(book.id, quantity + 1)}
                        aria-label="Increase quantity"
                        className="p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-sm font-semibold text-[#0B192C] tabular-nums">
                      {formatPrice(book.price * quantity, storeConfig.currency)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-medium text-[#0B192C] tabular-nums">
                  {formatPrice(subtotal, storeConfig.currency)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span className="font-medium text-[#0B192C] tabular-nums">
                  {shippingFee === 0 ? 'Free' : formatPrice(shippingFee, storeConfig.currency)}
                </span>
              </div>
              {freeThreshold > 0 && subtotal < freeThreshold && (
                <p className="text-xs text-[#9F7918]">
                  Add {formatPrice(freeThreshold - subtotal, storeConfig.currency)} more for complimentary shipping.
                </p>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-semibold text-[#0B192C]">
                <span>Estimated Total</span>
                <span className="tabular-nums">{formatPrice(total, storeConfig.currency)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onProceedToCheckout}
              className="w-full py-3 bg-[#0B192C] text-white text-sm font-semibold rounded-md hover:bg-[#132642] transition-colors cursor-pointer"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
