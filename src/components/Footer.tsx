import { ExternalLink, Mail, MapPin, Phone } from 'lucide-react';
import type { StoreConfig } from '../types';
import type { AppView } from './Navbar';

interface FooterProps {
  storeConfig: StoreConfig;
  onNavigate: (view: AppView) => void;
}

export function Footer({ storeConfig, onNavigate }: FooterProps) {
  const hasContactInfo =
    Boolean(storeConfig.support_email) ||
    Boolean(storeConfig.support_phone) ||
    Boolean(storeConfig.business_address);

  return (
    <footer className="bg-[#0B192C] text-slate-300 border-t border-[#1D3557]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5 space-y-4">
            <h2 className="font-serif text-2xl font-bold text-white">
              {storeConfig.publisher_name || 'Bhagwati Publications'}
            </h2>
            <p className="text-sm text-slate-300 max-w-md leading-relaxed">
              An independent publishing house dedicated to enduring scholarship, literature, and
              precision book production. Browse sample chapters, inquire directly, and order
              verified editions from our catalog.
            </p>
            <div className="pt-1">
              <a
                href="https://www.globaleauctions.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-[#DFC166] transition-colors"
              >
                <span>Supporting Digital Partner:</span>
                <span className="font-semibold text-[#DFC166] underline underline-offset-4">
                  Global E-Auction
                </span>
                <ExternalLink className="w-3 h-3 text-[#DFC166]" />
              </a>
            </div>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#DFC166]">
              Publications
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('catalog')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Complete Catalog
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('new-arrivals')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  New Releases
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('authors')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Authors &amp; Editors
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('wishlist')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  My Wishlist
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('support')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Customer Support &amp; Order Tracking
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#DFC166]">
              Publisher Desk
            </h3>
            {hasContactInfo ? (
              <ul className="space-y-2.5 text-sm text-slate-300">
                {storeConfig.support_email && (
                  <li className="flex items-start gap-2">
                    <Mail className="w-4 h-4 text-[#C59B27] shrink-0 mt-0.5" />
                    <span className="break-all">{storeConfig.support_email}</span>
                  </li>
                )}
                {storeConfig.support_phone && (
                  <li className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-[#C59B27] shrink-0 mt-0.5" />
                    <span className="tabular-nums">{storeConfig.support_phone}</span>
                  </li>
                )}
                {storeConfig.business_address && (
                  <li className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#C59B27] shrink-0 mt-0.5" />
                    <span>{storeConfig.business_address}</span>
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-slate-400 leading-relaxed">
                Contact details can be configured by the publisher in Admin Store Settings.
              </p>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="text-xs font-medium text-[#DFC166] hover:text-white underline underline-offset-4 cursor-pointer"
              >
                Owner Admin Portal
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            © {new Date().getFullYear()} {storeConfig.publisher_name || 'Bhagwati Publications'}. All rights reserved.
          </p>
          <p>
            Website Developed &amp; Managed by{' '}
            <a
              href="https://www.globaleauctions.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#DFC166] hover:text-white font-semibold underline underline-offset-4 transition-colors"
            >
              Global E-Auction
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
