import { ExternalLink, Mail, MapPin, MessageSquare, Phone } from 'lucide-react';
import type { StoreConfig } from '../types';
import { LanguageToggle, useLanguage } from '../lib/i18n';
import type { AppView } from './Navbar';

interface FooterProps {
  storeConfig: StoreConfig;
  onNavigate: (view: AppView) => void;
}

export function Footer({ storeConfig, onNavigate }: FooterProps) {
  const { language, t } = useLanguage();
  const sanitizedWhatsapp = storeConfig.whatsapp_number.replace(/[^\d]/g, '');

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
              {language === 'hi'
                ? t('brandName')
                : storeConfig.publisher_name || 'Bhagwati Publications'}
            </h2>
            <p className="text-sm text-slate-300 max-w-md leading-relaxed">
              {language === 'hi'
                ? 'उत्कृष्ट शोध, साहित्य और सटीक पुस्तक निर्माण के लिए समर्पित स्वतंत्र प्रकाशन गृह। हमारी सूची से सैंपल पढ़ें, सीधे पूछताछ करें और प्रमाणित संस्करण ऑर्डर करें।'
                : 'An independent publishing house dedicated to enduring scholarship, literature, and precision book production. Browse sample chapters, inquire directly, and order verified editions from our catalog.'}
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-4">
              <a
                href="https://www.globaleauctions.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-[#DFC166] transition-colors"
              >
                <span>{t('footerPartner')}</span>
                <span className="font-semibold text-[#DFC166] underline underline-offset-4">
                  Global E-Auction
                </span>
                <ExternalLink className="w-3 h-3 text-[#DFC166]" />
              </a>

              <LanguageToggle variant="dark" />
            </div>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#DFC166]">
              {t('footerPublications')}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('catalog')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t('catalogTitle')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('categories')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t('browseCategoriesTitle')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('new-arrivals')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t('navNewReleases')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('authors')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t('ourAuthorsTitle')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('updates')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t('updatesTitle')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('about')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t('navAbout')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('wishlist')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t('wishlistTitle')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('support')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t('footerTrackOrder')}
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#DFC166]">
              {t('footerPublisherDesk')}
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
                {language === 'hi'
                  ? 'प्रकाशक एडमिन सेटिंग्स से संपर्क विवरण कॉन्फ़िगर कर सकते हैं।'
                  : 'Contact details can be configured by the publisher in Admin Store Settings.'}
              </p>
            )}

            <div className="pt-2 flex flex-wrap items-center gap-4">
              {sanitizedWhatsapp && (
                <a
                  href={`https://wa.me/${sanitizedWhatsapp}?text=${encodeURIComponent(
                    'Hello Bhagwati Publications, I would like to inquire about your publications.'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:text-emerald-200 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Desk</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="text-xs font-medium text-[#DFC166] hover:text-white underline underline-offset-4 cursor-pointer"
              >
                {t('footerAdminPortal')}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            © {new Date().getFullYear()} {storeConfig.publisher_name || 'Bhagwati Publications'}.{' '}
            {language === 'hi' ? 'सर्वाधिकार सुरक्षित।' : 'All rights reserved.'}
          </p>
          <p>
            {t('footerDevelopedBy')}{' '}
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
