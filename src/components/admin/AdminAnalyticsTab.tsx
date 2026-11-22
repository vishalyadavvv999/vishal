import { useEffect, useState } from 'react';
import { BarChart3, BookOpen, MessageSquare, RefreshCw, Star, TrendingUp } from 'lucide-react';
import type { AdminAnalytics, CurrencyCode } from '../../types';
import { api } from '../../lib/api';
import { formatPrice } from '../../lib/currency';

interface AdminAnalyticsTabProps {
  currency: CurrencyCode;
}

export function AdminAnalyticsTab({ currency }: AdminAnalyticsTabProps) {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.adminAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white border border-slate-200 rounded-lg" />
          ))}
        </div>
        <div className="h-72 bg-white border border-slate-200 rounded-lg" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="bg-white border border-rose-200 rounded-lg p-6 text-sm text-rose-800 flex items-center justify-between">
        <span>{error || 'Analytics unavailable.'}</span>
        <button
          type="button"
          onClick={loadAnalytics}
          className="px-3 py-1.5 bg-[#0B192C] text-white text-xs font-semibold rounded cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const maxMonthlyRevenue = Math.max(
    1,
    ...analytics.monthly_revenue.map((m) => m.revenue)
  );
  const totalOrdersCount = analytics.order_status_breakdown.reduce((sum, s) => sum + s.count, 0);
  const safeOrdersDenom = Math.max(1, totalOrdersCount);
  const totalInquiriesCount = analytics.inquiry_channels.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#0B192C]">
            Publishing & Sales Analytics
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Live SQLite metrics across catalog inventory, order fulfillment, customer reviews, and inquiries.
          </p>
        </div>
        <button
          type="button"
          onClick={loadAnalytics}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-[#0B192C] hover:bg-slate-50 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Net Order Revenue</span>
            <TrendingUp className="w-4 h-4 text-[#9F7918]" />
          </div>
          <p className="text-2xl font-bold text-[#0B192C] mt-1 font-mono tabular-nums">
            {formatPrice(analytics.kpis.net_revenue, currency)}
          </p>
          <p className="text-xs text-slate-600 mt-1 tabular-nums">
            Avg Order: {formatPrice(analytics.kpis.avg_order_value, currency)}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Units & Orders</span>
            <BarChart3 className="w-4 h-4 text-[#0B192C]" />
          </div>
          <p className="text-2xl font-bold text-[#0B192C] mt-1 font-mono tabular-nums">
            {analytics.kpis.total_units_sold} copies
          </p>
          <p className="text-xs text-slate-600 mt-1 tabular-nums">
            Across {totalOrdersCount} total orders
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Inventory Stock Valuation</span>
            <BookOpen className="w-4 h-4 text-[#0B192C]" />
          </div>
          <p className="text-2xl font-bold text-[#0B192C] mt-1 font-mono tabular-nums">
            {analytics.kpis.total_stock_units} units
          </p>
          <p className="text-xs text-amber-700 mt-1 tabular-nums">
            {formatPrice(analytics.kpis.inventory_retail_value, currency)} ·{' '}
            {analytics.kpis.low_stock_titles} low stock
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Reader Rating & Desk</span>
            <Star className="w-4 h-4 text-[#C59B27]" />
          </div>
          <p className="text-2xl font-bold text-[#0B192C] mt-1 font-mono tabular-nums">
            {analytics.kpis.average_rating > 0 ? `${analytics.kpis.average_rating} / 5` : '—'}
          </p>
          <p className="text-xs text-slate-600 mt-1 tabular-nums">
            {analytics.kpis.total_reviews} reviews · {totalInquiriesCount} total inquiries
          </p>
        </div>
      </div>

      {/* Revenue Timeline + Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-serif text-base font-bold text-[#0B192C]">
              Monthly Revenue Trend
            </h3>
            <span className="text-xs text-slate-500">Last 6 months</span>
          </div>

          {analytics.monthly_revenue.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">
              No monthly revenue records yet. Orders placed on the storefront will populate this chart automatically.
            </p>
          ) : (
            <div className="space-y-3 pt-1">
              {analytics.monthly_revenue.map((m) => {
                const widthPct = Math.max(6, Math.round((m.revenue / maxMonthlyRevenue) * 100));
                return (
                  <div key={m.month} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-medium text-[#0B192C]">{m.month}</span>
                      <span className="font-mono tabular-nums text-slate-700">
                        {formatPrice(m.revenue, currency)} · {m.order_count}{' '}
                        {m.order_count === 1 ? 'order' : 'orders'}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0B192C] rounded-full transition-all"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-serif text-base font-bold text-[#0B192C]">
              Fulfillment & Payment Mix
            </h3>
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Order Status
            </p>
            {analytics.order_status_breakdown.length === 0 ? (
              <p className="text-xs text-slate-500">No orders placed yet.</p>
            ) : (
              analytics.order_status_breakdown.map((s) => {
                const pct = Math.round((s.count / safeOrdersDenom) * 100);
                return (
                  <div key={s.status} className="flex items-center gap-3 text-xs">
                    <span className="w-20 capitalize font-medium text-[#0B192C]">{s.status}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#C59B27] rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="font-mono tabular-nums text-slate-600 w-14 text-right">
                      {s.count} ({pct}%)
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Payment Methods
            </p>
            {analytics.payment_method_breakdown.length === 0 ? (
              <p className="text-xs text-slate-500">No payment data yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {analytics.payment_method_breakdown.map((pm) => (
                  <div key={pm.method} className="py-1.5 flex items-center justify-between text-xs">
                    <span className="uppercase font-medium text-[#0B192C]">{pm.method}</span>
                    <span className="font-mono tabular-nums text-slate-600">
                      {pm.count} orders · {formatPrice(pm.revenue, currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#9F7918]" />
              <span>Inquiry Channels</span>
            </p>
            {analytics.inquiry_channels.length === 0 ? (
              <p className="text-xs text-slate-500">No inquiries logged yet.</p>
            ) : (
              <div className="flex flex-wrap gap-3 text-xs">
                {analytics.inquiry_channels.map((ch) => (
                  <span key={ch.channel} className="font-mono text-slate-700 tabular-nums">
                    {ch.channel.toUpperCase()}: <strong>{ch.count}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Performance & Top Performing Books */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200">
            <h3 className="font-serif text-base font-bold text-[#0B192C]">
              Category Inventory & Sales
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Subject</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Titles</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Stock</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Units Sold</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analytics.category_performance.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-[#0B192C]">{cat.name}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                      {cat.book_count}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                      {cat.stock_units}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                      {cat.units_sold}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums font-semibold text-[#0B192C]">
                      {formatPrice(cat.revenue, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200">
            <h3 className="font-serif text-base font-bold text-[#0B192C]">
              Top Performing Titles
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Title & Author</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Rating</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Sold</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analytics.top_books.map((bk) => (
                  <tr key={bk.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-[#0B192C] truncate max-w-[200px]">
                        {bk.title}
                      </p>
                      <p className="text-[11px] text-slate-500">{bk.author}</p>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-700">
                      {bk.review_count > 0 ? `${bk.average_rating} (${bk.review_count})` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                      {bk.units_sold}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums font-semibold text-[#0B192C]">
                      {formatPrice(bk.revenue, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
